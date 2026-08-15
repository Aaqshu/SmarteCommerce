'use client';

import { useState } from 'react';
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from '@smartecommerce/shared/demo-data';
import { ProductCard } from '@/components/ProductCard';

const METALS = ['All', 'Gold', 'Platinum', 'Silver', 'Diamond', 'Pearl', 'Ruby', 'Mixed'];
const PRICE_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: 'Under ₹50,000', min: 0, max: 5000000 },
  { label: '₹50,000 - ₹1,00,000', min: 5000000, max: 10000000 },
  { label: 'Above ₹1,00,000', min: 10000000, max: Infinity },
];

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const filteredProducts = DEMO_PRODUCTS.filter((product) => {
    const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
    const metalMatch = selectedMetal === 'All' || product.metal === selectedMetal;
    const priceRange = PRICE_RANGES[selectedPriceRange];
    const priceMatch = product.price >= priceRange.min && product.price <= priceRange.max;

    return categoryMatch && metalMatch && priceMatch;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Shop All Jewellery</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md sticky top-4">
            <h2 className="font-bold text-xl mb-6">Filters</h2>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === 'All'}
                    onChange={() => setSelectedCategory('All')}
                  />
                  All
                </label>
                {DEMO_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.name}
                      onChange={() => setSelectedCategory(cat.name)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Metal Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Metal</h3>
              <div className="space-y-2">
                {METALS.map((metal) => (
                  <label key={metal} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="metal"
                      checked={selectedMetal === metal}
                      onChange={() => setSelectedMetal(metal)}
                    />
                    {metal}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <div className="space-y-2">
                {PRICE_RANGES.map((range, idx) => (
                  <label key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="price"
                      checked={selectedPriceRange === idx}
                      onChange={() => setSelectedPriceRange(idx)}
                    />
                    {range.label}
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
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Clear all filters
            </button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <div className="mb-4 text-gray-600 dark:text-gray-400">
            Showing {filteredProducts.length} of {DEMO_PRODUCTS.length} products
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 dark:text-gray-400">
                No products found matching your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
