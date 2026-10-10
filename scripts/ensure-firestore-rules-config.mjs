// scripts/ensure-firestore-rules-config.mjs
//
// Makes firebase.json point the Firestore emulator at ./firestore.rules
// WITHOUT overwriting anything that is already configured.
//
//   node scripts/ensure-firestore-rules-config.mjs
//
// - No firebase.json yet        -> creates one containing only the rules path.
// - firebase.json without it    -> adds "firestore.rules" and keeps every other key.
// - already set to this file    -> changes nothing.
// - set to a different file, a firestore array (multiple databases), or an
//   unreadable/invalid JSON file -> changes nothing and tells you why.
// Before any change to an existing file, a copy is saved as firebase.json.bak.
// This script never deploys anything and never contacts Firebase.

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

const CONFIG = 'firebase.json';
const RULES = 'firestore.rules';

if (!existsSync(RULES)) {
  console.error(`Stopped: ${RULES} was not found in this folder. Run this from the project root.`);
  process.exit(1);
}

if (!existsSync(CONFIG)) {
  writeFileSync(CONFIG, JSON.stringify({ firestore: { rules: RULES } }, null, 2) + '\n');
  console.log(`Created ${CONFIG} with firestore.rules = "${RULES}".`);
  process.exit(0);
}

let config;
try {
  config = JSON.parse(readFileSync(CONFIG, 'utf8'));
} catch (err) {
  console.error(`Stopped: ${CONFIG} is not valid JSON (${err.message}). Nothing was changed.`);
  process.exit(1);
}

if (Array.isArray(config.firestore)) {
  console.error(
    `Stopped: "firestore" in ${CONFIG} is an array (multiple databases). Add "rules": "${RULES}" ` +
      'to the right entry by hand. Nothing was changed.'
  );
  process.exit(1);
}

if (config.firestore && typeof config.firestore === 'object' && config.firestore.rules) {
  if (config.firestore.rules === RULES || config.firestore.rules === `./${RULES}`) {
    console.log(`No change needed: ${CONFIG} already uses "${config.firestore.rules}".`);
  } else {
    console.error(
      `Stopped: ${CONFIG} already points at "${config.firestore.rules}", not "${RULES}". ` +
        'Nothing was changed. Update it by hand if that is intended.'
    );
    process.exit(1);
  }
  process.exit(0);
}

copyFileSync(CONFIG, `${CONFIG}.bak`);
config.firestore = { ...(config.firestore || {}), rules: RULES };
writeFileSync(CONFIG, JSON.stringify(config, null, 2) + '\n');
console.log(`Updated ${CONFIG}: added firestore.rules = "${RULES}". Backup saved as ${CONFIG}.bak.`);