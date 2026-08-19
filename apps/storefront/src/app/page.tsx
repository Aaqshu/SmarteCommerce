import Link from 'next/link';
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from '@smartecommerce/shared/demo-data';
import { ProductCard } from '@/components/ProductCard';

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function HandThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5.047 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

export default function HomePage() {
  const featuredProducts = DEMO_PRODUCTS.filter((p) => p.featured);

  return (
    <div>
      {/* Cinematic Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-accent)_0%,_transparent_50%)] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-sm border border-[var(--color-border)] mb-8">
            <SparklesIcon className="w-4 h-4 text-[var(--color-accent)]" />
            <span className="text-xs tracking-widest uppercase font-medium text-[var(--color-foreground)]">
              Handcrafted Excellence
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)] tracking-tight leading-[0.95]">
            Zainab Jewellers
          </h1>
          <p className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-[var(--color-accent)] mb-8">
            Timeless Luxury
          </p>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            Discover our exquisite collection of handcrafted jewellery. Each piece tells a story of
            tradition, elegance, and unparalleled craftsmanship.
          </p>
          <Link href="/shop" className="btn-primary inline-block">
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
            Shop by Category
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Curated collections for every occasion</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {DEMO_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="group"
            >
              <div className="elegant-card overflow-hidden">
                <div className="aspect-[4/3] bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                  />
                </div>
                <div className="p-5 text-center">
                  <h3 className="font-serif font-bold text-lg mb-1 group-hover:text-[var(--color-accent)] transition-colors duration-200">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 tracking-wide">
                    {category.productCount} pieces
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-gradient-to-b from-stone-50 to-white dark:from-stone-900 dark:to-black py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Signature Collection
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Our most coveted pieces</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="text-center mt-16">
            <Link href="/shop" className="btn-secondary inline-block">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
            Why Choose Zainab Jewellers
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Commitment to excellence in every detail</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-6 group-hover:scale-110 transition-transform duration-300">
              <SparklesIcon className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-3 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Premium Quality
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Certified gold, diamond, and precious stones with hallmark guarantee
            </p>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-6 group-hover:scale-110 transition-transform duration-300">
              <HandThumbUpIcon className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-3 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Handcrafted Excellence
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Each piece is meticulously crafted by master artisans
            </p>
          </div>
          <div className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheckIcon className="w-8 h-8 text-[var(--color-accent)]" />
            </div>
            <h3 className="font-serif font-bold text-xl mb-3 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Secure Shopping
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Safe payment options with full transparency on GST and pricing
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
