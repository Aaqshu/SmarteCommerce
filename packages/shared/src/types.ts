export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number; // in INR paise (₹1 = 100 paise)
  mrp: number;
  hsnCode: string;
  gstRate: number; // percentage
  metal: 'Gold' | 'Platinum' | 'Silver' | 'Diamond' | 'Pearl' | 'Ruby' | 'Mixed';
  purity?: string; // e.g. "22K", "18K", "92.5%"
  category: string;
  createdOn?: string | null;
  images: string[];
  stock: number;
  weight?: number; // in grams
  reviews: Review[];
  featured?: boolean;
}

export interface Review {
  id: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedVariant?: string;
}

export interface TenantConfig {
  name: string;
  tagline: string;
  logo: string; // emoji or URL
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  currency: string;
  locale: string;
  ownerName?: string;
  phones?: string[];
  instagram?: string;
  address?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}
