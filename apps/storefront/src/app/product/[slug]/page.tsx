import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { formatINR, calculateGST } from '@/lib/utils';
import { AddToCartButton } from '@/components/AddToCartButton';
import { ProductGallery } from '@/components/ProductGallery';
import { fetchProduct } from '@/lib/api';

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
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

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DEMO_PRODUCTS.map((product) => ({
    slug: product.slug,
  }));
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Try API first, fallback to DEMO_PRODUCTS
  let product = await fetchProduct(slug);
  if (!product) {
    product = DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  }

  if (!product) {
    notFound();
  }

  const gst = calculateGST(product.price, product.gstRate);
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[var(--color-accent)] transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="text-[var(--color-foreground)]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Product Images */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Product Details */}
        <div>
          <div className="mb-3 text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400">
            {product.category}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)] leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  filled={i < Math.round(avgRating)}
                  className={`w-5 h-5 ${
                    i < Math.round(avgRating) ? 'text-[var(--color-accent)]' : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({product.reviews.length} reviews)
            </span>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-stone-50 dark:from-stone-900/50 dark:to-stone-800/50 rounded-sm p-8 mb-8 border border-[var(--color-border)]">
            <div className="text-4xl font-serif font-bold text-[var(--color-accent)] mb-3">
              {formatINR(product.price)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
              <div className="font-medium">MRP incl. {product.gstRate}% GST</div>
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2 mt-2">
                <span>Taxable value:</span>
                <span className="font-medium">{formatINR(gst.taxableValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({product.gstRate}%):</span>
                <span className="font-medium">{formatINR(gst.gstAmount)}</span>
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-4 pb-8 border-b border-[var(--color-border)]">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Metal:</span>
              <span className="font-semibold text-[var(--color-foreground)]">{product.metal}</span>
            </div>
            {product.purity && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Purity:</span>
                <span className="font-semibold text-[var(--color-foreground)]">{product.purity}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                <span className="font-semibold text-[var(--color-foreground)]">{product.weight}g</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">HSN Code:</span>
              <span className="font-semibold text-[var(--color-foreground)]">{product.hsnCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Availability:</span>
              <span
                className={`font-semibold ${
                  product.stock > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                }`}
              >
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-serif font-bold text-lg mb-3 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Description
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <AddToCartButton productId={product.id} stock={product.stock} />
            </div>
            <button className="btn-secondary flex items-center justify-center gap-2">
              <HeartIcon className="w-5 h-5" />
              <span>Wishlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-24">
        <h2 className="text-4xl font-serif font-bold mb-12 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Customer Reviews
        </h2>
        <div className="space-y-6">
          {product.reviews.map((review) => (
            <div key={review.id} className="elegant-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <div className="font-semibold text-[var(--color-foreground)]">{review.customerName}</div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      filled={i < review.rating}
                      className={`w-4 h-4 ${
                        i < review.rating ? 'text-[var(--color-accent)]' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-500 sm:ml-auto">
                  {new Date(review.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
