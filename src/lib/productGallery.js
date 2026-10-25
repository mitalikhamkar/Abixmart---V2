// src/lib/productGallery.js
//
// Gallery images for a product, using only real project assets.
//
// Shilajit: the photos in src/assets/shop (Shila.jpeg, Shilajit1–6.jpeg), in
// that order, then any gallery URLs stored on the Firestore product.
// Other products: their own image, then any stored gallery URLs.
//
// getScanImage(): the transparent jar cutout used for the Quick View scan.
import shila from '@/assets/shop/Shila.jpeg';
import shilajit1 from '@/assets/shop/Shilajit1.jpeg';
import shilajit2 from '@/assets/shop/Shilajit2.jpeg';
import shilajit3 from '@/assets/shop/Shilajit3.jpeg';
import shilajit4 from '@/assets/shop/Shilajit4.jpeg';
import shilajit5 from '@/assets/shop/Shilajit5.jpeg';
import shilajit6 from '@/assets/shop/Shilajit6.jpeg';
import shilajitCutout from '@/assets/shop/shilajit-jar-cutout.png';

// To reorder or remove a photo, edit this list.
const SHILAJIT_PHOTOS = [shila, shilajit1, shilajit2, shilajit3, shilajit4, shilajit5, shilajit6];

export function getProductGallery(product) {
  if (!product) return [];
  const list = [];
  const seen = new Set();
  const push = (src, alt, fit = 'cover') => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    list.push({ src, alt, fit });
  };

  if (product.slug === 'shilajit') {
    SHILAJIT_PHOTOS.forEach((src, i) =>
      push(src, `ABIXMART Himalayan Shilajit, photo ${i + 1} of ${SHILAJIT_PHOTOS.length}`)
    );
  } else {
    push(product.shopImage || product.image, `${product.name}, front view`, 'contain');
  }

  (product.images?.gallery || []).forEach((g) => {
    const src = typeof g === 'string' ? g : g?.url;
    push(src, `${product.name}, image ${list.length + 1}`, 'contain');
  });

  return list;
}

export function getScanImage(product) {
  if (product?.slug === 'shilajit') return shilajitCutout;
  return product?.shopImage || product?.image || null;
}