import { notFound } from 'next/navigation';
import Link from 'next/link';
import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { formatINR, calculateGST } from '@/lib/utils';

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
  const product = DEMO_PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    notFound();
  }

  const gst = calculateGST(product.price, product.gstRate);
  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-[var(--primary)]">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="text-gray-600 dark:text-gray-400 hover:text-[var(--primary)]">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div>
          <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">{product.category}</div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-2 mb-6">
            <div className="flex text-xl">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              ({product.reviews.length} reviews)
            </span>
          </div>

          <div className="bg-amber-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
            <div className="text-3xl font-bold text-[var(--primary)] mb-2">
              {formatINR(product.price)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>MRP incl. {product.gstRate}% GST</div>
              <div>Taxable value: {formatINR(gst.taxableValue)}</div>
              <div>GST: {formatINR(gst.gstAmount)}</div>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Metal:</span>
              <span className="font-semibold">{product.metal}</span>
            </div>
            {product.purity && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Purity:</span>
                <span className="font-semibold">{product.purity}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Weight:</span>
                <span className="font-semibold">{product.weight}g</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">HSN Code:</span>
              <span className="font-semibold">{product.hsnCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Stock:</span>
              <span className={product.stock > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-lg mb-2">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
          </div>

          <div className="flex gap-4">
            <button className="btn-primary flex-1" disabled={product.stock === 0}>
              {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
            <button className="btn-secondary">
              ❤️ Wishlist
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
        <div className="space-y-6">
          {product.reviews.map((review) => (
            <div key={review.id} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md">
              <div className="flex items-center gap-4 mb-3">
                <div className="font-semibold">{review.customerName}</div>
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                  ))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{review.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
