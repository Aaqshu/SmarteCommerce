import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default async function AdminDashboard() {
  const products = await fetchProducts();
  const totalProducts = products.length;
  const recentProducts = products.slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your product catalog</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="elegant-card p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Total Products
          </div>
          <div className="text-4xl font-serif font-bold text-[var(--color-accent)]">
            {totalProducts}
          </div>
        </div>
        <div className="elegant-card p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Active
          </div>
          <div className="text-4xl font-serif font-bold text-green-600 dark:text-green-500">
            {products.filter(p => p.stock > 0).length}
          </div>
        </div>
        <div className="elegant-card p-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Categories
          </div>
          <div className="text-4xl font-serif font-bold text-blue-600 dark:text-blue-500">
            {new Set(products.map(p => p.category)).size}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-serif font-bold text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
            Quick Actions
          </h2>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/products/new" className="btn-primary">
            Add New Product
          </Link>
          <Link href="/admin/products" className="btn-secondary">
            View All Products
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      <div>
        <h2 className="text-3xl font-serif font-bold mb-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Recent Products
        </h2>
        <div className="elegant-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-100 dark:bg-stone-900 border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    GST Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[var(--color-foreground)]">{product.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{product.category}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {formatINR(product.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {product.gstRate}%
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.stock > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                        {product.stock}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
