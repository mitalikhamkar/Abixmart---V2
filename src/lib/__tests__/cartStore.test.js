import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCartStore,
  createGuestStorage,
  applyOp,
  normalizeStored,
  mergeLines,
} from '../cartStore.js';

const MAX = 3;
const helpers = {
  clamp: (_id, n) => Math.min(Math.max(1, n), MAX),
  // old documents: qty counted packages; variant id says how many jars one package held
  legacyJars: (it) => {
    const perPack = it.variantId === '2-jar-ritual' ? 2 : it.variantId === '3-jar-ritual' ? 3 : 1;
    return Math.max(1, Math.floor(Number(it.qty)) || 1) * perPack;
  },
};

const settle = async () => {
  for (let i = 0; i < 25; i += 1) await new Promise((r) => setImmediate(r));
};

// A fake Firestore `carts` collection keyed by uid.
function makeRemote(initial = {}) {
  const docs = new Map(Object.entries(initial));
  const log = [];
  const r = {
    docs,
    log,
    failRead: false,
    failWrite: false,
    holdRead: null,
    holdWrite: null,
    async read(uid) {
      log.push(['read', uid]);
      if (r.holdRead) await r.holdRead;
      if (r.failRead) throw new Error('offline');
      const d = docs.get(uid);
      return d
        ? { exists: true, version: d.version === 2 ? 2 : 1, items: JSON.parse(JSON.stringify(d.items)) }
        : { exists: false, version: 2, items: [] };
    },
    async write(uid, lines) {
      log.push(['write', uid, lines.map((l) => [l.id, l.jars])]);
      if (r.holdWrite) await r.holdWrite;
      if (r.failWrite) throw new Error('write failed');
      docs.set(uid, { version: 2, items: lines.map((l) => ({ id: l.id, jars: l.jars })) });
    },
    writes: () => log.filter((e) => e[0] === 'write'),
  };
  return r;
}

function memoryStorage() {
  const data = new Map();
  return {
    data,
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

function makeEnv(initialDocs = {}) {
  const remote = makeRemote(initialDocs);
  const storage = memoryStorage();
  const timers = [];
  const setTimer = (fn, ms) => timers.push({ fn, ms });
  const clearTimer = (id) => {
    if (id) timers[id - 1] = null;
  };
  const runTimers = async () => {
    const due = timers.splice(0).filter(Boolean);
    due.forEach((t) => t.fn());
    await settle();
  };
  // A "page load": a brand new store over the same Firestore + localStorage.
  const newStore = () => createCartStore({ remote, guest: createGuestStorage(storage), setTimer, clearTimer });
  return { remote, storage, timers, runTimers, newStore };
}

const linesOf = (store) => store.getSnapshot().lines.map((l) => [l.id, l.jars]);

/* ───────────── scenarios from the task ───────────── */

test('add -> refresh keeps the item', async () => {
  const env = makeEnv();
  const a = env.newStore();
  a.attach('u1', helpers);
  await settle();
  a.add('p', 2, MAX);
  await settle();

  const b = env.newStore(); // refresh
  b.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(b), [['p', 2]]);
});

test('the first change after loading is saved (no swallowed first write)', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  s.add('p', 1, MAX);
  await settle();
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 1 }]);
  assert.equal(env.remote.writes().length, 1);
});

test('update quantity -> refresh keeps the new quantity', async () => {
  const env = makeEnv();
  const a = env.newStore();
  a.attach('u1', helpers);
  await settle();
  a.add('p', 1, MAX);
  a.setJars('p', 3, MAX);
  await settle();
  const b = env.newStore();
  b.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(b), [['p', 3]]);
});

test('remove -> refresh: removed items do not come back, including the last one', async () => {
  const env = makeEnv();
  const a = env.newStore();
  a.attach('u1', helpers);
  await settle();
  a.add('p', 1, MAX);
  a.add('q', 2, MAX);
  await settle();
  a.remove('p');
  await settle();

  let b = env.newStore();
  b.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(b), [['q', 2]]);

  b.remove('q');
  await settle();
  b = env.newStore();
  b.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(b), []);
});

test('clear (after an order) is saved and survives a refresh', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 2 }] } });
  const a = env.newStore();
  a.attach('u1', helpers);
  await settle();
  a.clear();
  await settle();
  const b = env.newStore();
  b.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(b), []);
});

/* ───────────── loading order and failures ───────────── */

test('a change made while the cart is still loading is added to the saved cart, not over it', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 2 }] } });
  let release;
  env.remote.holdRead = new Promise((r) => {
    release = r;
  });
  const s = env.newStore();
  s.attach('u1', helpers);
  s.add('p', 1, MAX); // queued: the saved cart has not loaded yet
  await settle();
  assert.equal(env.remote.writes().length, 0); // nothing written before the read finished

  release();
  await settle();
  assert.deepEqual(linesOf(s), [['p', 3]]);
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 3 }]);
  assert.equal(env.remote.writes().length, 1);
});

test('a failed read never writes, then recovers and replays queued changes', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 2 }] } });
  env.remote.failRead = true;
  const s = env.newStore();
  s.attach('u1', helpers);
  s.add('q', 1, MAX);
  await settle();

  assert.equal(s.getSnapshot().status, 'error');
  assert.equal(env.remote.writes().length, 0);
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 2 }]); // untouched

  env.remote.failRead = false;
  await env.runTimers(); // automatic retry
  assert.equal(s.getSnapshot().status, 'ready');
  assert.deepEqual(linesOf(s), [['p', 2], ['q', 1]]);
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 2 }, { id: 'q', jars: 1 }]);
});

test('a manual retry also recovers from a failed read', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 1 }] } });
  env.remote.failRead = true;
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  assert.equal(s.getSnapshot().status, 'error');
  env.remote.failRead = false;
  s.retry();
  await settle();
  assert.equal(s.getSnapshot().status, 'ready');
  assert.deepEqual(linesOf(s), [['p', 1]]);
});

test('a failed write keeps the cart, is flagged, and is retried', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  env.remote.failWrite = true;
  s.add('p', 1, MAX);
  await settle();

  assert.equal(s.getSnapshot().syncState, 'error');
  assert.deepEqual(linesOf(s), [['p', 1]]); // still shown
  assert.equal(env.remote.docs.has('u1'), false);

  env.remote.failWrite = false;
  await env.runTimers();
  assert.equal(s.getSnapshot().syncState, 'ok');
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 1 }]);
});

/* ───────────── no duplicate writes ───────────── */

test('rapid changes coalesce into one extra write', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();

  let release;
  env.remote.holdWrite = new Promise((r) => {
    release = r;
  });
  s.add('p', 1, MAX);
  s.setJars('p', 2, MAX);
  s.setJars('p', 3, MAX);
  s.setJars('p', 2, MAX);
  await settle();
  release();
  await settle();

  assert.equal(env.remote.writes().length, 2); // the first one, then one for the final state
  assert.deepEqual(env.remote.writes()[1][2], [['p', 2]]);
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 2 }]);
});

test('loading a cart that has not changed writes nothing', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 2 }] } });
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  assert.equal(env.remote.writes().length, 0);
  // and a change that ends where it started writes nothing extra
  s.add('p', 1, MAX);
  s.setJars('p', 2, MAX);
  await settle();
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 2 }]);
});

/* ───────────── two users ───────────── */

test('switching user never leaks the previous cart into or under the next user', async () => {
  const env = makeEnv({ b: { version: 2, items: [{ id: 'q', jars: 1 }] } });
  const s = env.newStore();
  s.attach('a', helpers);
  await settle();
  s.add('p', 2, MAX);
  await settle();

  s.attach('b', helpers); // direct switch, no logout in between
  assert.deepEqual(linesOf(s), []); // A's items are gone from state immediately
  await settle();
  assert.deepEqual(linesOf(s), [['q', 1]]); // only B's own cart
  assert.deepEqual(env.remote.docs.get('a').items, [{ id: 'p', jars: 2 }]);
  assert.deepEqual(env.remote.docs.get('b').items, [{ id: 'q', jars: 1 }]);
  assert.equal(env.remote.writes().filter((w) => w[1] === 'b').length, 0);
});

test('a save still in flight when the user switches lands on the OLD user only', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('a', helpers);
  await settle();

  let release;
  env.remote.holdWrite = new Promise((r) => {
    release = r;
  });
  s.add('p', 1, MAX); // write for A is now in flight
  s.attach('b', helpers);
  await settle();
  release();
  await settle();

  assert.deepEqual(env.remote.docs.get('a').items, [{ id: 'p', jars: 1 }]);
  assert.equal(env.remote.docs.has('b'), false);
  assert.deepEqual(linesOf(s), []);
});

test('a slow read for the previous user is ignored after switching', async () => {
  const env = makeEnv({
    a: { version: 2, items: [{ id: 'p', jars: 3 }] },
    b: { version: 2, items: [{ id: 'q', jars: 1 }] },
  });
  let release;
  env.remote.holdRead = new Promise((r) => {
    release = r;
  });
  const s = env.newStore();
  s.attach('a', helpers); // A's read is stuck
  s.attach('b', helpers); // B's read is stuck behind the same gate
  release();
  await settle();
  assert.deepEqual(linesOf(s), [['q', 1]]);
});

/* ───────────── guest cart ───────────── */

test('a guest cart survives a refresh', async () => {
  const env = makeEnv();
  const a = env.newStore();
  a.attach(null, helpers);
  a.add('p', 2, MAX);
  const b = env.newStore();
  b.attach(null, helpers);
  assert.deepEqual(linesOf(b), [['p', 2]]);
});

test('on sign-in the guest cart merges once, then is cleared (no double counting)', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 1 }] } });
  const guestVisit = env.newStore();
  guestVisit.attach(null, helpers);
  guestVisit.add('p', 1, MAX);
  guestVisit.add('q', 1, MAX);

  const login = env.newStore();
  login.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(login), [['p', 2], ['q', 1]]);
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 2 }, { id: 'q', jars: 1 }]);
  assert.equal(env.storage.data.size, 0); // guest storage cleared

  const reload = env.newStore();
  reload.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(reload), [['p', 2], ['q', 1]]);
});

test('guest items are kept (not lost) if saving the merged cart fails', async () => {
  const env = makeEnv();
  const guestVisit = env.newStore();
  guestVisit.attach(null, helpers);
  guestVisit.add('p', 1, MAX);

  env.remote.failWrite = true;
  const login = env.newStore();
  login.attach('u1', helpers);
  await settle();
  assert.equal(env.storage.data.size, 1); // still there

  env.remote.failWrite = false;
  await env.runTimers();
  assert.deepEqual(env.remote.docs.get('u1').items, [{ id: 'p', jars: 1 }]);
  assert.equal(env.storage.data.size, 0);
});

test('logging out shows an empty guest cart, not the signed-in cart', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  s.add('p', 1, MAX);
  await settle();
  s.attach(null, helpers);
  assert.deepEqual(linesOf(s), []);
});

test('a guest cart works when localStorage is blocked', () => {
  const blocked = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
  const g = createGuestStorage(blocked);
  assert.deepEqual(g.read(), []);
  g.write([{ id: 'p', jars: 2 }]);
  assert.deepEqual(g.read(), [{ id: 'p', jars: 2 }]);
  g.clear();
  assert.deepEqual(g.read(), []);
});

/* ───────────── older saved carts ───────────── */

test('an old-format saved cart is converted to jars and is not rewritten by loading', async () => {
  const env = makeEnv({
    u1: {
      version: 1,
      items: [
        { id: 'p', qty: 1, variantId: '2-jar-ritual', variantLabel: '2 Jar Ritual', unitPrice: 1999 },
        { id: 'p', qty: 1, variantId: null },
      ],
    },
  });
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(s), [['p', 3]]); // 2 jars + 1 jar, one line
  assert.equal(env.remote.writes().length, 0);
  assert.equal(env.remote.docs.get('u1').version, 1); // saved data left as it was

  s.setJars('p', 2, MAX);
  await settle();
  assert.deepEqual(env.remote.docs.get('u1'), { version: 2, items: [{ id: 'p', jars: 2 }] });
});

test('stored quantities above the ceiling are held at the ceiling when loaded', async () => {
  const env = makeEnv({ u1: { version: 2, items: [{ id: 'p', jars: 9 }] } });
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  assert.deepEqual(linesOf(s), [['p', 3]]);
});

/* ───────────── stale tabs ───────────── */

test('refresh adopts a newer saved cart when this tab has nothing unsaved', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  s.add('p', 1, MAX);
  await settle();

  env.remote.docs.set('u1', { version: 2, items: [{ id: 'p', jars: 3 }] }); // changed in another tab
  await s.refresh();
  assert.deepEqual(linesOf(s), [['p', 3]]);
});

test('refresh never overwrites a change made while it was reading', async () => {
  const env = makeEnv();
  const s = env.newStore();
  s.attach('u1', helpers);
  await settle();
  s.add('p', 1, MAX);
  await settle();

  let release;
  env.remote.holdRead = new Promise((r) => {
    release = r;
  });
  env.remote.docs.set('u1', { version: 2, items: [{ id: 'p', jars: 1 }] });
  const pending = s.refresh();
  s.add('q', 1, MAX); // user acts while the read is in flight
  release();
  await pending;
  await settle();
  assert.deepEqual(linesOf(s), [['p', 1], ['q', 1]]);
});

/* ───────────── pure helpers ───────────── */

test('applyOp: add respects the ceiling, set below 1 removes, clear empties', () => {
  let lines = [];
  lines = applyOp(lines, { type: 'add', id: 'p', n: 2, max: 3 });
  lines = applyOp(lines, { type: 'add', id: 'p', n: 5, max: 3 });
  assert.deepEqual(lines, [{ id: 'p', jars: 3 }]);
  const same = applyOp(lines, { type: 'add', id: 'p', n: 1, max: 3 });
  assert.equal(same, lines); // nothing changed -> same array
  assert.deepEqual(applyOp(lines, { type: 'set', id: 'p', jars: 0 }), []);
  assert.deepEqual(applyOp(lines, { type: 'set', id: 'missing', jars: 2 }), lines);
  assert.deepEqual(applyOp(lines, { type: 'clear' }), []);
});

test('normalizeStored merges duplicates and ignores invalid items', () => {
  const doc = {
    exists: true,
    version: 2,
    items: [{ id: 'p', jars: 1 }, { id: 'p', jars: 1 }, { id: 'x', jars: 0 }, { id: 5, jars: 1 }, null],
  };
  assert.deepEqual(normalizeStored(doc, helpers), [{ id: 'p', jars: 2 }]);
  assert.deepEqual(normalizeStored({ exists: false }, helpers), []);
  assert.deepEqual(mergeLines([[{ id: 'a', jars: 1 }], [{ id: 'a', jars: 2 }, { id: 'b', jars: 1 }]]), [
    { id: 'a', jars: 3 },
    { id: 'b', jars: 1 },
  ]);
});