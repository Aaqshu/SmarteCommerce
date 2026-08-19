import type { Metadata } from 'next';
import { Cormorant, Montserrat } from 'next/font/google';
import './globals.css';
import { TenantConfigProvider } from './providers';
import { CartProvider } from '@/components/cart-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const cormorant = Cormorant({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

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
    <html lang="en" className={`${cormorant.variable} ${montserrat.variable}`}>
      <body className={montserrat.className}>
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
