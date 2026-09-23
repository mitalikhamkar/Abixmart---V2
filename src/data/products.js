// ABIXMART mock product data — frontend prototype.
// Real product database / Wix store back-office wired in the next phase.

import heroJarCutout from '@/assets/products/shilajit-jar-cutout.png';
import shilajitJarBox from '@/assets/products/shilajit.jpeg';
import heroBg from '@/assets/hero/himalayan-hero-bg.png';

// NEW — Shop page assets. Kept separate from the constants below (which
// Home-page components also consume) so this Shop-page rebuild never
// changes what renders on Home.
import shilajitShop from '@/assets/products/shilajit-shop.png';
import orthavedaImg from '@/assets/products/orthaveda.png';
import dayavedaImg from '@/assets/products/dayaveda.png';
import triphalaImg from '@/assets/products/triphala.png';
import ashwagandhaImg from '@/assets/products/ashwagandha.png';

// NOTE: HERO_IMAGE and the string below (Base44-generated) are not used
// anywhere — kept only so nothing else that might reference the constant
// name breaks. The REAL, approved product photo is PRODUCT_HERO_IMAGE.
export const HERO_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/8d3bf021c_generated_a2b6155e.jpg";
export const PRODUCT_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/250b02195_generated_3433b404.jpg";
export const SOURCING_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/3fd09bfe9_generated_c687c2de.jpg";
export const PURIFICATION_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/e96b0f8b3_generated_efecda09.jpg";
export const RITUAL_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/9bfa04525_generated_0ecb7692.jpg";
export const MIST_IMAGE = "https://media.base44.com/images/public/6a9ba7f03e79451798a06d5a/286eac8b6_generated_e48ac1e8.jpg";

// The ONLY approved product asset used in the hero — real ABIXMART Shilajit
// jar, background-removed from the supplied product photo. Transparent PNG.
export const HERO_PRODUCT_IMAGE = heroJarCutout;

// Real ABIXMART jar + box lifestyle photo — used as the Featured Product
// specimen display (before Quick View opens).
export const PRODUCT_HERO_IMAGE = shilajitJarBox;

// Real Himalayan environment photo for the hero background (supplied by you).
export const HERO_BACKGROUND_IMAGE = heroBg;

// src/data/products.js — only this block changes, everything else in the file stays as-is
export const productBenefits = [
  { key: 'energy', title: 'Natural Energy Boost', body: 'Shilajit helps improve energy levels and reduces fatigue naturally.' },
  { key: 'strength', title: 'Strength & Stamina', body: 'Supports physical performance, stamina and muscle strength.' },
  { key: 'focus', title: 'Enhances Focus & Memory', body: 'Improves cognitive function, focus and mental clarity.' },
  { key: 'immunity', title: 'Supports Immunity', body: 'Rich in minerals and fulvic acid that help strengthen immune health.' },
  { key: 'origin', title: '100% Pure Himalayan Shilajit', body: 'Sourced from high-altitude Himalayan rocks for maximum potency and purity.' },
  { key: 'wellness', title: 'Overall Wellness', body: 'Promotes overall vitality, balance and well-being.' },
];

export const featuredProduct = {
  name: "ABIXMART Himalayan Shilajit",
  subtitle: "Pure Resin",
  size: "20g",
  price: 1099,
  currency: "₹",
  tagline: "Ancient origin. Modern experience.",
  description:
    "Sourced from the high Himalayas and traditionally purified, ABIXMART Pure Shilajit Resin is crafted to be part of your daily wellness ritual — slow, deliberate, and considered.",
  howToUse: [
    "Dissolve a pea-sized portion (approx. 250–300mg) in warm water or milk.",
    "Consume once daily, ideally in the morning.",
    "Store in a cool, dry place away from direct sunlight.",
  ],
  facts: [
    { label: "Origin", value: "High Himalayas" },
    { label: "Form", value: "Pure Resin" },
    { label: "Net Weight", value: "20g" },
    { label: "Crafted", value: "Traditional purification" },
  ],
};

export const categories = [
  { key: "all", label: "All" },
  { key: "resin", label: "Pure Resin" },
  { key: "bundles", label: "Ritual Bundles" },
  { key: "herbs", label: "Herbal Wellness" },
];

// UPDATED — matches the official 5-product lineup: Shilajit (available),
// Orthoveda, Dayaveda, Triphala, Ashwagandha (coming soon). Previously
// included Amla/Moringa in this array's coming_soon slots — replaced with
// Orthoveda/Dayaveda per the current catalog. `upcomingProducts` below
// (used by Home's "What's Growing Next") is intentionally left untouched.
export const products = [
  {
    id: "shilajit-resin",
    slug: "shilajit",
    name: "Himalayan Shilajit",
    subtitle: "Pure Resin · 20g",
    category: "resin",
    price: 1099,
    currency: "₹",
    status: "available",
    image: PRODUCT_IMAGE,
    shopImage: shilajitShop,
    shortDesc: "Sourced from the high Himalayas and traditionally purified.",
    description:
      "Sourced from the high Himalayas and traditionally purified, ABIXMART Pure Shilajit Resin is crafted to be part of your daily wellness ritual — slow, deliberate, and considered.",
    facts: [
      { label: "Origin", value: "High Himalayas" },
      { label: "Form", value: "Pure Resin" },
      { label: "Net Weight", value: "20g" },
      { label: "Crafted", value: "Traditional purification" },
    ],
    howToUse: [
      "Dissolve a pea-sized portion (approx. 250–300mg) in warm water or milk.",
      "Consume once daily, ideally in the morning.",
      "Store in a cool, dry place away from direct sunlight.",
    ],
  },
  {
    id: "orthoveda",
    slug: "orthoveda",
    name: "Orthoveda",
    subtitle: "Coming Soon",
    category: "herbs",
    price: null,
    currency: "₹",
    status: "coming_soon",
    shopImage: orthavedaImg,
    shortDesc: "For joint comfort and everyday mobility.",
    note: "A forthcoming Ayurvedic formulation, currently in development.",
  },
  {
    id: "dayaveda",
    slug: "dayaveda",
    name: "Dayaveda",
    subtitle: "Coming Soon",
    category: "herbs",
    price: null,
    currency: "₹",
    status: "coming_soon",
    shopImage: dayavedaImg,
    shortDesc: "For steady, daily balance.",
    note: "A forthcoming Ayurvedic formulation, currently in development.",
  },
  {
    id: "triphala",
    slug: "triphala",
    name: "Triphala",
    subtitle: "Coming Soon",
    category: "herbs",
    price: null,
    currency: "₹",
    status: "coming_soon",
    shopImage: triphalaImg,
    shortDesc: "A traditional three-fruit blend.",
    note: "Three fruits, one considered blend — rooted in Ayurvedic tradition.",
  },
  {
    id: "ashwagandha",
    slug: "ashwagandha",
    name: "Ashwagandha",
    subtitle: "Coming Soon",
    category: "herbs",
    price: null,
    currency: "₹",
    status: "coming_soon",
    shopImage: ashwagandhaImg,
    shortDesc: "For calm and resilience.",
    note: "A traditional adaptogen, prepared with the same care as our Shilajit.",
  },
];

export const discoveryChoices = [
  { key: "energy", title: "Energy & Vitality", line: "For the rhythm of a full day.", note: "Shilajit has been traditionally used to support vitality and stamina." },
  { key: "wellness", title: "Daily Wellness", line: "A ritual for everyday balance.", note: "A small daily practice, woven into the way you already live." },
  { key: "focus", title: "Focus & Balance", line: "For a steady, clear day.", note: "Traditionally associated with resilience and recovery." },
  { key: "exploring", title: "Explore Natural Wellness", line: "No rush. Begin where you are.", note: "Start with the story. Understand the source before you decide." },
];

export const storyStages = [
  { num: "01", title: "Sourcing", text: "Raw Shilajit is gathered from the high-altitude rocks of the Himalayas, where it forms over centuries." },
  { num: "02", title: "Collection", text: "Collected by hand in small quantities, with care for the mountain and its rhythms." },
  { num: "03", title: "Purification", text: "The raw resin is gently purified using traditional methods to remove impurities." },
  { num: "04", title: "Quality Testing", text: "Each batch is checked for quality before it moves forward in the process." },
  { num: "05", title: "Concentration", text: "The purified resin is slowly concentrated to a rich, consistent texture." },
  { num: "06", title: "Resin Formulation", text: "Formulated into the smooth resin you receive — nothing rushed, nothing added." },
  { num: "07", title: "Filling", text: "Each jar is filled by hand in small batches." },
  { num: "08", title: "Sealing & Packaging", text: "Sealed to preserve freshness and packaged with care." },
  { num: "09", title: "Final Check", text: "A final review of every jar before it leaves us." },
  { num: "10", title: "Ready To Reach You", text: "From the mountain to your hands — ready to become part of your ritual." },
];

export const whyAbixmart = [
  { title: "Himalayan Origin", text: "Sourced from the high Himalayas." },
  { title: "Ayurvedic Formulation", text: "Rooted in traditional practice." },
  { title: "Quality Focus", text: "Every batch is reviewed before it reaches you." },
  { title: "Transparent Process", text: "Ten stages, shown openly — nothing hidden." },
  { title: "Carefully Crafted", text: "Small batches, made with intention." },
];

export const trustPillars = [
  { key: "origin", label: "Origin", title: "From the high Himalayas", body: "Our Shilajit is gathered from high-altitude Himalayan rock, where it forms slowly over centuries. We collect in small quantities, with respect for the mountain." },
  { key: "process", label: "Process", title: "Ten stages, nothing hidden", body: "From sourcing to sealing, every jar passes through ten deliberate stages of traditional purification and careful handling — shown openly, not summarised away." },
  { key: "quality", label: "Quality", title: "Reviewed before it reaches you", body: "Each batch is checked for quality and consistency. We focus on what we can verify, and we don't make claims we can't stand behind." },
  { key: "transparency", label: "Transparency", title: "What we show, we show fully", body: "We share our process openly. No invented certifications, no fabricated lab results, no claims we cannot stand behind." },
];

export const openProductTabs = [
  { key: "source", label: "Source", title: "From the high Himalayas", body: "Our Shilajit is gathered from high-altitude Himalayan rock, where it forms slowly over centuries. We collect in small quantities, with respect for the mountain." },
  { key: "process", label: "Process", title: "Ten stages, nothing hidden", body: "From sourcing to sealing, every jar passes through ten deliberate stages of traditional purification and careful handling — shown openly, not summarised away." },
  { key: "quality", label: "Quality", title: "Reviewed before it reaches you", body: "Each batch is checked for quality and consistency. We focus on what we can verify, and we don't make claims we can't stand behind." },
  { key: "use", label: "How to use", title: "A simple daily ritual", body: "Dissolve a pea-sized portion in warm water or milk, once a day. Keep it simple. Keep it consistent. Let it become part of your morning." },
];

export const upcomingProducts = [
  { name: "Ashwagandha", note: "For calm and resilience.", status: "Coming Soon" },
  { name: "Triphala", note: "A traditional three-fruit blend.", status: "Coming Soon" },
  { name: "Amla", note: "Vitamin-rich botanical.", status: "Coming Soon" },
  { name: "Moringa", note: "Leaf of the miracle tree.", status: "Coming Soon" },
];

// src/data/products.js — only the ritualBundles export changes; everything else in the file stays as-is
export const ritualBundles = [
  {
    id: 'single-jar',
    name: 'Single Jar',
    detail: 'Begin your ritual.',
    jars: 1,
    quantity: 1,
    originalPrice: 1499,
    price: 1099,
    saving: 400,
    note: 'Save ₹400',
  },
  {
    id: '2-jar-ritual',
    name: '2 Jar Ritual',
    detail: 'For the committed daily practice.',
    jars: 2,
    quantity: 2,
    originalPrice: 2999,
    price: 1999,
    saving: 1000,
    note: 'Save ₹1,000',
    highlight: true,
  },
  {
    id: '3-jar-ritual',
    name: '3 Jar Ritual',
    detail: 'The full season of wellness.',
    jars: 3,
    quantity: 3,
    originalPrice: 4499,
    price: 2999,
    saving: 1500,
    note: 'Save ₹1,500',
  },
];

export const faqs = [
  { q: "What is Shilajit?", a: "Shilajit is a natural resin that forms over centuries in the rocks of the high Himalayas. It has been used in traditional Ayurvedic practice for generations. We do not make medical claims about its effects." },
  { q: "How do I use it?", a: "Dissolve a pea-sized portion (around 250–300mg) in warm water or milk, once daily. If you are new to it, start small and be consistent." },
  { q: "How much should I use?", a: "A pea-sized portion, roughly 250–300mg, once a day. We recommend consistency over quantity." },
  { q: "How should I store it?", a: "Store in a cool, dry place away from direct sunlight. Keep the lid sealed between uses." },
  { q: "What about shipping?", a: "We ship across India. Orders are typically dispatched within 1–2 business days. Delivery times vary by location." },
  { q: "What is your returns policy?", a: "If you receive a damaged or incorrect item, contact us within 48 hours and we will make it right. For hygiene reasons, opened product jars cannot be returned." },
  { q: "What payment methods do you accept?", a: "The simplified checkout on this site is a prototype. When the full store launches, we will support standard payment methods including cards, UPI, and wallets." },
  { q: "How do I know the product is authentic?", a: "Every jar is sealed and passes through our ten-stage process, including a final check before it ships. We focus on transparency rather than claims." },
  { q: "Is Shilajit safe for everyone?", a: "Shilajit is a traditional supplement, not a medicine. If you are pregnant, nursing, on medication, or managing a health condition, please consult a qualified healthcare professional before use." },
];

export const supportOptions = [
  { key: "buy", label: "I want to buy something", desc: "Browse the shop and check out simply.", to: "/shop", icon: "ShoppingBag" },
  { key: "understand", label: "I want to understand a product", desc: "Know what goes into ABIXMART.", to: "/shop/shilajit", icon: "BookOpen" },
  { key: "order", label: "I already placed an order", desc: "View confirmation and details.", to: "/support#tracking", icon: "Package" },
  { key: "track", label: "I want to track my order", desc: "Where is my order right now?", to: "/support#tracking", icon: "Truck" },
  { key: "question", label: "I have a question", desc: "Find answers in our FAQ.", to: "/support#faq", icon: "HelpCircle" },
  { key: "talk", label: "Talk to ABIXMART", desc: "Reach us on WhatsApp or email.", to: "/support#contact", icon: "MessageCircle" },
];

export const orderSteps = [
  { key: "placed", label: "Order Placed", desc: "We received your order." },
  { key: "packed", label: "Packed", desc: "Your jar is filled, sealed and packed." },
  { key: "shipped", label: "Shipped", desc: "On its way from the Himalayas to you." },
  { key: "out", label: "Out for Delivery", desc: "Arriving today, near you." },
  { key: "delivered", label: "Delivered", desc: "Now part of your daily ritual." },
];

export const footerLinks = {
  shop: [
    { label: "Shilajit Pure Resin", to: "/shop/shilajit" },
    { label: "Ritual Bundles", to: "/shop#bundles" },
    { label: "What's Growing Next", to: "/shop#coming-soon" },
  ],
  about: [
    { label: "Our Story", to: "/about" },
    { label: "How It Works", to: "/shop/shilajit" },
    { label: "Why ABIXMART", to: "/about" },
  ],
  help: [
    { label: "Support", to: "/support" },
    { label: "FAQ", to: "/support#faq" },
    { label: "Track Order", to: "/support#tracking" },
    { label: "Contact", to: "/support#contact" },
  ],
  legal: [
    { label: "Privacy Policy", to: "/support" },
    { label: "Terms", to: "/support" },
  ],
};

export const getProductBySlug = (slug) => products.find((p) => p.slug === slug);
export const availableProducts = () => products.filter((p) => p.status === "available");
export const upcomingProductsList = () => products.filter((p) => p.status === "coming_soon");