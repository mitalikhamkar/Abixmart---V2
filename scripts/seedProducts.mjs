// Seeds the Firestore `products` collection from the existing static catalog
// (src/data/products.js).
//
//   node scripts/seedProducts.mjs --dry-run   prints the documents, writes nothing
//   node scripts/seedProducts.mjs             creates the missing products
//
// Safe to run repeatedly:
//   - uses the existing product ids as stable document IDs
//   - never overwrites an existing document (admin edits are kept)
//   - skips a product whose slug already exists under a different ID
//
// It signs in with an admin account (email + password) because Firestore
// rules allow product writes only for users listed in `admins`. Credentials
// come from ADMIN_EMAIL / ADMIN_PASSWORD, or are asked for in the terminal.
// Firebase settings are read from .env / .env.local (VITE_FIREBASE_*).

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY_RUN = process.argv.includes('--dry-run');

function loadEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!fs.existsSync(file)) return;
  fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const value = match[2].replace(/^['"]|['"]$/g, '');
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    });
}

// Reads a project source file and evaluates it without a bundler: image
// imports become null and `export` keywords are removed. This lets the seed
// use the real values from products.js (which imports image assets that Node
// cannot load) and the shared schema module, with no copied data.
function evalSource(relativePath, exportNames) {
  let source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  source = source.replace(/^import\s+(\w+)\s+from\s+['"][^'"]+['"];?\s*$/gm, 'const $1 = null;');
  source = source.replace(/^export\s+(const|function)\s/gm, '$1 ');
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`${source}\nreturn { ${exportNames.join(', ')} };`)();
  } catch (err) {
    throw new Error(`Could not read ${relativePath}: ${err.message}`);
  }
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.stdoutMuted = false;
    rl._writeToOutput = (text) => {
      if (rl.stdoutMuted) rl.output.write(/[\r\n]/.test(text) ? text : '*');
      else rl.output.write(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
    rl.stdoutMuted = hidden;
  });
}

async function main() {
  loadEnvFile('.env');
  loadEnvFile('.env.local');

  const { products, ritualBundles } = evalSource('src/data/products.js', ['products', 'ritualBundles']);
  const { buildProductDocument } = evalSource('src/lib/productSchema.js', ['buildProductDocument']);

  const items = products.map((p, i) => ({
    id: p.id,
    data: buildProductDocument(p, ritualBundles, (i + 1) * 10),
  }));

  if (DRY_RUN) {
    console.log(`DRY RUN — ${items.length} products would be created if missing. Nothing is written.\n`);
    items.forEach((item) => console.log(`products/${item.id}\n${JSON.stringify(item.data, null, 2)}\n`));
    return;
  }

  const config = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
  };
  if (!config.apiKey || !config.projectId || !config.appId) {
    throw new Error('Missing VITE_FIREBASE_* values. Run this from the project root with your .env file in place.');
  }

  const email = process.env.ADMIN_EMAIL || (await ask('Admin email: '));
  const password = process.env.ADMIN_PASSWORD || (await ask('Admin password: ', { hidden: true }));
  if (!email || !password) throw new Error('Admin email and password are required.');

  const app = initializeApp(config);
  const db = getFirestore(app);

  console.log(`\nSigning in to project "${config.projectId}" as ${email}…`);
  await signInWithEmailAndPassword(getAuth(app), email, password);

  let created = 0;
  let skipped = 0;

  for (const item of items) {
    const ref = doc(db, 'products', item.id);

    if ((await getDoc(ref)).exists()) {
      console.log(`  skip   ${item.id} (already exists — left untouched)`);
      skipped += 1;
      continue;
    }

    const sameSlug = await getDocs(query(collection(db, 'products'), where('slug', '==', item.data.slug)));
    if (!sameSlug.empty) {
      console.log(`  skip   ${item.id} (slug "${item.data.slug}" already used by "${sameSlug.docs[0].id}")`);
      skipped += 1;
      continue;
    }

    await setDoc(ref, { ...item.data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    console.log(`  create ${item.id}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    if (err?.code === 'permission-denied') {
      console.error('\nPermission denied: this account must have a document in the Firestore `admins` collection.');
    } else if (String(err?.code || '').startsWith('auth/')) {
      console.error(`\nSign-in failed (${err.code}). Use an admin account that signs in with email and password.`);
    } else {
      console.error(`\nSeed failed: ${err?.message || err}`);
    }
    process.exit(1);
  });