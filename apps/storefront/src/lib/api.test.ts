import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { fetchProducts, fetchProduct } = await import('./api');

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('fetchProducts', () => {
    it('maps API PascalCase to Product camelCase', async () => {
      const apiResponse = [
        {
          ProductId: '1',
          Name: 'Test Ring',
          Slug: 'test-ring',
          Description: 'A test ring',
          HsnCode: '7113',
          GstRate: '3.00',
          Mrp: '8500000',
          SellingPrice: '8500000',
          Images: ['https://example.com/image.jpg'],
          Status: 'active',
          CategoryName: 'Rings',
          BrandName: 'TestBrand',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const products = await fetchProducts();

      expect(products).toHaveLength(1);
      expect(products[0]).toMatchObject({
        id: '1',
        name: 'Test Ring',
        slug: 'test-ring',
        description: 'A test ring',
        price: 8500000,
        mrp: 8500000,
        hsnCode: '7113',
        gstRate: 3,
        category: 'Rings',
        images: ['https://example.com/image.jpg'],
        stock: 100,
        reviews: [],
      });
    });

    it('handles empty images array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            ProductId: '1',
            Name: 'Test',
            Slug: 'test',
            HsnCode: '7113',
            GstRate: '3.00',
            Mrp: '1000',
            SellingPrice: '1000',
            Images: null,
            Status: 'active',
          },
        ],
      });

      const products = await fetchProducts();
      expect(products[0].images).toEqual([]);
    });

    it('infers metal from category name', async () => {
      const testCases = [
        { category: 'Diamond Rings', expectedMetal: 'Diamond' },
        { category: 'Pearl Necklaces', expectedMetal: 'Pearl' },
        { category: 'Platinum Bands', expectedMetal: 'Platinum' },
        { category: 'Silver Anklets', expectedMetal: 'Silver' },
        { category: 'Ruby Earrings', expectedMetal: 'Ruby' },
        { category: 'Gold Bangles', expectedMetal: 'Gold' },
        { category: 'Bracelets', expectedMetal: 'Gold' }, // fallback
      ];

      for (const { category, expectedMetal } of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [
            {
              ProductId: '1',
              Name: 'Test',
              Slug: 'test',
              HsnCode: '7113',
              GstRate: '3.00',
              Mrp: '1000',
              SellingPrice: '1000',
              Status: 'active',
              CategoryName: category,
            },
          ],
        });

        const products = await fetchProducts();
        expect(products[0].metal).toBe(expectedMetal);
      }
    });

    it('returns empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const products = await fetchProducts();
      expect(products).toEqual([]);
    });

    it('returns empty array on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      const products = await fetchProducts();
      expect(products).toEqual([]);
    });
  });

  describe('fetchProduct', () => {
    it('fetches and maps a single product', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ProductId: '1',
          Name: 'Single Product',
          Slug: 'single-product',
          HsnCode: '7113',
          GstRate: '5.00',
          Mrp: '5000000',
          SellingPrice: '4500000',
          Status: 'active',
          CategoryName: 'Earrings',
        }),
      });

      const product = await fetchProduct('single-product');

      expect(product).toMatchObject({
        id: '1',
        name: 'Single Product',
        slug: 'single-product',
        price: 4500000,
        mrp: 5000000,
        gstRate: 5,
      });
    });

    it('returns null on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const product = await fetchProduct('non-existent');
      expect(product).toBeNull();
    });

    it('returns null on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const product = await fetchProduct('test');
      expect(product).toBeNull();
    });
  });

  describe('price conversion', () => {
    it('converts string prices to integer paise', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            ProductId: '1',
            Name: 'Test',
            Slug: 'test',
            HsnCode: '7113',
            GstRate: '3.00',
            Mrp: '12345678',
            SellingPrice: '10000000',
            Status: 'active',
          },
        ],
      });

      const products = await fetchProducts();
      expect(products[0].mrp).toBe(12345678);
      expect(products[0].price).toBe(10000000);
    });
  });

  describe('GST rate conversion', () => {
    it('converts string GST rate to number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            ProductId: '1',
            Name: 'Test',
            Slug: 'test',
            HsnCode: '7113',
            GstRate: '5.50',
            Mrp: '1000',
            SellingPrice: '1000',
            Status: 'active',
          },
        ],
      });

      const products = await fetchProducts();
      expect(products[0].gstRate).toBe(5.5);
    });
  });
});
