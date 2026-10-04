import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS } from '@/lib/productSchema';
import { createProduct, updateProduct } from '@/admin/lib/productWrites';
import {
  CATEGORY_OPTIONS,
  emptyProductForm,
  productFormFromProduct,
  validateProductForm,
  hasErrors,
  productDocFromForm,
  computeVariantIds,
  slugify,
  newRowKey,
  isHttpUrl,
  nextSortOrder,
} from '@/admin/utils/productForm';

const cls = (base, error) => `${base}${error ? ' has-error' : ''}`;

function Field({ label, required, hint, error, wide, children }) {
  return (
    <label className={`adm-field${wide ? ' is-wide' : ''}`} {...(error ? { 'data-field-error': 'true' } : {})}>
      <span className="adm-field-label">
        {label}
        {required && <span className="adm-req"> *</span>}
      </span>
      {children}
      {hint && !error && <span className="adm-field-hint">{hint}</span>}
      {error && <span className="adm-field-error" role="alert">{error}</span>}
    </label>
  );
}

function RowError({ message }) {
  if (!message) return null;
  return (
    <p className="adm-field-error" role="alert" data-field-error="true">
      {message}
    </p>
  );
}

function UrlPreview({ url }) {
  const [failed, setFailed] = useState(false);
  if (!isHttpUrl(url)) return null;
  if (failed) return <span className="adm-field-hint">Preview unavailable for this URL.</span>;
  return <img className="adm-imgprev" src={url.trim()} alt="" onError={() => setFailed(true)} />;
}

function Section({ title, subtitle, action, children }) {
  return (
    <section className="adm-panel adm-panel-pad">
      <div className="adm-form-head">
        <div className="min-w-0">
          <h2 className="adm-form-title font-display">{title}</h2>
          {subtitle && <p className="adm-form-sub">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ProductForm({ product, products, onCancel, onSaved }) {
  const isNew = !product;

  const [form, setForm] = useState(() =>
    product ? productFormFromProduct(product) : emptyProductForm(nextSortOrder(products))
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // For a new product the slug follows the name until it is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const variantIds = useMemo(() => computeVariantIds(form.variants), [form.variants]);
  const showSummary = Object.keys(errors).length > 0 && hasErrors(errors);

  const setField = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const handleName = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, ...(slugTouched ? {} : { slug: slugify(name) }) }));
  };

  const handleSlug = (e) => {
    setSlugTouched(true);
    setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }));
  };

  const addRow = (list, row) => setForm((f) => ({ ...f, [list]: [...f[list], row] }));
  const updateRow = (list, key, patch) =>
    setForm((f) => ({ ...f, [list]: f[list].map((r) => (r.key === key ? { ...r, ...patch } : r)) }));
  const removeRow = (list, key) => setForm((f) => ({ ...f, [list]: f[list].filter((r) => r.key !== key) }));

  const handleSave = async () => {
    if (saving) return;

    const nextErrors = validateProductForm(form, { isNew, products, editingId: product?.id ?? null });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      setSubmitError('');
      setTimeout(() => {
        document.querySelector('[data-field-error]')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 0);
      return;
    }

    setSaving(true);
    setSubmitError('');
    const body = productDocFromForm(form);

    try {
      if (isNew) await createProduct(body.slug, body);
      else await updateProduct(product.id, body);
      onSaved(isNew ? `"${body.name}" was created.` : `"${body.name}" was updated.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to save product', err?.code, err?.message);
      setSubmitError(
        err?.code === 'abixmart/product-exists'
          ? 'A product with this ID already exists. Choose a different slug.'
          : err?.code === 'permission-denied'
          ? 'Save rejected: this account is not permitted to write products.'
          : 'Could not save the product. Please try again.'
      );
      setSaving(false);
    }
  };

  const categoryKnown = !form.category || CATEGORY_OPTIONS.some((c) => c.key === form.category);

  return (
    <div className="adm-form">
      <Section title="Basic information">
        <div className="adm-formgrid">
          <Field label="Product name" required error={errors.name}>
            <input value={form.name} onChange={handleName} className={cls('adm-input', errors.name)} placeholder="e.g. Himalayan Shilajit" />
          </Field>

          <Field
            label="Slug"
            required
            error={errors.slug}
            hint={
              isNew
                ? 'Becomes the product ID. The ID cannot be changed after the product is created.'
                : 'Changing the slug does not change the product ID.'
            }
          >
            <input value={form.slug} onChange={handleSlug} className={cls('adm-input', errors.slug)} placeholder="e.g. himalayan-shilajit" />
          </Field>

          <Field label="Subtitle">
            <input value={form.subtitle} onChange={setField('subtitle')} className="adm-input" placeholder="e.g. Pure Resin · 20g" />
          </Field>

          <Field label="Category">
            <select value={form.category} onChange={setField('category')} className="adm-select">
              <option value="">— None —</option>
              {!categoryKnown && <option value={form.category}>{form.category}</option>}
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Short description" wide>
            <input value={form.shortDesc} onChange={setField('shortDesc')} className="adm-input" placeholder="One line shown on product cards" />
          </Field>

          <Field label="Full description" wide>
            <textarea value={form.description} onChange={setField('description')} className="adm-textarea" rows={4} placeholder="Shown on the product page" />
          </Field>
        </div>
      </Section>

      <Section
        title="Status and order"
        subtitle="Controls the product record only. The public website does not read these products yet."
      >
        <div className="adm-formgrid">
          <Field label="Status" required error={errors.status}>
            <select value={form.status} onChange={setField('status')} className={cls('adm-select', errors.status)}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>

          <Field label="Sort order" required error={errors.sortOrder} hint="Lower numbers appear first.">
            <input value={form.sortOrder} onChange={setField('sortOrder')} inputMode="numeric" className={cls('adm-input', errors.sortOrder)} />
          </Field>
        </div>
      </Section>

      <Section
        title="Pricing"
        subtitle="Base price is the default option. Leave prices empty for Coming Soon, Draft or Archived products."
      >
        <div className="adm-formgrid adm-formgrid--3">
          <Field label="Base price" error={errors.price}>
            <input value={form.price} onChange={setField('price')} inputMode="decimal" className={cls('adm-input', errors.price)} placeholder="e.g. 1099" />
          </Field>
          <Field label="MRP" error={errors.mrp}>
            <input value={form.mrp} onChange={setField('mrp')} inputMode="decimal" className={cls('adm-input', errors.mrp)} placeholder="e.g. 1499" />
          </Field>
          <Field label="Currency" required error={errors.currency}>
            <input value={form.currency} onChange={setField('currency')} className={cls('adm-input', errors.currency)} />
          </Field>
        </div>
      </Section>

      <Section
        title="Variants"
        subtitle="Cart quantity counts packages. A 2-jar variant bought once is 1 package = 2 jars."
        action={
          <button
            type="button"
            className="adm-btn adm-btn--sm"
            onClick={() =>
              addRow('variants', {
                key: newRowKey(),
                id: '',
                persisted: false,
                label: '',
                description: '',
                jars: '1',
                price: '',
                mrp: '',
                highlight: false,
              })
            }
          >
            <Plus size={13} /> Add variant
          </button>
        }
      >
        {form.variants.length === 0 ? (
          <p className="adm-field-hint">
            {form.status === 'available'
              ? 'No variants: customers would buy this product at the base price only.'
              : 'No variants. Not needed for Coming Soon or Draft products.'}
          </p>
        ) : (
          form.variants.map((v) => {
            const ve = errors.variants?.[v.key] || {};
            return (
              <div key={v.key} className="adm-variant">
                <div className="adm-variant-head">
                  <span className="adm-variant-id adm-mono">
                    ID: {variantIds[v.key] || 'set from the label'}
                    {v.persisted ? ' · locked' : ' · new'}
                  </span>
                  <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => removeRow('variants', v.key)}>
                    <X size={12} /> Remove
                  </button>
                </div>

                <div className="adm-formgrid">
                  <Field label="Label" required error={ve.label}>
                    <input value={v.label} onChange={(e) => updateRow('variants', v.key, { label: e.target.value })} className={cls('adm-input', ve.label)} placeholder="e.g. 2 Jar Ritual" />
                  </Field>
                  <Field label="Description">
                    <input value={v.description} onChange={(e) => updateRow('variants', v.key, { description: e.target.value })} className="adm-input" />
                  </Field>
                </div>

                <div className="adm-formgrid adm-formgrid--3" style={{ marginTop: '1rem' }}>
                  <Field label="Jars" required error={ve.jars}>
                    <input value={v.jars} onChange={(e) => updateRow('variants', v.key, { jars: e.target.value })} inputMode="numeric" className={cls('adm-input', ve.jars)} />
                  </Field>
                  <Field label="Price" required error={ve.price}>
                    <input value={v.price} onChange={(e) => updateRow('variants', v.key, { price: e.target.value })} inputMode="decimal" className={cls('adm-input', ve.price)} />
                  </Field>
                  <Field label="MRP" error={ve.mrp}>
                    <input value={v.mrp} onChange={(e) => updateRow('variants', v.key, { mrp: e.target.value })} inputMode="decimal" className={cls('adm-input', ve.mrp)} />
                  </Field>
                </div>

                <label className="adm-check" style={{ marginTop: '0.75rem' }}>
                  <input type="checkbox" checked={v.highlight} onChange={(e) => updateRow('variants', v.key, { highlight: e.target.checked })} />
                  Highlight this variant
                </label>
              </div>
            );
          })
        )}
      </Section>

      <Section
        title="Facts"
        subtitle="Label and value pairs, for example Origin: High Himalayas."
        action={
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('facts', { key: newRowKey(), label: '', value: '' })}>
            <Plus size={13} /> Add fact
          </button>
        }
      >
        {form.facts.length === 0 ? (
          <p className="adm-field-hint">No facts added.</p>
        ) : (
          <div className="adm-rowlist">
            {form.facts.map((row) => (
              <div key={row.key}>
                <div className="adm-repeat">
                  <div className="adm-repeat-pair">
                    <input value={row.label} onChange={(e) => updateRow('facts', row.key, { label: e.target.value })} className={cls('adm-input', errors.facts?.[row.key])} placeholder="Label" />
                    <input value={row.value} onChange={(e) => updateRow('facts', row.key, { value: e.target.value })} className={cls('adm-input', errors.facts?.[row.key])} placeholder="Value" />
                  </div>
                  <button type="button" className="adm-iconbtn" aria-label="Remove fact" onClick={() => removeRow('facts', row.key)}>
                    <X size={14} />
                  </button>
                </div>
                <RowError message={errors.facts?.[row.key]} />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="How to use"
        subtitle="One step per row."
        action={
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('howToUse', { key: newRowKey(), text: '' })}>
            <Plus size={13} /> Add step
          </button>
        }
      >
        {form.howToUse.length === 0 ? (
          <p className="adm-field-hint">No steps added.</p>
        ) : (
          <div className="adm-rowlist">
            {form.howToUse.map((row) => (
              <div key={row.key} className="adm-repeat">
                <textarea value={row.text} onChange={(e) => updateRow('howToUse', row.key, { text: e.target.value })} className="adm-textarea adm-textarea--sm" rows={2} />
                <button type="button" className="adm-iconbtn" aria-label="Remove step" onClick={() => removeRow('howToUse', row.key)}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="More details">
        <div className="adm-formgrid">
          <Field label="Note" wide hint="Shown for Coming Soon products, for example “A forthcoming Ayurvedic formulation.”">
            <textarea value={form.note} onChange={setField('note')} className="adm-textarea" rows={2} />
          </Field>
          <Field label="How-to-take route" error={errors.route} hint="Optional page link, for example /how-to-take-shilajit.">
            <input value={form.howToTakeRoute} onChange={setField('howToTakeRoute')} className={cls('adm-input', errors.route)} />
          </Field>
        </div>
      </Section>

      <Section
        title="Images"
        subtitle="Paste direct links to real product images you own. Image upload will be added in a later phase; nothing is generated or uploaded here."
        action={
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => addRow('gallery', { key: newRowKey(), url: '' })}>
            <Plus size={13} /> Add gallery image
          </button>
        }
      >
        <Field label="Primary image URL" error={errors.imagePrimary} hint="Leave empty to keep using the bundled image for existing products.">
          <input value={form.imagePrimary} onChange={setField('imagePrimary')} className={cls('adm-input', errors.imagePrimary)} placeholder="https://…" />
        </Field>
        <div style={{ marginTop: '0.6rem' }}>
          <UrlPreview key={form.imagePrimary} url={form.imagePrimary} />
        </div>

        {form.gallery.length > 0 && (
          <div className="adm-rowlist" style={{ marginTop: '1.25rem' }}>
            <span className="adm-field-label">Gallery</span>
            {form.gallery.map((row) => (
              <div key={row.key}>
                <div className="adm-repeat">
                  <input value={row.url} onChange={(e) => updateRow('gallery', row.key, { url: e.target.value })} className={cls('adm-input', errors.gallery?.[row.key])} placeholder="https://…" />
                  <button type="button" className="adm-iconbtn" aria-label="Remove image" onClick={() => removeRow('gallery', row.key)}>
                    <X size={14} />
                  </button>
                </div>
                <RowError message={errors.gallery?.[row.key]} />
                <div style={{ marginTop: '0.5rem' }}>
                  <UrlPreview key={row.url} url={row.url} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {showSummary && <p className="adm-formerror">Please fix the highlighted fields before saving.</p>}
      {submitError && <p className="adm-formerror">{submitError}</p>}

      <div className="adm-formbar">
        <button type="button" onClick={handleSave} disabled={saving} className="adm-btn adm-btn--gold">
          {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} disabled={saving} className="adm-btn">
          Cancel
        </button>
      </div>
    </div>
  );
}