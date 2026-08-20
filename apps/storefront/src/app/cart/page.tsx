'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { formatINR } from '@/lib/utils';
import { useCart } from '@/components/cart-context';
import { fetchProducts } from '@/lib/api';
import type { Product } from '@smartecommerce/shared/types';

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
      />
    </svg>
  );
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [catalog, setCatalog] = useState<Product[] | null>(null);

  // Resolve product details from the live API (demo data as fallback)
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((products) => {
      if (!mounted) return;
      const resolved = products.length > 0 ? products : DEMO_PRODUCTS;
      setCatalog(resolved);
      // Prune orphaned items (product no longer in catalog) so badge & page agree
      const validIds = new Set(resolved.map((p) => p.id));
      const orphans = items.filter((i) => !validIds.has(i.productId));
      if (orphans.length > 0) {
        orphans.forEach((o) => removeItem(o.productId));
      }
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const source = catalog ?? DEMO_PRODUCTS;
  const cartItems = items
    .map((item) => ({
      ...item,
      product: source.find((p) => p.id === item.productId),
    }))
    .filter((item): item is typeof item & { product: NonNullable<typeof item.product> } => Boolean(item.product));

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Loading guard: don't flash "empty" while the catalog resolves
  if (catalog === null && items.length > 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="animate-spin inline-block w-10 h-10 border-2 border-[var(--color-accent)] border-t-transparent rounded-full" />
        <p className="mt-4 text-[var(--color-muted)]">Loading your cart…</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-stone-100 dark:from-stone-800 dark:to-stone-900 mb-8">
          <ShoppingBagIcon className="w-12 h-12 text-[var(--color-accent)]" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Your cart is empty
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          Add some beautiful jewellery to your cart!
        </p>
        <Link href="/shop" className="btn-primary inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-serif font-bold mb-12 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
        Shopping Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map((item) => (
            <div key={item.productId} className="elegant-card p-6 flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-28 h-28 bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 rounded-sm overflow-hidden shrink-0">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-lg mb-2">
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="hover:text-[var(--color-accent)] transition-colors"
                  >
                    {item.product.name}
                  </Link>
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {item.product.category} • {item.product.metal}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-0 border border-[var(--color-border)] rounded-sm overflow-hidden">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      className="px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="px-4 py-2 min-w-[3rem] text-center font-medium" data-testid={`qty-${item.productId}`}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.product.name}`}
                      className="px-4 py-2 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-[var(--color-accent)] text-sm hover:underline cursor-pointer font-medium flex items-center gap-2 group"
                    onClick={() => removeItem(item.productId)}
                  >
                    <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                <div className="text-2xl font-serif font-bold text-[var(--color-accent)]">
                  {formatINR(item.product.price * item.quantity)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">incl. GST</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="elegant-card p-8 sticky top-24">
            <h2 className="font-serif font-bold text-2xl mb-8 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Order Summary
            </h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Items ({totalItems}):</span>
                <span className="font-semibold text-[var(--color-foreground)]">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                <span className="font-semibold text-green-600 dark:text-green-500">FREE</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-4 mt-4">
                <div className="flex justify-between text-lg">
                  <span className="font-serif font-bold">Total:</span>
                  <span className="font-serif font-bold text-2xl text-[var(--color-accent)]">
                    {formatINR(subtotal)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-right mt-2">
                  (inclusive of all taxes)
                </div>
              </div>
            </div>
            <Link href="/checkout" className="btn-primary block text-center w-full mb-4">
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              className="block text-center text-sm text-[var(--color-accent)] hover:underline font-medium"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
