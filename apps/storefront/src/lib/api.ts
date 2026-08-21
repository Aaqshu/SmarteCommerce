import type { Product } from '@smartecommerce/shared/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const TENANT_DB_NAME = 'tenant_demo';

interface ApiProductRow {
  ProductId: string;
  Name: string;
  Slug: string;
  Description?: string;
  HsnCode: string;
  GstRate: string; // "3.00"
  Mrp: string; // "8500000"
  SellingPrice: string; // "8500000"
  Images?: unknown;
  Status: string;
  CreatedOn?: string | null;
  CategoryId?: string | null;
  CategoryName?: string;
  BrandName?: string;
}

/**
 * Maps API PascalCase product row to shared Product type (camelCase).
 * Infers metal type from category name or defaults to 'Gold'.
 */
function mapApiProductToProduct(row: ApiProductRow): Product {
  const images = Array.isArray(row.Images) ? row.Images as string[] : [];

  // Infer metal from category name (fallback to 'Gold')
  let metal: Product['metal'] = 'Gold';
  if (row.CategoryName) {
    const cat = row.CategoryName.toLowerCase();
    if (cat.includes('diamond')) metal = 'Diamond';
    else if (cat.includes('pearl')) metal = 'Pearl';
    else if (cat.includes('platinum')) metal = 'Platinum';
    else if (cat.includes('silver')) metal = 'Silver';
    else if (cat.includes('ruby')) metal = 'Ruby';
  }

  return {
    id: row.ProductId,
    slug: row.Slug,
    name: row.Name,
    description: row.Description || '',
    price: Math.round(parseFloat(row.SellingPrice) * 100),
    mrp: Math.round(parseFloat(row.Mrp) * 100),
    hsnCode: row.HsnCode,
    gstRate: parseFloat(row.GstRate),
    metal,
    category: row.CategoryName || 'Uncategorized',
    categoryId: row.CategoryId ?? undefined,
    createdOn: row.CreatedOn ?? null,
    status: row.Status ?? 'active',
    images,
    stock: 100, // Fallback — no inventory tracking yet
    reviews: [], // No reviews in API yet
    featured: false, // TODO: add featured flag to API
  };
}

/**
 * Fetches all products from the catalog API.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenants/${TENANT_DB_NAME}/catalog/products`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const rows: ApiProductRow[] = await response.json();
    return rows.map(mapApiProductToProduct);
  } catch (error) {
    console.error('Failed to fetch products from API:', error);
    return []; // Return empty array on error (caller handles fallback)
  }
}

/**
 * Fetches a single product by slug.
 */
export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/tenants/${TENANT_DB_NAME}/catalog/products/${slug}`, {
      next: { revalidate: 60 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const row: ApiProductRow = await response.json();
    return mapApiProductToProduct(row);
  } catch (error) {
    console.error(`Failed to fetch product "${slug}" from API:`, error);
    return null;
  }
}

/**
 * Creates a new product (admin).
 */
export async function createProduct(data: {
  name: string;
  slug: string;
  mrp: number;
  sellingPrice: number;
  hsnCode?: string;
  gstRate?: number;
  description?: string;
  categoryId?: string;
  brandId?: string;
  images?: string[];
  status?: string;
}): Promise<ApiProductRow> {
  const response = await fetch(`${API_BASE_URL}/tenants/${TENANT_DB_NAME}/catalog/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Create product failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/** Fetches product categories for the tenant. */
export async function fetchCategories(): Promise<Array<{ id: string; name: string; slug: string }>> {
  const response = await fetch(`${API_BASE_URL}/tenants/${TENANT_DB_NAME}/catalog/categories`);
  if (!response.ok) throw new Error(`Failed to fetch categories: ${response.status}`);
  const rows = (await response.json()) as Array<{
    CategoryId: string;
    Name: string;
    Slug: string;
  }>;
  return rows.map((r) => ({ id: r.CategoryId, name: r.Name, slug: r.Slug }));
}

/**
 * Sets/creates stock for a product (admin) via the inventory receive endpoint.
 */
export async function setStock(productId: string, quantity: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/inventory/products/${productId}/receive`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Set stock failed: ${response.status} ${errorText}`);
  }
}

/**
 * Updates an existing product (admin).
 */
export async function updateProduct(
  productId: string,
  patch: Partial<{
    name: string;
    description: string;
    mrp: number;
    sellingPrice: number;
    hsnCode: string;
    gstRate: number;
    categoryId: string;
    brandId: string;
    images: string[];
    status: string;
  }>
): Promise<ApiProductRow | null> {
  const response = await fetch(`${API_BASE_URL}/tenants/${TENANT_DB_NAME}/catalog/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update product failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Seeds the server-side cart with items from the browser cart (checkout flow).
 * Calls POST /cart/:cartId/items for each item sequentially.
 */
export async function createCart(
  cartId: string,
  items: { productId: string; quantity: number }[]
): Promise<void> {
  try {
    for (const item of items) {
      const response = await fetch(
        `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/cart/${cartId}/items`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Add cart item failed: ${response.status} ${errorText}`);
      }
    }
  } catch (error) {
    console.error('Failed to create cart on server:', error);
    throw error;
  }
}

interface ApiOrderResponse {
  OrderId: string;
  OrderNumber: string;
  GrandTotal: string;
}

/**
 * Places an order from the server-side cart (checkout flow).
 * POST /orders/:cartId with customer + payment details.
 * Returns the created order ID, order number, and grand total (in paise).
 * Falls back to a local pseudo-order if the network fails (offline support).
 */
export async function placeOrder(
  cartId: string,
  payload: {
    phone: string;
    firstName: string;
    paymentMethod: 'cod' | 'razorpay';
    sellerState: string;
    buyerState: string;
    customerGstin?: string;
    notes?: string;
  }
): Promise<{ orderId: string; orderNumber: string; grandTotal: number }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/orders/${cartId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Place order failed: ${response.status} ${errorText}`);
    }

    const data: ApiOrderResponse = await response.json();
    return {
      orderId: data.OrderId,
      orderNumber: data.OrderNumber,
      grandTotal: Math.round(parseFloat(data.GrandTotal) * 100),
    };
  } catch (error) {
    console.error('Failed to place order via API, falling back to local order:', error);
    // Offline fallback: return a local pseudo-order so the success screen still works
    return {
      orderId: `local-${Date.now()}`,
      orderNumber: `LOCAL-${Date.now().toString().slice(-6)}`,
      grandTotal: 0,
    };
  }
}

interface ApiPaymentOrderResponse {
  razorpayOrderId: string;
}

/**
 * Creates a Razorpay payment order for an existing order.
 * POST /tenants/:tenant/payments/orders/:orderId
 * Returns the Razorpay order ID needed to open the checkout.
 */
export async function createPaymentOrder(orderId: string): Promise<string> {
  const response = await fetch(
    `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/payments/orders/${orderId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Create payment order failed: ${response.status} ${errorText}`);
  }

  const data: ApiPaymentOrderResponse = await response.json();
  return data.razorpayOrderId;
}

// Admin Orders API

interface ApiOrderRow {
  OrderId: string;
  OrderNumber: string;
  UserId: string;
  Status: string;
  PaymentMethod: string;
  PaymentStatus: string;
  TaxableValue: string;
  Cgst: string;
  Sgst: string;
  Igst: string;
  GrandTotal: string;
  GstType: string;
  CustomerGstin: string | null;
  Notes: string | null;
  CreatedOn: string;
}

export interface Order {
  orderId: string;
  orderNumber: string;
  userId: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  taxableValue: number; // in paise
  cgst: number; // in paise
  sgst: number; // in paise
  igst: number; // in paise
  grandTotal: number; // in paise
  gstType: string;
  customerGstin: string | null;
  notes: string | null;
  createdOn: string;
}

/**
 * Maps API PascalCase order row to camelCase Order type.
 */
function mapApiOrderToOrder(row: ApiOrderRow): Order {
  return {
    orderId: row.OrderId,
    orderNumber: row.OrderNumber,
    userId: row.UserId,
    status: row.Status,
    paymentMethod: row.PaymentMethod,
    paymentStatus: row.PaymentStatus,
    taxableValue: Math.round(parseFloat(row.TaxableValue) * 100),
    cgst: Math.round(parseFloat(row.Cgst) * 100),
    sgst: Math.round(parseFloat(row.Sgst) * 100),
    igst: Math.round(parseFloat(row.Igst) * 100),
    grandTotal: Math.round(parseFloat(row.GrandTotal) * 100),
    gstType: row.GstType,
    customerGstin: row.CustomerGstin,
    notes: row.Notes,
    createdOn: row.CreatedOn,
  };
}

/**
 * Fetches all orders (admin).
 * Optional status filter: pending, confirmed, packed, shipped, delivered, cancelled, returned, rto
 */
export async function fetchOrders(status?: string): Promise<Order[]> {
  try {
    const url = status
      ? `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/orders?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/orders`;

    const response = await fetch(url, {
      cache: 'no-store', // Admin data should be fresh
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const rows: ApiOrderRow[] = await response.json();
    return rows.map(mapApiOrderToOrder);
  } catch (error) {
    console.error('Failed to fetch orders from API:', error);
    return [];
  }
}

/**
 * Updates order status (admin).
 * PATCH /tenants/:tenant/orders/:orderId/status
 */
export async function updateOrderStatus(orderId: string, status: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/orders/${orderId}/status`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Update order status failed: ${response.status} ${errorText}`);
  }
}

interface ApiInvoiceResponse {
  InvoiceId: string;
  InvoiceNo: string;
}

export interface Invoice {
  invoiceId: string;
  invoiceNo: string;
}

/**
 * Creates an invoice for an order (admin).
 * POST /tenants/:tenant/invoices/orders/:orderId
 */
export async function createInvoiceForOrder(orderId: string): Promise<Invoice> {
  const response = await fetch(
    `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/invoices/orders/${orderId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Create invoice failed: ${response.status} ${errorText}`);
  }

  const data: ApiInvoiceResponse = await response.json();
  return {
    invoiceId: data.InvoiceId,
    invoiceNo: data.InvoiceNo,
  };
}

/**
 * Opens the invoice PDF in a new window (admin).
 * GET /tenants/:tenant/invoices/:invoiceId/pdf
 */
export function downloadInvoicePDF(invoiceId: string): void {
  const url = `${API_BASE_URL}/tenants/${TENANT_DB_NAME}/invoices/${invoiceId}/pdf`;
  window.open(url, '_blank');
}
