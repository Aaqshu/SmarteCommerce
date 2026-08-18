import type { Metadata } from 'next';
import './globals.css';
import { TenantConfigProvider } from './providers';
import { CartProvider } from '@/components/cart-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Jainab Jewellers - Timeless Luxury',
  description: 'Discover exquisite handcrafted jewellery. Premium gold, diamond, and precious stone collections.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TenantConfigProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </TenantConfigProvider>
      </body>
    </html>
  );
}
