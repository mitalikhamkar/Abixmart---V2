# ABIXMART

Standalone React + Vite frontend for ABIXMART — Himalayan Shilajit e-commerce prototype.

This project no longer depends on Base44. It runs as a normal local Vite app with mock/local
product data in `src/data/products.js`.

## Run Locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

## Other commands

```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # lint the project
```

## Notes

- Product/UI data lives in `src/data/products.js` — replace with real backend calls when ready.
- Cart, wishlist, search, and checkout UI state are managed client-side in `src/lib/ShopContext.jsx`.
- Some existing product images are still referenced via their original `media.base44.com` CDN URLs
  from the prototype. These are plain public image URLs (no SDK/auth required) and will keep loading,
  but you'll likely want to swap them for your own hosted assets over time.
