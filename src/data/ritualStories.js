// src/data/ritualStories.js
//
// Single source of truth for the personalized ritual storyline.
// Every image is imported with an EXPLICIT semantic key (before,
// discovering, amount, dissolve, drinking, consistency) rather than
// relying on array index or filesystem order — this is what prevents
// images being skipped, duplicated, or mismatched across the six
// age/gender combinations, since filenames are NOT identical across
// every folder (see notes below).

// ---- 18-30 / female ----
import f1830_before from '@/assets/HowToUse/18-30/female/BEFORE THE RITUAL.png';
import f1830_discovering from '@/assets/HowToUse/18-30/female/DISCOVERING ABIXMART.png';
import f1830_amount from '@/assets/HowToUse/18-30/female/TAKE THE RIGHT AMOUNT.png';
import f1830_dissolve from '@/assets/HowToUse/18-30/female/DISSOLVE IN WARM WATER.png';
import f1830_drinking from '@/assets/HowToUse/18-30/female/DRINK THE RITUAL.png';
import f1830_consistency from '@/assets/HowToUse/18-30/female/CONSISTENCY.png';

// ---- 18-30 / male ----
// NOTE: this folder's "amount" filename appeared truncated in the file
// explorer screenshot as "TAKING THE CORRECT AMOUNT...". Using the exact
// text you provided as the example real-world variant. VERIFY THIS
// FILENAME ON DISK before building — any mismatch (spacing, case,
// punctuation) will throw an import/ENOENT error.
import m1830_before from '@/assets/HowToUse/18-30/male/BEFORE THE RITUAL.png';
import m1830_discovering from '@/assets/HowToUse/18-30/male/DISCOVERING ABIXMART.png';
import m1830_amount from '@/assets/HowToUse/18-30/male/TAKING THE CORRECT AMOUNT.png';
import m1830_dissolve from '@/assets/HowToUse/18-30/male/DISSOLVE IN WARM WATER.png';
import m1830_drinking from '@/assets/HowToUse/18-30/male/DRINKING THE RITUAL.png';
import m1830_consistency from '@/assets/HowToUse/18-30/male/CONSISTENCY.png';

// ---- 30-50 / female ----
import f3050_before from '@/assets/HowToUse/30-50/female/BEFORE THE RITUAL.png';
import f3050_discovering from '@/assets/HowToUse/30-50/female/DISCOVERING ABIXMART.png';
import f3050_amount from '@/assets/HowToUse/30-50/female/TAKE THE RIGHT AMOUNT.png';
import f3050_dissolve from '@/assets/HowToUse/30-50/female/DISSOLVE IN WARM WATER.png';
import f3050_drinking from '@/assets/HowToUse/30-50/female/DRINK THE RITUAL.png';
import f3050_consistency from '@/assets/HowToUse/30-50/female/CONSISTENCY.png';

// ---- 30-50 / male ----
import m3050_before from '@/assets/HowToUse/30-50/male/BEFORE THE RITUAL.png';
import m3050_discovering from '@/assets/HowToUse/30-50/male/DISCOVERING ABIXMART.png';
import m3050_amount from '@/assets/HowToUse/30-50/male/TAKE THE RIGHT AMOUNT.png';
import m3050_dissolve from '@/assets/HowToUse/30-50/male/DISSOLVE IN WARM WATER.png';
import m3050_drinking from '@/assets/HowToUse/30-50/male/DRINK THE RITUAL.png';
import m3050_consistency from '@/assets/HowToUse/30-50/male/CONSISTENCY.png';

// ---- 50 and above / female ----
import f50_before from '@/assets/HowToUse/50 and above/female/BEFORE THE RITUAL.png';
import f50_discovering from '@/assets/HowToUse/50 and above/female/DISCOVERING ABIXMART.png';
import f50_amount from '@/assets/HowToUse/50 and above/female/TAKING THE RIGHT AMOUNT.png';
import f50_dissolve from '@/assets/HowToUse/50 and above/female/DISSOLVE IN WARM WATER.png';
import f50_drinking from '@/assets/HowToUse/50 and above/female/DRINKING THE RITUAL.png';
import f50_consistency from '@/assets/HowToUse/50 and above/female/CONSISTENCY.png';

// ---- 50 and above / male ----
import m50_before from '@/assets/HowToUse/50 and above/male/BEFORE THE RITUAL.png';
import m50_discovering from '@/assets/HowToUse/50 and above/male/DISCOVERING ABIXMART.png';
import m50_amount from '@/assets/HowToUse/50 and above/male/TAKING THE RIGHT AMOUNT.png';
import m50_dissolve from '@/assets/HowToUse/50 and above/male/DISSOLVE IN WARM WATER.png';
import m50_drinking from '@/assets/HowToUse/50 and above/male/DRINKING THE RITUAL.png';
import m50_consistency from '@/assets/HowToUse/50 and above/male/CONSISTENCY.png';

// Query-param-safe age keys ('50 and above' isn't URL-friendly).
export const AGE_GROUPS = [
  { key: '18-30', label: '18–30' },
  { key: '30-50', label: '30–50' },
  { key: '50-plus', label: '50 and above' },
];

export const GENDERS = [
  { key: 'male', label: 'Male' },
  { key: 'female', label: 'Female' },
];

// The one true display/animation order, independent of filesystem order.
export const STORY_ORDER = [
  { key: 'before', number: '01', title: 'Before the Ritual' },
  { key: 'discovering', number: '02', title: 'Discovering ABIXMART' },
  { key: 'amount', number: '03', title: 'Take the Right Amount' },
  { key: 'dissolve', number: '04', title: 'Dissolve in Warm Water' },
  { key: 'drinking', number: '05', title: 'Drinking the Ritual' },
  { key: 'consistency', number: '06', title: 'Consistency' },
];

// One explicit object per combination. Every value is a semantic key,
// never an array index — this is what makes mismatched/skipped/duplicated
// images structurally impossible.
export const RITUAL_STORIES = {
  '18-30': {
    female: { before: f1830_before, discovering: f1830_discovering, amount: f1830_amount, dissolve: f1830_dissolve, drinking: f1830_drinking, consistency: f1830_consistency },
    male: { before: m1830_before, discovering: m1830_discovering, amount: m1830_amount, dissolve: m1830_dissolve, drinking: m1830_drinking, consistency: m1830_consistency },
  },
  '30-50': {
    female: { before: f3050_before, discovering: f3050_discovering, amount: f3050_amount, dissolve: f3050_dissolve, drinking: f3050_drinking, consistency: f3050_consistency },
    male: { before: m3050_before, discovering: m3050_discovering, amount: m3050_amount, dissolve: m3050_dissolve, drinking: m3050_drinking, consistency: m3050_consistency },
  },
  '50-plus': {
    female: { before: f50_before, discovering: f50_discovering, amount: f50_amount, dissolve: f50_dissolve, drinking: f50_drinking, consistency: f50_consistency },
    male: { before: m50_before, discovering: m50_discovering, amount: m50_amount, dissolve: m50_dissolve, drinking: m50_drinking, consistency: m50_consistency },
  },
};

export function getRitualStory(age, gender) {
  const validAge = AGE_GROUPS.some((a) => a.key === age);
  const validGender = GENDERS.some((g) => g.key === gender);
  if (!validAge || !validGender) return null;
  return RITUAL_STORIES[age]?.[gender] || null;
}

export function getAgeLabel(age) {
  return AGE_GROUPS.find((a) => a.key === age)?.label || age;
}

export function getGenderLabel(gender) {
  return GENDERS.find((g) => g.key === gender)?.label || gender;
}