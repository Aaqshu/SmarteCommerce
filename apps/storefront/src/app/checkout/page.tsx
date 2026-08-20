'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEMO_PRODUCTS } from '@smartecommerce/shared/demo-data';
import { formatINR } from '@/lib/utils';
import { useCart } from '@/components/cart-context';
import { fetchProducts } from '@/lib/api';
import type { Product } from '@smartecommerce/shared/types';

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

export default function CheckoutPage() {
  const { items, totalItems, subtotal: _subtotal, clearCart } = useCart();
  const [customerType, setCustomerType] = useState<'B2C' | 'B2B'>('B2C');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'Card'>('UPI');
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [placedTotal, setPlacedTotal] = useState(0);
  const [catalog, setCatalog] = useState<Product[] | null>(null);

  // Resolve product details from the live API (demo data as fallback)
  useEffect(() => {
    let mounted = true;
    fetchProducts().then((products) => {
      if (mounted) setCatalog(products.length > 0 ? products : DEMO_PRODUCTS);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const source = catalog ?? DEMO_PRODUCTS;
  const cartItems = items
    .map((item) => ({
      ...item,
      product: source.find((p) => p.id === item.productId),
    }))
    .filter((item): item is typeof item & { product: NonNullable<typeof item.product> } => Boolean(item.product));

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function handlePlaceOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty. Add items before placing an order.');
      return;
    }

    const form = e.currentTarget;
    const fullName = (form.elements.namedItem('fullName') as HTMLInputElement)?.value.trim() ?? '';
    const phone = (form.elements.namedItem('phone') as HTMLInputElement)?.value.trim() ?? '';
    const address = (form.elements.namedItem('address1') as HTMLInputElement)?.value.trim() ?? '';
    const city = (form.elements.namedItem('city') as HTMLInputElement)?.value.trim() ?? '';
    const state = (form.elements.namedItem('state') as HTMLInputElement)?.value.trim() ?? '';
    const pincode = (form.elements.namedItem('pincode') as HTMLInputElement)?.value.trim() ?? '';

    if (!fullName || !phone || !address || !city || !state || !pincode) {
      setError('Please fill in all required shipping fields (name, phone, address, city, state, PIN).');
      return;
    }
    if (!/^\+?\d{10,15}$/.test(phone.replace(/\s/g, ''))) {
      setError('Please enter a valid phone number (10-15 digits).');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (customerType === 'B2B') {
      const gstin = (form.elements.namedItem('gstin') as HTMLInputElement)?.value.trim() ?? '';
      if (!/^[0-9A-Z]{15}$/.test(gstin)) {
        setError('Please enter a valid 15-character GSTIN (B2B orders require it).');
        return;
      }
    }

    // Demo order placement — no backend yet, so simulate success
    const num = `AUR-${Date.now().toString().slice(-6)}`;
    setOrderNumber(num);
    setPlacedTotal(subtotal);
    setPlaced(true);
    clearCart();
  }

  if (placed) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-8">
          <CheckCircleIcon className="w-14 h-14 text-green-600 dark:text-green-500" />
        </div>
        <h1 className="text-4xl font-serif font-bold mb-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
          Order Placed Successfully!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-3 max-w-2xl mx-auto">
          Your order{' '}
          <span className="font-bold text-[var(--color-accent)]">{orderNumber}</span> has been confirmed.
        </p>
        <div className="elegant-card inline-block px-8 py-6 mb-10 text-left">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Payment method:</span>
              <div className="font-semibold text-[var(--color-foreground)] mt-1">{paymentMethod}</div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Total:</span>
              <div className="font-serif font-bold text-xl text-[var(--color-accent)] mt-1">
                {formatINR(placedTotal)}
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Link href="/shop" className="btn-primary inline-block">
            Continue Shopping
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            We'll send a confirmation email shortly
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-5xl font-serif font-bold mb-12 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Type */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="font-bold text-xl mb-4">Customer Type</h2>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerType"
                    checked={customerType === 'B2C'}
                    onChange={() => setCustomerType('B2C')}
                  />
                  Individual (B2C)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="customerType"
                    checked={customerType === 'B2B'}
                    onChange={() => setCustomerType('B2B')}
                  />
                  Business (B2B)
                </label>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="font-bold text-xl mb-4">Shipping Address</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      name="fullName"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input
                      name="phone"
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                  <input
                    name="address1"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    placeholder="House/Flat No., Building Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2</label>
                  <input
                    name="address2"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                    placeholder="Street, Area, Locality"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      name="city"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Mumbai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      name="state"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="Maharashtra"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">PIN Code *</label>
                    <input
                      name="pincode"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="400001"
                    />
                  </div>
                </div>

                {customerType === 'B2B' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">GSTIN (for B2B customers) *</label>
                    <input
                      name="gstin"
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                      placeholder="27ABCDE1234F1Z5"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      15-character GSTIN for business purchases
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md">
              <h2 className="font-bold text-xl mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                  />
                  <div>
                    <div className="font-semibold">UPI</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pay via Google Pay, PhonePe, Paytm, etc.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'Card'}
                    onChange={() => setPaymentMethod('Card')}
                  />
                  <div>
                    <div className="font-semibold">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Visa, Mastercard, Rupay
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <div>
                    <div className="font-semibold">Cash on Delivery (COD)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pay when you receive
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-md sticky top-4">
              <h2 className="font-bold text-2xl mb-6">Order Summary</h2>

              {cartItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  Your cart is empty.{' '}
                  <Link href="/shop" className="text-[var(--primary)] hover:underline">
                    Browse products
                  </Link>
                </p>
              ) : (
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">{item.product.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-semibold">
                        {formatINR(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Items ({totalItems}):</span>
                  <span className="font-semibold">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-[var(--primary)]">{formatINR(subtotal)}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 text-right mt-1">
                    (inclusive of all taxes)
                  </div>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-4 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/30 dark:border-red-700 p-3 text-sm text-red-700 dark:text-red-300"
                >
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                Place Order
              </button>

              <div className="mt-4 text-xs text-gray-600 dark:text-gray-400 text-center">
                By placing this order, you agree to our Terms & Conditions
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
