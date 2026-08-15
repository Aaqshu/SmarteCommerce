import Link from 'next/link';
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from '@smartecommerce/shared/demo-data';
import { ProductCard } from '@/components/ProductCard';

export default function HomePage() {
  const featuredProducts = DEMO_PRODUCTS.filter((p) => p.featured);

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[var(--primary)]">
            Aurelle Jewels
          </h1>
          <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 mb-8">
            Timeless Luxury
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            Discover our exquisite collection of handcrafted jewellery. Each piece tells a story of
            tradition, elegance, and unparalleled craftsmanship.
          </p>
          <Link href="/shop" className="btn-primary inline-block">
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {DEMO_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group"
            >
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-bold text-lg group-hover:text-[var(--primary)] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.productCount} products
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Collection</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/shop" className="btn-secondary inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Aurelle Jewels</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-bold text-xl mb-2">Premium Quality</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Certified gold, diamond, and precious stones with hallmark guarantee
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="font-bold text-xl mb-2">Handcrafted Excellence</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Each piece is meticulously crafted by master artisans
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="font-bold text-xl mb-2">Secure Shopping</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Safe payment options with full transparency on GST and pricing
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
