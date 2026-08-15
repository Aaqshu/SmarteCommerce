'use client';

import { useTenantConfig } from '@/app/providers';

export function Footer() {
  const config = useTenantConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">{config.name}</h3>
            <p className="text-gray-600 dark:text-gray-400">{config.tagline}</p>
          </div>

          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li><a href="/shop" className="hover:text-[var(--primary)]">Shop</a></li>
              <li><a href="/cart" className="hover:text-[var(--primary)]">Cart</a></li>
              <li><a href="/checkout" className="hover:text-[var(--primary)]">Checkout</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <p className="text-gray-600 dark:text-gray-400">
              Email: info@aurellejewels.com<br />
              Phone: +91 98765 43210
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; {currentYear} {config.name}. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by SmarteCommerce</p>
        </div>
      </div>
    </footer>
  );
}
