// src/lib/productGallery.js
//
// Gallery images for a product, using only real project assets:
//   1. the product's own primary image (Firestore URL or the bundled shop image)
//   2. for Shilajit, the extra bundled pack shots, in the order below
//   3. any gallery URLs stored on the Firestore product (images.gallery)
// Duplicates are removed. To reorder or drop an image, edit SHILAJIT_EXTRAS.
import shilajitHero from '@/assets/products/Shilajit-hero.png';
import shilajitJar from '@/assets/products/shilajit-jar-cutout.png';
import shilajitBox from '@/assets/products/shilajit.jpeg';

const SHILAJIT_EXTRAS = [
  { src: shilajitHero, alt: 'ABIXMART Himalayan Shilajit in its Himalayan setting', fit: 'cover' },
  { src: shilajitJar, alt: 'ABIXMART Himalayan Shilajit jar', fit: 'contain' },
  { src: shilajitBox, alt: 'ABIXMART Himalayan Shilajit jar with its box', fit: 'contain' },
];

export function getProductGallery(product) {
  if (!product) return [];
  const list = [];
  const seen = new Set();
  const push = (src, alt, fit = 'contain') => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    list.push({ src, alt, fit });
  };

  push(product.shopImage || product.image, `${product.name}, front view`);

  if (product.slug === 'shilajit') {
    SHILAJIT_EXTRAS.forEach((img) => push(img.src, img.alt, img.fit));
  }

  (product.images?.gallery || []).forEach((g, i) => {
    const src = typeof g === 'string' ? g : g?.url;
    push(src, `${product.name}, image ${i + 2}`);
  });

  return list;
}