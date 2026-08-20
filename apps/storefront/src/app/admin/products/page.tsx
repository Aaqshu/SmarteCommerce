import Link from 'next/link';
import { fetchProducts } from '@/lib/api';
import { formatINR } from '@/lib/utils';

export default async function AdminProductsPage() {
  const products = await fetchProducts();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-5xl font-serif font-bold text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
            All Products
          </h1>
          <Link href="/admin/products/new" className="btn-primary">
            Add New Product
          </Link>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {products.length} products in catalog
        </p>
      </div>

      <div className="elegant-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-100 dark:bg-stone-900 border-b border-[var(--color-border)]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  MRP
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  GST Rate
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  HSN
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No products found. <Link href="/admin/products/new" className="text-[var(--color-accent)] hover:underline">Add your first product</Link>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium text-[var(--color-foreground)]">{product.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {formatINR(product.mrp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {formatINR(product.price)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-foreground)]">
                      {product.gstRate}%
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {product.hsnCode}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={product.stock > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-[var(--color-accent)] hover:underline font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/admin" className="text-[var(--color-accent)] hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
