'use client';

import { useTenantConfig } from '@/app/providers';

export function Footer() {
  const config = useTenantConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] mt-20 bg-gradient-to-b from-white to-stone-50 dark:from-black dark:to-stone-950">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-serif font-bold text-xl mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              {config.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm italic">
              {config.tagline}
            </p>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Quick Links
            </h4>
            <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-sm">
              <li>
                <a
                  href="/shop"
                  className="hover:text-[var(--color-accent)] transition-colors duration-200 inline-block"
                >
                  Shop
                </a>
              </li>
              <li>
                <a
                  href="/cart"
                  className="hover:text-[var(--color-accent)] transition-colors duration-200 inline-block"
                >
                  Cart
                </a>
              </li>
              <li>
                <a
                  href="/checkout"
                  className="hover:text-[var(--color-accent)] transition-colors duration-200 inline-block"
                >
                  Checkout
                </a>
              </li>
              <li className="pt-2 border-t border-[var(--color-border)]">
                <a
                  href="/admin"
                  className="hover:text-[var(--color-accent)] transition-colors duration-200 inline-block opacity-60"
                >
                  Admin
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg mb-4 text-[var(--color-primary)] dark:text-[var(--color-foreground)]">
              Contact
            </h4>
            <div className="text-gray-600 dark:text-gray-400 text-sm space-y-2">
              {config.ownerName && <p className="font-medium">Proprietor: {config.ownerName}</p>}
              {config.phones?.map((phone) => (
                <p key={phone}>
                  <a
                    href={`tel:+91${phone}`}
                    className="hover:text-[var(--color-accent)] transition-colors duration-200"
                  >
                    📞 +91 {phone}
                  </a>
                </p>
              ))}
              {config.instagram && (
                <p>
                  <a
                    href={`https://instagram.com/${config.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-accent)] transition-colors duration-200"
                  >
                    📷 @{config.instagram}
                  </a>
                </p>
              )}
              {config.address && (
                <p className="leading-relaxed">📍 {config.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-border)] pt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
          <p className="mb-2">&copy; {currentYear} {config.name}. All rights reserved.</p>
          <p className="text-xs tracking-wide">Powered by SmarteCommerce</p>
        </div>
      </div>
    </footer>
  );
}
