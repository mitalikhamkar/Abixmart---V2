// src/pages/ProductRoute.jsx
//
// Route element for /shop/:slug. A Coming Soon product gets the upcoming
// product page (same content as the dialog); everything else renders the
// existing ProductDetail page, which is not modified.

import React from 'react';
import { useParams } from 'react-router-dom';
import ProductDetail from '@/pages/ProductDetail';
import UpcomingProductPage from '@/components/abix/upcoming/UpcomingProductPage';
import { useCatalog } from '@/lib/CatalogContext';

export default function ProductRoute() {
  const { slug } = useParams();
  const { loading, getProductBySlug } = useCatalog();
  const product = getProductBySlug(slug);

  if (!loading && product && product.status === 'coming_soon') {
    return <UpcomingProductPage product={product} />;
  }

  return <ProductDetail />;
}