'use client';

import Link from 'next/link';
import { useTenantConfig } from '@/app/providers';
import { useCart } from '@/components/cart-context';

export function Header() {
  const config = useTenantConfig();
  const { totalItems } = useCart();

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
              className="relative text-2xl hover:text-[var(--primary)] transition-colors"
              aria-label={`Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
            >
              🛒
              {totalItems > 0 && (
                <span
                  data-testid="cart-badge"
                  className="absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[11px] font-bold text-white"
                >
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
