'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchProducts, updateProduct } from '@/lib/api';
import type { Product } from '@smartecommerce/shared/types';

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const router = useRouter();
  const [productId, setProductId] = useState<string>('');
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mrp: '',
    sellingPrice: '',
    hsnCode: '',
    gstRate: '',
    imageUrl: '',
    status: 'active',
  });

  useEffect(() => {
    params.then(({ productId: id }) => {
      setProductId(id);
      loadProduct(id);
    });
  }, [params]);

  const loadProduct = async (id: string) => {
    try {
      const products = await fetchProducts();
      const found = products.find((p) => p.id === id);

      if (!found) {
        setError('Product not found');
        setLoading(false);
        return;
      }

      setProduct(found);
      setFormData({
        name: found.name,
        description: found.description || '',
        mrp: (found.mrp / 100).toString(),
        sellingPrice: (found.price / 100).toString(),
        hsnCode: found.hsnCode,
        gstRate: found.gstRate.toString(),
        imageUrl: found.images[0] || '',
        status: 'active', // Default since API doesn't return status
      });
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateProduct(productId, {
        name: formData.name,
        description: formData.description || undefined,
        mrp: parseFloat(formData.mrp),
        sellingPrice: parseFloat(formData.sellingPrice),
        hsnCode: formData.hsnCode,
        gstRate: parseFloat(formData.gstRate),
        images: formData.imageUrl ? [formData.imageUrl] : [],
        status: formData.status,
      });

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300">
          {error}
        </div>
        <Link href="/admin/products" className="text-[var(--color-accent)] hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-5xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Edit Product
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Update product details</p>
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-white dark:bg-stone-900 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>

          {/* Slug (read-only) */}
          <div>
            <label htmlFor="slug" className="block text-sm font-semibold mb-2 text-[var(--color-foreground)]">
              Slug
            </label>
            <input
              type="text"
              id="slug"
              value={product?.slug || ''}
              disabled
              className="w-full px-4 py-2 border border-[var(--color-border)] rounded bg-gray-100 dark:bg-stone-800 text-gray-500 dark:text-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Slug cannot be changed after creation
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
              />
            </div>
          </div>

          {/* Image URL */}
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
              Direct image URL (shows 💎 placeholder if empty)
            </p>
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
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/products" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
