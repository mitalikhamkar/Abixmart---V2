// src/lib/cartStore.js
//
// Cart state + persistence, outside React, so it behaves the same in every
// browser and can be tested with `node --test`.
//
// SOURCE OF TRUTH
//   Signed in : Firestore `carts/{uid}` (read and written through `remote`).
//   Guest     : localStorage (through `guest`), merged ONCE into the user's
//               Firestore cart when they sign in, then cleared.
//
// WHY THIS REPLACES THE OLD EFFECT-BASED CODE
//   - Nothing is ever written to Firestore until the read for that user has
//     succeeded. A failed or slow read can no longer overwrite a saved cart.
//   - Changes made while the cart is still loading are queued as operations
//     (add / set / remove / clear) and replayed on top of the saved cart,
//     instead of replacing it.
//   - Every change is saved. There are no "skip the next save" flags.
//   - Switching user resets the state first; the previous user's items can
//     never be merged into or saved under the next user.
//   - Writes are one at a time and coalesced: rapid changes become at most one
//     extra write, and an unchanged cart is never written.
//
// CART LINE: { id: productId, jars: number }
// STORED DOC: { version: 2, items: [{ id, jars }], updatedAt }
//   Older documents have no `version` and store { id, qty, variantId } where
//   qty counted PACKAGES. They are read (never rewritten just by loading) and
//   converted with the `legacyJars` helper.

export function keyOf(lines) {
  return JSON.stringify(lines.map((l) => [l.id, l.jars]));
}

// Pure: apply one operation to a list of lines. Returns the SAME array when
// nothing changed.
export function applyOp(lines, op) {
  switch (op.type) {
    case 'add': {
      const n = Math.floor(Number(op.n));
      if (!op.id || !Number.isFinite(n) || n < 1) return lines;
      const max = op.max ?? Infinity;
      const i = lines.findIndex((l) => l.id === op.id);
      const cur = i >= 0 ? lines[i].jars : 0;
      const next = Math.min(cur + n, max);
      if (next < 1 || next === cur) return lines;
      if (i >= 0) {
        const out = lines.slice();
        out[i] = { ...out[i], jars: next };
        return out;
      }
      return [...lines, { id: op.id, jars: next }];
    }
    case 'set': {
      const i = lines.findIndex((l) => l.id === op.id);
      if (i < 0) return lines;
      const jars = Math.floor(Number(op.jars));
      if (!Number.isFinite(jars) || jars < 1) return lines.filter((l) => l.id !== op.id);
      const next = Math.min(jars, op.max ?? Infinity);
      if (lines[i].jars === next) return lines;
      const out = lines.slice();
      out[i] = { ...out[i], jars: next };
      return out;
    }
    case 'remove': {
      if (!lines.some((l) => l.id === op.id)) return lines;
      return lines.filter((l) => l.id !== op.id);
    }
    case 'clear':
      return lines.length ? [] : lines;
    default:
      return lines;
  }
}

// Pure: sum jars of the same product across lists, keep first-seen order.
export function mergeLines(lists, clamp) {
  const clampFn = typeof clamp === 'function' ? clamp : (_id, n) => n;
  const order = [];
  const totals = new Map();
  for (const list of lists) {
    for (const l of list) {
      if (!totals.has(l.id)) order.push(l.id);
      totals.set(l.id, (totals.get(l.id) || 0) + l.jars);
    }
  }
  return order.map((id) => ({ id, jars: clampFn(id, totals.get(id)) }));
}

// Pure: stored document -> cart lines. `doc` is { exists, version, items }.
export function normalizeStored(doc, helpers) {
  if (!doc || !doc.exists) return [];
  const clamp = helpers?.clamp;
  const legacyJars = helpers?.legacyJars || ((it) => it.qty);
  const raw = Array.isArray(doc.items) ? doc.items : [];
  const mapped = [];
  for (const it of raw) {
    if (!it || typeof it.id !== 'string' || !it.id) continue;
    const n = Math.floor(Number(doc.version === 2 ? it.jars : legacyJars(it)));
    if (Number.isFinite(n) && n >= 1) mapped.push({ id: it.id, jars: n });
  }
  return mergeLines([mapped], clamp);
}

// Guest cart in localStorage. Falls back to memory when storage is blocked
// (private mode, strict browser settings), so nothing throws.
export function createGuestStorage(storage, key = 'abixmart_guest_cart_v1') {
  let memory = [];
  return {
    read() {
      try {
        const raw = storage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return memory.slice();
      }
    },
    write(lines) {
      memory = lines.map((l) => ({ id: l.id, jars: l.jars }));
      try {
        storage.setItem(key, JSON.stringify(memory));
      } catch {
        /* storage blocked: memory copy is used */
      }
    },
    clear() {
      memory = [];
      try {
        storage.removeItem(key);
      } catch {
        /* storage blocked */
      }
    },
  };
}

// remote: { read(uid) -> { exists, version, items }, write(uid, lines) }
// guest : { read() -> lines, write(lines), clear() }
export function createCartStore({
  remote,
  guest,
  setTimer = (fn, ms) => setTimeout(fn, ms),
  clearTimer = (id) => clearTimeout(id),
}) {
  const UNATTACHED = Symbol('unattached');

  let identity = UNATTACHED; // UNATTACHED | null (guest) | uid string
  let status = 'idle'; //       idle | hydrating | ready | error
  let lines = [];
  let ops = []; //              changes made before the cart is ready
  let token = 0; //             bumps on every identity change (drops stale async results)
  let seq = 0; //               bumps on every local change
  let writing = false;
  let dirty = false;
  let lastSavedKey = null;
  let syncState = 'ok'; //      ok | error (last save failed)
  let error = null;
  let guestToClear = false;
  let helpers = {};
  let retryTimer = null;
  let hydrateTimer = null;
  let hydrateAttempts = 0;
  let writeAttempts = 0;

  const listeners = new Set();
  const compute = () => ({
    status,
    lines,
    syncState,
    error,
    identity: identity === UNATTACHED ? undefined : identity,
  });
  let snapshot = compute();

  function emit() {
    snapshot = compute();
    listeners.forEach((fn) => fn());
  }

  function setSync(next) {
    if (syncState !== next) {
      syncState = next;
      emit();
    }
  }

  function clearTimers() {
    if (retryTimer) clearTimer(retryTimer);
    if (hydrateTimer) clearTimer(hydrateTimer);
    retryTimer = null;
    hydrateTimer = null;
  }

  /* ───────────── saving ───────────── */

  function scheduleWriteRetry() {
    if (retryTimer || writeAttempts >= 5) return;
    const delay = Math.min(2000 * 2 ** writeAttempts, 15000);
    writeAttempts += 1;
    retryTimer = setTimer(() => {
      retryTimer = null;
      flush();
    }, delay);
  }

  async function flush() {
    if (writing) return;
    writing = true;
    try {
      while (dirty && status === 'ready' && typeof identity === 'string') {
        dirty = false;
        const uid = identity;
        const snap = lines;
        const t = token;
        const key = keyOf(snap);
        if (key === lastSavedKey) continue; // unchanged: no duplicate write
        try {
          await remote.write(uid, snap);
        } catch (err) {
          if (t === token) {
            dirty = true;
            error = err;
            setSync('error');
            scheduleWriteRetry();
          }
          break;
        }
        if (t === token) {
          lastSavedKey = key;
          writeAttempts = 0;
          if (guestToClear) {
            guest.clear();
            guestToClear = false;
          }
        }
      }
      if (!dirty && syncState === 'error') {
        error = null;
        setSync('ok');
      }
    } finally {
      writing = false;
    }
    if (dirty && syncState !== 'error') flush();
  }

  function persist() {
    if (identity === null) {
      guest.write(lines);
      return;
    }
    dirty = true;
    flush();
  }

  /* ───────────── loading ───────────── */

  function scheduleHydrateRetry(uid, t) {
    if (hydrateTimer || hydrateAttempts >= 3) return;
    const delay = [2000, 5000, 10000][hydrateAttempts];
    hydrateAttempts += 1;
    hydrateTimer = setTimer(() => {
      hydrateTimer = null;
      if (t === token && status === 'error') {
        status = 'hydrating';
        emit();
        hydrate(uid, t);
      }
    }, delay);
  }

  async function hydrate(uid, t) {
    let doc;
    try {
      doc = await remote.read(uid);
    } catch (err) {
      if (t !== token) return;
      status = 'error';
      error = err;
      emit();
      scheduleHydrateRetry(uid, t);
      return;
    }
    if (t !== token) return; // user changed while loading: drop this result

    const base = normalizeStored(doc, helpers);
    const guestLines = normalizeStored({ exists: true, version: 2, items: guest.read() }, helpers);
    const merged = mergeLines([base, guestLines], helpers.clamp);
    lines = ops.reduce((acc, op) => applyOp(acc, op), merged);
    ops = [];
    lastSavedKey = keyOf(base);
    guestToClear = guestLines.length > 0;
    status = 'ready';
    error = null;
    hydrateAttempts = 0;
    emit();

    if (keyOf(lines) !== lastSavedKey) {
      dirty = true;
      flush();
    } else if (guestToClear) {
      guest.clear();
      guestToClear = false;
    }
  }

  /* ───────────── public API ───────────── */

  // Switch to a guest (uid === null) or a signed-in user. Calling it again for
  // the same identity does nothing.
  function attach(next, nextHelpers) {
    if (identity === next) return;
    const carry = identity === UNATTACHED ? ops : []; // only pre-attach changes survive
    clearTimers();
    token += 1;
    identity = next;
    helpers = nextHelpers || {};
    ops = carry;
    lines = [];
    dirty = false;
    lastSavedKey = null;
    guestToClear = false;
    error = null;
    syncState = 'ok';
    hydrateAttempts = 0;
    writeAttempts = 0;

    if (next === null) {
      const base = normalizeStored({ exists: true, version: 2, items: guest.read() }, helpers);
      lines = ops.reduce((acc, op) => applyOp(acc, op), base);
      const changed = ops.length > 0 && keyOf(lines) !== keyOf(base);
      ops = [];
      status = 'ready';
      if (changed) guest.write(lines);
      emit();
      return;
    }

    status = 'hydrating';
    emit();
    hydrate(next, token);
  }

  function mutate(op) {
    seq += 1;
    if (status !== 'ready') {
      ops.push(op); // replayed on top of the saved cart once it has loaded
      return;
    }
    const next = applyOp(lines, op);
    if (next === lines) return;
    lines = next;
    emit();
    persist();
  }

  // Retry a failed load, or push unsaved changes again.
  function retry() {
    clearTimers();
    writeAttempts = 0;
    if (status === 'error' && typeof identity === 'string') {
      hydrateAttempts = 0;
      status = 'hydrating';
      emit();
      hydrate(identity, token);
      return;
    }
    if (dirty) flush();
  }

  // Re-read the saved cart (for a tab that was in the background). It is
  // skipped whenever this tab has a change in flight or made one meanwhile.
  async function refresh() {
    if (status !== 'ready' || typeof identity !== 'string' || writing || dirty) return;
    const t = token;
    const s = seq;
    const uid = identity;
    let doc;
    try {
      doc = await remote.read(uid);
    } catch {
      return;
    }
    if (t !== token || s !== seq || writing || dirty) return;
    const base = normalizeStored(doc, helpers);
    if (keyOf(base) === keyOf(lines)) return;
    lines = base;
    lastSavedKey = keyOf(base);
    emit();
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getSnapshot: () => snapshot,
    attach,
    add: (id, n = 1, max = Infinity) => mutate({ type: 'add', id, n, max }),
    setJars: (id, jars, max = Infinity) => mutate({ type: 'set', id, jars, max }),
    remove: (id) => mutate({ type: 'remove', id }),
    clear: () => mutate({ type: 'clear' }),
    retry,
    refresh,
  };
}