'use client';

import Link from 'next/link';
import { useTenantConfig } from '@/app/providers';

export function Header() {
  const config = useTenantConfig();

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">{config.logo}</span>
            <div>
              <h1 className="text-2xl font-bold text-[var(--primary)]">{config.name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{config.tagline}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-[var(--primary)] transition-colors">
              Home
            </Link>
            <Link href="/shop" className="hover:text-[var(--primary)] transition-colors">
              Shop
            </Link>
            <Link href="/cart" className="hover:text-[var(--primary)] transition-colors">
              Cart
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="text-2xl hover:text-[var(--primary)] transition-colors"
              aria-label="Cart"
            >
              🛒
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
