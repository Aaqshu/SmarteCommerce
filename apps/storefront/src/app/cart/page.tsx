'use client';

import Link from 'next/link';
import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { formatINR } from '@/lib/utils';

// Mock cart items for demo
const MOCK_CART_ITEMS = [
  { productId: '1', quantity: 1 },
  { productId: '2', quantity: 1 },
];

export default function CartPage() {
  const cartItems = MOCK_CART_ITEMS.map((item) => ({
    ...item,
    product: DEMO_PRODUCTS.find((p) => p.id === item.productId)!,
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Add some beautiful jewellery to your cart!
        </p>
        <Link href="/shop" className="btn-primary inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.productId}
              className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md flex gap-6"
            >
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">
                  <Link href={`/product/${item.product.slug}`} className="hover:text-[var(--primary)]">
                    {item.product.name}
                  </Link>
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {item.product.category} • {item.product.metal}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-md">
                    <button className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">-</button>
                    <span className="px-3">{item.quantity}</span>
                    <button className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">+</button>
                  </div>
                  <button className="text-[var(--accent)] text-sm hover:underline">Remove</button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[var(--primary)]">
                  {formatINR(item.product.price * item.quantity)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">incl. GST</div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md sticky top-4">
            <h2 className="font-bold text-2xl mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Items ({totalItems}):</span>
                <span className="font-semibold">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-[var(--primary)]">{formatINR(subtotal)}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 text-right mt-1">
                  (inclusive of all taxes)
                </div>
              </div>
            </div>
            <Link href="/checkout" className="btn-primary block text-center w-full">
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              className="block text-center mt-4 text-[var(--accent)] hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
