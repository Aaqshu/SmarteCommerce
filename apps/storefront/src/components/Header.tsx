'use client';

import Link from 'next/link';
import { useTenantConfig } from '@/app/providers';
import { useCart } from '@/components/cart-context';

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

export function Header() {
  const config = useTenantConfig();
  const { totalItems } = useCart();

  return (
    <header className="glass-effect border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/zainab-logo.png"
              alt={`${config.name} logo`}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[var(--color-accent)]/30 group-hover:scale-105 transition-transform duration-300"
            />
            <div>
              <h1 className="text-2xl font-serif font-bold text-[var(--color-primary)] dark:text-[var(--color-accent)] tracking-tight">
                {config.name}
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 tracking-widest uppercase">
                {config.tagline}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-medium tracking-wide hover:text-[var(--color-accent)] transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-sm font-medium tracking-wide hover:text-[var(--color-accent)] transition-colors duration-200"
            >
              Shop
            </Link>
            <Link
              href="/cart"
              className="text-sm font-medium tracking-wide hover:text-[var(--color-accent)] transition-colors duration-200"
            >
              Cart
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative group"
              aria-label={`Cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
            >
              <ShoppingBagIcon className="w-6 h-6 text-[var(--color-primary)] dark:text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] transition-colors duration-200" />
              {totalItems > 0 && (
                <span
                  data-testid="cart-badge"
                  className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-white shadow-md"
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
