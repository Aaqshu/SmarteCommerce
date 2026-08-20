'use client';

import { useState } from 'react';
import type { Product } from '@smartecommerce/shared/types';
import { DEMO_CATEGORIES } from '@smartecommerce/shared/demo-data';
import { ProductCard } from '@/components/ProductCard';

const METALS = ['All', 'Gold', 'Platinum', 'Silver', 'Diamond', 'Pearl', 'Ruby', 'Mixed'];
const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹50,000', min: 0, max: 5000000 },
  { label: '₹50,000 - ₹1,00,000', min: 5000000, max: 10000000 },
  { label: 'Above ₹1,00,000', min: 10000000, max: Infinity },
];

interface ShopClientProps {
  products: Product[];
}

export function ShopClient({ products }: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const metalMatch = selectedMetal === 'All' || product.metal === selectedMetal;
    const priceRange = PRICE_RANGES[selectedPriceRange];
    const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;

    return categoryMatch && metalMatch && priceMatch;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Shop All Jewellery
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Discover our complete collection</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="elegant-card p-6 sticky top-24">
            <h2 className="font-serif font-bold text-xl mb-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Refine Selection
            </h2>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="font-semibold mb-4 text-sm tracking-wide uppercase text-gray-700 dark:text-gray-300">
                Category
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'All'}
                    onChange={() => setSelectedCategory('All')}
                    className="w-4 h-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm group-hover:text-[var(--color-accent)] transition-colors">All</span>
                </label>
                {DEMO_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.name}
                      onChange={() => setSelectedCategory(cat.name)}
                      className="w-4 h-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm group-hover:text-[var(--color-accent)] transition-colors">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Metal Filter */}
            <div className="mb-8 pb-8 border-b border-[var(--color-border)]">
              <h3 className="font-semibold mb-4 text-sm tracking-wide uppercase text-gray-700 dark:text-gray-300">
                Metal
              </h3>
              <div className="space-y-3">
                {METALS.map((metal) => (
                  <label key={metal} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="metal"
                      checked={selectedMetal === metal}
                      onChange={() => setSelectedMetal(metal)}
                      className="w-4 h-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm group-hover:text-[var(--color-accent)] transition-colors">
                      {metal}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4 text-sm tracking-wide uppercase text-gray-700 dark:text-gray-300">
                Price Range
              </h3>
              <div className="space-y-3">
                {PRICE_RANGES.map((range, idx) => (
                  <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={selectedPriceRange === idx}
                      onChange={() => setSelectedPriceRange(idx)}
                      className="w-4 h-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm group-hover:text-[var(--color-accent)] transition-colors">
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedMetal('All');
                setSelectedPriceRange(0);
              }}
              className="text-sm text-[var(--color-accent)] hover:underline font-medium tracking-wide mt-4"
            >
              Clear all filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-6 text-sm text-gray-600 dark:text-gray-400 tracking-wide">
            Showing {filteredProducts.length} of {products.length} pieces
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                No pieces found matching your selection.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSelectedMetal('All');
                  setSelectedPriceRange(0);
                }}
                className="text-[var(--color-accent)] hover:underline font-medium"
              >
                Clear filters to see all products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
