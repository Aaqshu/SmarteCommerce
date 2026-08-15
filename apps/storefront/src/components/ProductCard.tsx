import Link from 'next/link';
import type { Product } from '@smartecommerce/shared/types';
import { formatINR } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{product.category}</div>
          <h3 className="font-bold text-lg mb-2 group-hover:text-[var(--primary)] transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">({product.reviews.length})</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[var(--primary)]">
              {formatINR(product.price)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">incl. GST</span>
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-[var(--accent)] mt-2">Only {product.stock} left!</p>
          )}
          {product.stock === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">Out of stock</p>
          )}
        </div>
      </div>
    </Link>
  );
}
