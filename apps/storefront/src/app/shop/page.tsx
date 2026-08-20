import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { fetchProducts } from '@/lib/api';
import { ShopClient } from '@/components/ShopClient';

export default async function ShopPage() {
  // Fetch from API with fallback to demo data
  const apiProducts = await fetchProducts();
  const products = apiProducts.length > 0 ? apiProducts : DEMO_PRODUCTS;

  return <ShopClient products={products} />;
}
