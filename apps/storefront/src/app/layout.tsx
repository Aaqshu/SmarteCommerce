import type { Metadata } from 'next';
import './globals.css';
import { TenantConfigProvider } from './providers';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Aurelle Jewels - Timeless Luxury',
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
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </TenantConfigProvider>
      </body>
    </html>
  );
}
