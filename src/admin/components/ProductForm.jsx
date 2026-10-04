import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { categories } from '@/data/products';
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from '@/lib/productSchema';
import { createProduct, updateProduct } from '@/admin/lib/productWrites';

// Admin product editor: the form component (default export) plus the pure
// form helpers it uses (named exports): form state <-> Firestore document,
// slug and variant-ID rules, and validation.
//
// The form always edits the G1 schema (productSchema.js). Nothing here
// invents a second schema.

export const CATEGORY_OPTIONS = categories.filter((c) => c.key !== 'all');
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Client-side keys for repeatable rows. Generated once when a row is created
// (never during render), so React rows stay stable while editing. They are
// not saved to Firestore.
let rowCounter = 0;
export const newRowKey = () => `row-${++rowCounter}`;

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function numToStr(value) {
  return value === null || value === undefined ? '' : String(value);
}

function text(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed ? trimmed : null;
}

// -> { empty: true } | { invalid: true } | { value: number }
function parseMoney(raw) {
  const s = String(raw ?? '').trim().replace(/,/g, '');
  if (s === '') return { empty: true };
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return { invalid: true };
  return { value: Number(s) };
}

// Deterministic variant ID from its label ("2 Jar Ritual" -> "2-jar-ritual"),
// adding -2, -3… if that ID is already taken. Same input, same output.
export function variantIdFromLabel(label, taken = []) {
  const base = slugify(label);
  if (!base) return '';
  let id = base;
  let n = 2;
  while (taken.includes(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

// Row key -> variant ID. Existing (persisted) variants always keep their
// stored ID; only new variants get an ID generated from their label.
export function computeVariantIds(variants) {
  const taken = variants.filter((v) => v.persisted && v.id).map((v) => v.id);
  const ids = {};
  variants.forEach((v) => {
    if (v.persisted && v.id) {
      ids[v.key] = v.id;
      return;
    }
    const id = variantIdFromLabel(v.label, taken);
    ids[v.key] = id;
    if (id) taken.push(id);
  });
  return ids;
}

export function nextSortOrder(products) {
  const orders = products.map((p) => p.sortOrder).filter((n) => Number.isFinite(n) && n < 9999);
  return (orders.length ? Math.max(...orders) : 0) + 10;
}

export function emptyProductForm(sortOrder = 10) {
  return {
    name: '',
    slug: '',
    subtitle: '',
    category: '',
    shortDesc: '',
    description: '',
    status: 'draft',
    sortOrder: String(sortOrder),
    price: '',
    mrp: '',
    currency: '₹',
    facts: [],
    howToUse: [],
    note: '',
    howToTakeRoute: '',
    imagePrimary: '',
    gallery: [],
    variants: [],
  };
}

// Normalized product (see normalizeProduct) -> form state.
export function productFormFromProduct(p) {
  return {
    name: p.name || '',
    slug: p.slug || '',
    subtitle: p.subtitle || '',
    category: p.category || '',
    shortDesc: p.shortDesc || '',
    description: p.description || '',
    status: p.status || 'draft',
    sortOrder: numToStr(p.sortOrder),
    price: numToStr(p.price),
    mrp: numToStr(p.mrp),
    currency: p.currency || '₹',
    facts: (p.facts || []).map((f) => ({ key: newRowKey(), label: f.label || '', value: f.value || '' })),
    howToUse: (p.howToUse || []).map((t) => ({ key: newRowKey(), text: String(t) })),
    note: p.note || '',
    howToTakeRoute: p.howToTakeRoute || '',
    imagePrimary: p.images?.primary || '',
    gallery: (p.images?.gallery || []).map((url) => ({ key: newRowKey(), url: String(url) })),
    variants: (p.variants || []).map((v) => ({
      key: newRowKey(),
      id: v.id,
      persisted: true,
      label: v.name || '',
      description: v.detail || '',
      jars: String(v.jars ?? 1),
      price: numToStr(v.price),
      mrp: numToStr(v.originalPrice),
      highlight: Boolean(v.highlight),
    })),
  };
}

export function hasErrors(errors) {
  return Object.values(errors || {}).some((v) => (v && typeof v === 'object' ? hasErrors(v) : Boolean(v)));
}

export function validateProductForm(form, { isNew, products = [], editingId = null }) {
  const errors = { variants: {}, facts: {}, gallery: {} };

  if (!form.name.trim()) errors.name = 'Product name is required.';

  const slug = form.slug.trim();
  if (!slug) {
    errors.slug = 'Slug is required.';
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens only (for example "my-product").';
  } else if (products.some((p) => p.id !== editingId && p.slug === slug)) {
    errors.slug = 'Another product already uses this slug.';
  } else if (isNew && products.some((p) => p.id === slug)) {
    errors.slug = `A product with the ID "${slug}" already exists.`;
  }

  if (!PRODUCT_STATUSES.includes(form.status)) errors.status = 'Choose a status.';

  if (!/^-?\d+$/.test(String(form.sortOrder).trim())) errors.sortOrder = 'Enter a whole number.';

  const currency = form.currency.trim();
  if (!currency) errors.currency = 'Currency is required.';
  else if (currency.length > 4) errors.currency = 'Use a short symbol or code.';

  const available = form.status === 'available';
  const price = parseMoney(form.price);
  const mrp = parseMoney(form.mrp);

  if (price.invalid) errors.price = 'Enter a valid amount (numbers only, up to 2 decimals).';
  else if (available && price.empty) errors.price = 'Price is required for an Available product.';
  else if (available && price.value <= 0) errors.price = 'Price must be greater than 0.';

  if (mrp.invalid) errors.mrp = 'Enter a valid amount (numbers only, up to 2 decimals).';
  else if (!mrp.empty && price.value !== undefined && mrp.value < price.value) {
    errors.mrp = 'MRP cannot be lower than the price.';
  }

  if (form.howToTakeRoute.trim() && !form.howToTakeRoute.trim().startsWith('/')) {
    errors.route = 'Must start with "/" (for example /how-to-take-shilajit).';
  }

  if (form.imagePrimary.trim() && !isHttpUrl(form.imagePrimary)) {
    errors.imagePrimary = 'Enter a full image URL starting with https://';
  }
  form.gallery.forEach((row) => {
    if (row.url.trim() && !isHttpUrl(row.url)) errors.gallery[row.key] = 'Enter a full image URL starting with https://';
  });

  form.facts.forEach((row) => {
    const hasLabel = Boolean(row.label.trim());
    const hasValue = Boolean(row.value.trim());
    if (hasLabel !== hasValue) errors.facts[row.key] = 'Fill in both the label and the value, or remove the row.';
  });

  const ids = computeVariantIds(form.variants);
  form.variants.forEach((v) => {
    const e = {};
    if (!v.label.trim()) e.label = 'Label is required.';
    else if (!ids[v.key]) e.label = 'Label needs letters or numbers.';

    if (!/^\d+$/.test(String(v.jars).trim()) || Number(v.jars) < 1) e.jars = 'Whole number, 1 or more.';

    const vp = parseMoney(v.price);
    const vm = parseMoney(v.mrp);
    if (vp.empty) e.price = 'Price is required.';
    else if (vp.invalid || vp.value <= 0) e.price = 'Enter a valid price above 0.';

    if (vm.invalid) e.mrp = 'Enter a valid amount.';
    else if (!vm.empty && vp.value !== undefined && vm.value < vp.value) e.mrp = 'MRP cannot be lower than the price.';

    if (Object.keys(e).length) errors.variants[v.key] = e;
  });

  if (available && form.variants.length > 0 && !errors.price && price.value !== undefined) {
    const variantPrices = form.variants.map((v) => parseMoney(v.price).value).filter((n) => n !== undefined);
    if (!variantPrices.includes(price.value)) {
      errors.price = 'With variants, the base price must equal one variant price (the default option).';
    }
  }

  return errors;
}

// Form state -> Firestore document body (G1 schema). Blank rows are
// dropped, text is trimmed, numbers are real numbers. Never includes the
// document ID or timestamps — the write helpers handle those.
export function productDocFromForm(form) {
  const price = parseMoney(form.price);
  const mrp = parseMoney(form.mrp);
  const ids = computeVariantIds(form.variants);

  return {
    slug: form.slug.trim(),
    name: form.name.trim(),
    subtitle: text(form.subtitle),
    category: form.category || null,
    status: form.status,
    sortOrder: Number(form.sortOrder),
    price: price.value ?? null,
    mrp: mrp.value ?? null,
    currency: form.currency.trim(),
    shortDesc: text(form.shortDesc),
    description: text(form.description),
    facts: form.facts
      .filter((r) => r.label.trim() && r.value.trim())
      .map((r) => ({ label: r.label.trim(), value: r.value.trim() })),
    howToUse: form.howToUse.map((r) => r.text.trim()).filter(Boolean),
    note: text(form.note),
    howToTakeRoute: text(form.howToTakeRoute),
    images: {
      primary: text(form.imagePrimary),
      gallery: form.gallery.map((r) => r.url.trim()).filter(Boolean),
    },
    variants: form.variants.map((v) => ({
      id: ids[v.key],
      label: v.label.trim(),
      description: text(v.description),
      jars: Number(v.jars),
      price: parseMoney(v.price).value,
      mrp: parseMoney(v.mrp).value ?? null,
      highlight: Boolean(v.highlight),
    })),
  };
}

// ---------------------------------------------------------------------------
// Form component
// ---------------------------------------------------------------------------

const EMPTY_ERRORS = { variants: {}, facts: {}, gallery: {} };

function Field({ label, error, hint, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', ...style }}>
      <label className="adm-label">
        {label}
        {children}
      </label>
      {hint && !error && <span className="adm-row-meta">{hint}</span>}
      {error && <span className="adm-formerror">{error}</span>}
    </div>
  );
}

const sectionStyle = { marginBottom: '1.25rem' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' };
const rowStyle = { display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.75rem' };

export default function ProductForm({ product = null, products = [], onCancel, onSaved }) {
  const isNew = !product;

  const [form, setForm] = useState(() =>
    isNew ? emptyProductForm(nextSortOrder(products)) : productFormFromProduct(product)
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const variantIds = computeVariantIds(form.variants);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleName = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: isNew && !slugTouched ? slugify(value) : f.slug,
    }));
  };

  const handleSlug = (value) => {
    setSlugTouched(true);
    setField('slug', value);
  };

  const addRow = (list, row) => setForm((f) => ({ ...f, [list]: [...f[list], { key: newRowKey(), ...row }] }));
  const updateRow = (list, key, patch) =>
    setForm((f) => ({ ...f, [list]: f[list].map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRow = (list, key) => setForm((f) => ({ ...f, [list]: f[list].filter((r) => r.key !== key) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const nextErrors = validateProductForm(form, {
      isNew,
      products,
      editingId: isNew ? null : product.id,
    });
    setErrors(nextErrors);
    setSaveError('');
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      const body = productDocFromForm(form);
      if (isNew) {
        await createProduct(body.slug, body);
        onSaved?.(`"${body.name}" was created in Firestore.`);
      } else {
        await updateProduct(product.id, body);
        onSaved?.(`"${body.name}" was updated.`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to save product', err?.code, err?.message);
      if (err?.code === 'abixmart/product-exists') {
        setSaveError('A product with this ID already exists. Choose a different slug.');
      } else if (err?.code === 'permission-denied') {
        setSaveError('Save rejected: this account is not permitted to write products.');
      } else {
        setSaveError('Could not save the product. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Basics */}
      <div className="adm-panel" style={sectionStyle}>
        <span className="adm-label adm-label--gold">Basics</span>
        <div style={{ ...gridStyle, marginTop: '1rem' }}>
          <Field label="Product name" error={errors.name}>
            <input
              className="adm-input"
              value={form.name}
              onChange={(e) => handleName(e.target.value)}
            />
          </Field>
          <Field
            label="Slug"
            error={errors.slug}
            hint={isNew ? 'Becomes the product ID. Cannot be changed afterwards.' : undefined}
          >
            <input
              className="adm-input"
              value={form.slug}
              onChange={(e) => handleSlug(e.target.value)}
            />
          </Field>
          <Field label="Subtitle">
            <input className="adm-input" value={form.subtitle} onChange={(e) => setField('subtitle', e.target.value)} />
          </Field>
          <Field label="Category">
            <select className="adm-select" value={form.category} onChange={(e) => setField('category', e.target.value)}>
              <option value="">No category</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Status" error={errors.status}>
            <select className="adm-select" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </Field>
          <Field label="Sort order" error={errors.sortOrder}>
            <input
              className="adm-input"
              inputMode="numeric"
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', e.target.value)}
            />
          </Field>
        </div>
        <div style={{ ...gridStyle, gridTemplateColumns: '1fr', marginTop: '1rem' }}>
          <Field label="Short description">
            <textarea
              className="adm-input"
              rows={2}
              value={form.shortDesc}
              onChange={(e) => setField('shortDesc', e.target.value)}
            />
          </Field>
          <Field label="Description">
            <textarea
              className="adm-input"
              rows={5}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Pricing */}
      <div className="adm-panel" style={sectionStyle}>
        <span className="adm-label adm-label--gold">Pricing</span>
        <div style={{ ...gridStyle, marginTop: '1rem' }}>
          <Field label="Price" error={errors.price}>
            <input
              className="adm-input"
              inputMode="decimal"
              value={form.price}
              onChange={(e) => setField('price', e.target.value)}
            />
          </Field>
          <Field label="MRP" error={errors.mrp}>
            <input
              className="adm-input"
              inputMode="decimal"
              value={form.mrp}
              onChange={(e) => setField('mrp', e.target.value)}
            />
          </Field>
          <Field label="Currency" error={errors.currency}>
            <input className="adm-input" value={form.currency} onChange={(e) => setField('currency', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Variants */}
      <div className="adm-panel" style={sectionStyle}>
        <span className="adm-label adm-label--gold">Variants</span>
        <p className="adm-row-meta" style={{ margin: '0.5rem 0 1rem' }}>
          A variant ID is created from its label when first saved and is locked afterwards.
        </p>
        {form.variants.length === 0 && <p className="adm-row-meta">No variants.</p>}
        {form.variants.map((v) => {
          const ve = errors.variants[v.key] || {};
          return (
            <div key={v.key} className="adm-panel" style={{ marginBottom: '0.75rem' }}>
              <div style={gridStyle}>
                <Field label="Label" error={ve.label}>
                  <input
                    className="adm-input"
                    value={v.label}
                    onChange={(e) => updateRow('variants', v.key, { label: e.target.value })}
                  />
                </Field>
                <Field
                  label="Variant ID"
                  hint={v.persisted ? 'Locked (already saved).' : 'Generated from the label.'}
                >
                  <input className="adm-input" value={variantIds[v.key] || ''} readOnly disabled />
                </Field>
                <Field label="Jars" error={ve.jars}>
                  <input
                    className="adm-input"
                    inputMode="numeric"
                    value={v.jars}
                    onChange={(e) => updateRow('variants', v.key, { jars: e.target.value })}
                  />
                </Field>
                <Field label="Price" error={ve.price}>
                  <input
                    className="adm-input"
                    inputMode="decimal"
                    value={v.price}
                    onChange={(e) => updateRow('variants', v.key, { price: e.target.value })}
                  />
                </Field>
                <Field label="MRP" error={ve.mrp}>
                  <input
                    className="adm-input"
                    inputMode="decimal"
                    value={v.mrp}
                    onChange={(e) => updateRow('variants', v.key, { mrp: e.target.value })}
                  />
                </Field>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <Field label="Description">
                  <input
                    className="adm-input"
                    value={v.description}
                    onChange={(e) => updateRow('variants', v.key, { description: e.target.value })}
                  />
                </Field>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <label className="adm-row-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={v.highlight}
                    onChange={(e) => updateRow('variants', v.key, { highlight: e.target.checked })}
                  />
                  Highlight this variant
                </label>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removeRow('variants', v.key)}>
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="adm-btn adm-btn--sm"
          onClick={() => addRow('variants', { id: '', persisted: false, label: '', description: '', jars: '1', price: '', mrp: '', highlight: false })}
        >
          <Plus size={12} /> Add variant
        </button>
      </div>

      {/* Images */}
      <div className="adm-panel" style={sectionStyle}>
        <span className="adm-label adm-label--gold">Images</span>
        <div style={{ marginTop: '1rem' }}>
          <Field label="Primary image URL" error={errors.imagePrimary}>
            <input
              className="adm-input"
              placeholder="https://"
              value={form.imagePrimary}
              onChange={(e) => setField('imagePrimary', e.target.value)}
            />
          </Field>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <span className="adm-label">Gallery image URLs</span>
          <div style={{ marginTop: '0.5rem' }}>
            {form.gallery.map((row) => (
              <div key={row.key} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <input
                    className="adm-input"
                    placeholder="https://"
                    value={row.url}
                    onChange={(e) => updateRow('gallery', row.key, { url: e.target.value })}
                  />
                  {errors.gallery[row.key] && <span className="adm-formerror">{errors.gallery[row.key]}</span>}
                </div>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removeRow('gallery', row.key)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('gallery', { url: '' })}>
              <Plus size={12} /> Add image
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="adm-panel" style={sectionStyle}>
        <span className="adm-label adm-label--gold">Details</span>

        <div style={{ marginTop: '1rem' }}>
          <span className="adm-label">Facts</span>
          <div style={{ marginTop: '0.5rem' }}>
            {form.facts.map((row) => (
              <div key={row.key} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <input
                    className="adm-input"
                    placeholder="Label"
                    value={row.label}
                    onChange={(e) => updateRow('facts', row.key, { label: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="adm-input"
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => updateRow('facts', row.key, { value: e.target.value })}
                  />
                  {errors.facts[row.key] && <span className="adm-formerror">{errors.facts[row.key]}</span>}
                </div>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removeRow('facts', row.key)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('facts', { label: '', value: '' })}>
              <Plus size={12} /> Add fact
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <span className="adm-label">How to use</span>
          <div style={{ marginTop: '0.5rem' }}>
            {form.howToUse.map((row) => (
              <div key={row.key} style={rowStyle}>
                <div style={{ flex: 1 }}>
                  <input
                    className="adm-input"
                    value={row.text}
                    onChange={(e) => updateRow('howToUse', row.key, { text: e.target.value })}
                  />
                </div>
                <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removeRow('howToUse', row.key)}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('howToUse', { text: '' })}>
              <Plus size={12} /> Add step
            </button>
          </div>
        </div>

        <div style={{ ...gridStyle, marginTop: '1.25rem' }}>
          <Field label="Note">
            <input className="adm-input" value={form.note} onChange={(e) => setField('note', e.target.value)} />
          </Field>
          <Field label="How-to-take page route" error={errors.route}>
            <input
              className="adm-input"
              placeholder="/how-to-take-shilajit"
              value={form.howToTakeRoute}
              onChange={(e) => setField('howToTakeRoute', e.target.value)}
            />
          </Field>
        </div>
      </div>

      {saveError && <p className="adm-formerror" role="alert">{saveError}</p>}

      <div className="adm-card-actions" style={{ borderTop: 0, paddingTop: 0 }}>
        <button type="submit" className="adm-btn adm-btn--gold" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
        <button type="button" className="adm-btn" disabled={saving} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}