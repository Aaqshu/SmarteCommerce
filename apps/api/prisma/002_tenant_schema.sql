-- SmarteCommerce — tenant schema (applied to each tenant_<slug> database)
-- Catalog + Inventory + Orders + GST (India) + Logistics

-- ─── Users & Auth ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Users" (
  "UserId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Phone"     VARCHAR(20) UNIQUE,
  "Email"     VARCHAR(200) UNIQUE,
  "FirstName" VARCHAR(100),
  "LastName"  VARCHAR(100),
  "Password"  VARCHAR(200),
  "Status"    VARCHAR(20) NOT NULL DEFAULT 'active',
  "Gstin"     VARCHAR(15),
  "CreatedOn" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "UpdatedOn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OtpRequests" (
  "RequestId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Phone"     VARCHAR(20),
  "Email"     VARCHAR(200),
  "OtpHash"   VARCHAR(200) NOT NULL,
  "ExpiresOn" TIMESTAMPTZ NOT NULL,
  "Verified"  BOOLEAN NOT NULL DEFAULT FALSE,
  "CreatedOn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "UserAddresses" (
  "AddressId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserId"      UUID NOT NULL REFERENCES "Users"("UserId") ON DELETE CASCADE,
  "Label"       VARCHAR(50) DEFAULT 'home',
  "FullName"    VARCHAR(150) NOT NULL,
  "Phone"       VARCHAR(20) NOT NULL,
  "Line1"       VARCHAR(255) NOT NULL,
  "Line2"       VARCHAR(255),
  "City"        VARCHAR(100) NOT NULL,
  "State"       VARCHAR(100) NOT NULL,
  "Pincode"     VARCHAR(10) NOT NULL,
  "IsDefault"   BOOLEAN NOT NULL DEFAULT FALSE,
  "CreatedOn"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Catalog ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Categories" (
  "CategoryId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Name"         VARCHAR(150) NOT NULL,
  "Slug"         VARCHAR(160) NOT NULL UNIQUE,
  "ParentId"     UUID REFERENCES "Categories"("CategoryId"),
  "SortOrder"    INT DEFAULT 0,
  "CreatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Brands" (
  "BrandId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Name"       VARCHAR(150) NOT NULL UNIQUE,
  "CreatedOn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Products" (
  "ProductId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Name"         VARCHAR(300) NOT NULL,
  "Slug"         VARCHAR(320) NOT NULL UNIQUE,
  "Description"  TEXT,
  "CategoryId"   UUID REFERENCES "Categories"("CategoryId"),
  "BrandId"      UUID REFERENCES "Brands"("BrandId"),
  "HsnCode"      VARCHAR(10) NOT NULL DEFAULT '7113',
  "GstRate"      NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  "Mrp"          NUMERIC(12,2) NOT NULL,
  "SellingPrice" NUMERIC(12,2) NOT NULL,
  "Images"       JSONB NOT NULL DEFAULT '[]',
  "Meta"         JSONB,
  "Status"       VARCHAR(20) NOT NULL DEFAULT 'active',
  "CreatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "UpdatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ProductVariants" (
  "VariantId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ProductId"    UUID NOT NULL REFERENCES "Products"("ProductId") ON DELETE CASCADE,
  "Sku"          VARCHAR(100) NOT NULL UNIQUE,
  "Attributes"   JSONB NOT NULL DEFAULT '{}',
  "Mrp"          NUMERIC(12,2),
  "SellingPrice" NUMERIC(12,2),
  "CreatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Inventory ledger ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "StockItems" (
  "StockItemId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ProductId"    UUID NOT NULL REFERENCES "Products"("ProductId") ON DELETE CASCADE,
  "LocationId"   UUID,
  "Quantity"     NUMERIC(12,3) NOT NULL DEFAULT 0,
  "AvgCost"      NUMERIC(12,2),
  "UpdatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("ProductId", "LocationId")
);

CREATE TABLE IF NOT EXISTS "StockMovements" (
  "MovementId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ProductId"    UUID NOT NULL REFERENCES "Products"("ProductId"),
  "Type"         VARCHAR(30) NOT NULL, -- purchase_receipt, sales_issue, adjustment, return_in
  "Quantity"     NUMERIC(12,3) NOT NULL,
  "UnitCost"     NUMERIC(12,2),
  "RefId"        UUID,
  "RefType"      VARCHAR(30),
  "CreatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Orders (with GST) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Orders" (
  "OrderId"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderNumber"      VARCHAR(30) NOT NULL UNIQUE,
  "UserId"           UUID NOT NULL REFERENCES "Users"("UserId"),
  "AddressId"        UUID REFERENCES "UserAddresses"("AddressId"),
  "Status"           VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending|confirmed|packed|shipped|delivered|cancelled|returned|rto
  "PaymentMethod"    VARCHAR(20) NOT NULL, -- cod|razorpay
  "PaymentStatus"    VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- unpaid|paid|refunded
  "RazorpayOrderId"  VARCHAR(100),
  "TaxableValue"     NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Cgst"             NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Sgst"             NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Igst"             NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Cess"             NUMERIC(12,2) NOT NULL DEFAULT 0,
  "ShippingCharges"  NUMERIC(12,2) NOT NULL DEFAULT 0,
  "RoundOff"         NUMERIC(6,2) NOT NULL DEFAULT 0,
  "GrandTotal"       NUMERIC(12,2) NOT NULL,
  "GstType"          VARCHAR(5) NOT NULL, -- intra|inter
  "CustomerGstin"    VARCHAR(15),
  "Notes"            TEXT,
  "CreatedOn"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "UpdatedOn"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OrderItems" (
  "OrderItemId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderId"      UUID NOT NULL REFERENCES "Orders"("OrderId") ON DELETE CASCADE,
  "ProductId"    UUID NOT NULL REFERENCES "Products"("ProductId"),
  "VariantId"    UUID REFERENCES "ProductVariants"("VariantId"),
  "Name"         VARCHAR(300) NOT NULL,
  "HsnCode"      VARCHAR(10) NOT NULL,
  "GstRate"      NUMERIC(5,2) NOT NULL,
  "Qty"          NUMERIC(12,3) NOT NULL,
  "UnitPrice"    NUMERIC(12,2) NOT NULL,
  "TaxableValue" NUMERIC(12,2) NOT NULL,
  "Cgst"         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Sgst"         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Igst"         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Cess"         NUMERIC(12,2) NOT NULL DEFAULT 0,
  "Total"        NUMERIC(12,2) NOT NULL
);

-- ─── GST: tax master + invoices ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TaxRates" (
  "TaxRateId"  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "HsnCode"    VARCHAR(10) NOT NULL UNIQUE,
  "Description" VARCHAR(300),
  "Cgst"       NUMERIC(5,2) NOT NULL DEFAULT 0,
  "Sgst"       NUMERIC(5,2) NOT NULL DEFAULT 0,
  "Igst"       NUMERIC(5,2) NOT NULL DEFAULT 0,
  "Cess"       NUMERIC(5,2) NOT NULL DEFAULT 0,
  "UpdatedOn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Invoices" (
  "InvoiceId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "InvoiceNo"    VARCHAR(40) NOT NULL UNIQUE,   -- e.g. AURELLE/24-25/0001
  "OrderId"      UUID NOT NULL REFERENCES "Orders"("OrderId"),
  "FinancialYear" VARCHAR(9) NOT NULL,          -- e.g. 2025-26
  "SellerGstin"  VARCHAR(15),
  "BuyerGstin"   VARCHAR(15),
  "InvoiceType"  VARCHAR(20) NOT NULL DEFAULT 'tax_invoice', -- tax_invoice|credit_note|debit_note
  "PdfPath"      VARCHAR(500),
  "EinvoiceJson" JSONB,
  "Irn"          VARCHAR(100),
  "CreatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Logistics (Shiprocket) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Shipments" (
  "ShipmentId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "OrderId"          UUID NOT NULL REFERENCES "Orders"("OrderId"),
  "ShiprocketId"     BIGINT,
  "AwbNumber"        VARCHAR(30),
  "CourierName"      VARCHAR(100),
  "TrackingUrl"      VARCHAR(500),
  "LabelUrl"         VARCHAR(500),
  "ExpectedDelivery" TIMESTAMPTZ,
  "Status"           VARCHAR(30) NOT NULL DEFAULT 'created',
  "CreatedOn"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ShipmentEvents" (
  "EventId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ShipmentId"   UUID NOT NULL REFERENCES "Shipments"("ShipmentId") ON DELETE CASCADE,
  "Status"       VARCHAR(30) NOT NULL, -- manifest|picked|in_transit|out_for_delivery|delivered|rto
  "Location"     VARCHAR(200),
  "Message"      TEXT,
  "EventTime"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Wallet / refunds ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "WalletTransactions" (
  "TxId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserId"     UUID NOT NULL REFERENCES "Users"("UserId"),
  "Type"       VARCHAR(20) NOT NULL, -- credit|debit
  "Amount"     NUMERIC(12,2) NOT NULL,
  "RefType"    VARCHAR(30),
  "RefId"      UUID,
  "CreatedOn"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON "Orders"("UserId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "Orders"("Status");
CREATE INDEX IF NOT EXISTS idx_products_cat ON "Products"("CategoryId");
CREATE INDEX IF NOT EXISTS idx_stockmoves_product ON "StockMovements"("ProductId");
CREATE INDEX IF NOT EXISTS idx_shipments_order ON "Shipments"("OrderId");
CREATE INDEX IF NOT EXISTS idx_shipment_events_ship ON "ShipmentEvents"("ShipmentId");

-- ─── Invoice Series (per financial year) ──────────────────────────
CREATE TABLE IF NOT EXISTS "InvoiceSeries" (
  "SeriesId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "FinancialYear" VARCHAR(9) NOT NULL,        -- e.g. 2025-26
  "Prefix"       VARCHAR(20) NOT NULL,        -- e.g. ZJ
  "LastNumber"   INT NOT NULL DEFAULT 0,
  "UpdatedOn"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("FinancialYear", "Prefix")
);
