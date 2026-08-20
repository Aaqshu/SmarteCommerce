import Link from 'next/link';
import type { Product } from '@smartecommerce/shared/types';
import { formatINR } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="elegant-card overflow-hidden">
        <div className="aspect-square bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 overflow-hidden relative">
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl">💎</span>
            </div>
          )}
          {product.featured && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-[var(--color-accent)] text-white text-xs font-medium tracking-wider uppercase rounded-sm">
              Featured
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="text-xs text-gray-500 dark:text-gray-400 tracking-widest uppercase mb-2">
            {product.category}
          </div>
          <h3 className="font-serif font-bold text-lg mb-2 group-hover:text-[var(--color-accent)] transition-colors duration-200 leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  filled={i < Math.round(avgRating)}
                  className={`w-4 h-4 ${
                    i < Math.round(avgRating)
                      ? 'text-[var(--color-accent)]'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviews.length})</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-[var(--color-accent)]">
              {formatINR(product.price)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 tracking-wide">incl. GST</span>
          </div>
          {product.metal && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {product.metal} {product.purity && `• ${product.purity}`}
            </div>
          )}
          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-xs text-[var(--color-accent)] font-medium mt-2">
              Only {product.stock} left in stock
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-2">Out of stock</p>
          )}
        </div>
      </div>
    </Link>
  );
}
