'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct, fetchCategories, setStock } from '@/lib/api';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    mrp: '',
    sellingPrice: '',
    hsnCode: '7113',
    gstRate: '3',
    quantity: '10',
    imageUrl: '',
    categoryId: '',
    status: 'active',
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugify(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const product = await createProduct({
        name: formData.name,
        slug: formData.slug,
        mrp: parseFloat(formData.mrp),
        sellingPrice: parseFloat(formData.sellingPrice),
        hsnCode: formData.hsnCode,
        gstRate: parseFloat(formData.gstRate),
        description: formData.description || undefined,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        categoryId: formData.categoryId || undefined,
        status: formData.status,
      });

      // Create initial stock if quantity provided
      const quantity = parseInt(formData.quantity, 10);
      if (!Number.isNaN(quantity) && quantity > 0 && product.ProductId) {
        await setStock(product.ProductId, quantity);
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Add New Product
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Create a new product in your catalog</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="elegant-card p-8">
        <div className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="e.g., Zainab 22K Gold Ring"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Slug *
            </label>
            <input
              type="text"
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="zainab-22k-gold-ring"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Auto-generated from name, or customize
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              placeholder="Describe the product..."
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="mrp" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                MRP (₹) *
              </label>
              <input
                type="number"
                id="mrp"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="85000"
              />
            </div>

            <div>
              <label htmlFor="sellingPrice" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                id="sellingPrice"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="85000"
              />
            </div>
          </div>

          {/* HSN & GST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="hsnCode" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                HSN Code *
              </label>
              <input
                type="text"
                id="hsnCode"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                required
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="7113"
              />
            </div>

            <div>
              <label htmlFor="gstRate" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                GST Rate (%) *
              </label>
              <input
                type="number"
                id="gstRate"
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                required
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="3"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Category
            </label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Image */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                Quantity / Stock *
              </label>
              <input
                type="number"
                id="quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                min="0"
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Initial stock quantity for this product
              </p>
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
                Product Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="https://example.com/ring.jpg"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Direct image URL (optional — shows 💎 placeholder if empty)
              </p>
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Status *
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-8 pt-6 border-t border-[var(--color-border)]">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/admin/products" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
