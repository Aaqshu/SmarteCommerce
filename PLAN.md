# SaaS Configurable E-Commerce Platform — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** A multi-tenant, configurable e-commerce SaaS platform for Indian sellers with a full GST module (Indian tax system), order fulfillment via logistics APIs, and a white-label storefront per tenant.

**Architecture:** Microservices-lite monorepo (Turborepo): Next.js storefront + admin app (tenant-configured), NestJS API (the user's proven stack from MatrimonialWebAppUI), PostgreSQL 16 with **one schema per tenant** (row-level tenant isolation via `tenant_id` column, `STORE SCHEMA` pattern — proven in StockFlow), Redis for carts/sessions, BullMQ for async jobs (GST invoice generation, logistics webhooks).

**Tech Stack:**
- Frontend: Next.js 16 (App Router) + React 19 + shadcn/ui + **ui-ux-pro-max-skill** design library (nextlevelbuilder/ui-ux-pro-max-skill — already in your Claude Code setup)
- Backend: NestJS (Node 22) + TypeScript + Prisma or raw pg (raw SQL proven in MatrimonialWebAppUI)
- DB: PostgreSQL 16 (multi-tenant via schema-per-tenant)
- Cache/Queue: Redis + BullMQ
- Payments: Razorpay (UPI mandatory for India)
- Logistics: Shiprocket (best Indian logistics aggregator — multi-courier, COD, tracking webhooks) with Delhivery/Dunzo as alternates
- GST: govt GSTIN validation (GSTN API via third-party), HSN/SAC master, invoice PDF (e-invoice JSON schema)
- Hosting: VPS 178.212.35.171 (existing), Docker Compose (proven pattern)

---

## Domain Model Overview

**Tenant** (the seller/business): `tenant_id`, `business_name`, `gstin`, `logo`, `theme_config` (JSON — colors/fonts/hero), `plan`, `status`
**Catalog**: Products (SKU, HSN code, price, GST rate, stock), Categories, Brands, Variants (size/color)
**Inventory**: Stock locations, stock movements (ledger — reuse StockFlow ledger pattern)
**Orders**: Orders → OrderItems, OrderStatus (pending → confirmed → packed → shipped → delivered/cancelled), Return/Refund
**Customers**: Customer profiles, addresses, phone (OTP login — proven pattern), wallet
**GST**: GSTIN (per tenant + per customer billing), TaxRates (HSN → CGST/SGST/IGST), TaxInvoices (invoice # series per tenant + financial year), E-Invoice JSON, Credit/Debit notes, Input credit tracking
**Logistics**: Shipments (order_id, courier, awb_number, tracking_url, status), ShipmentEvents (webhook-synced)
**Config**: TenantConfig (storefront switches, payment gateway keys, logistics API keys, GST settings) — the "configurable" part

---

# PHASE 0 — Foundation & Monorepo (3-4 days)

### Task 0.1: Initialize Turborepo monorepo
- Create: `ecommerce-saas/` with Turborepo + pnpm workspaces
- Apps: `apps/storefront` (Next.js), `apps/admin` (Next.js), `apps/api` (NestJS)
- Packages: `packages/database` (migrations), `packages/shared` (types, GST utils), `packages/config` (eslint/tsconfig)
- Verify: `pnpm dev` boots all three with placeholder pages
- Commit: `chore: init turborepo monorepo`

### Task 0.2: Docker Compose infra (postgres, redis, mailpit)
- `docker-compose.yml` — postgres 16-alpine, redis 7, mailpit
- `.env.example` — DATABASE_URL, REDIS_URL, JWT secrets
- Verify: `docker compose up -d` + health checks green
- Commit: `chore: add docker compose infra`

### Task 0.3: Prisma schema — core tables
- `packages/database/prisma/schema.prisma`:
  - `Tenants`, `TenantConfig`, `Users`, `Roles`/`Permissions`, `Sessions`
- Multi-tenant strategy decision: **schema-per-tenant** (`tenant_<slug>` schemas) for isolation (same as Matrimonial), admin DB holds registry
- Migration files: `001_admin_schema.sql`, `002_tenant_schema.sql`
- Verify: `prisma db push` + migration applies
- Commit: `feat: core schema (tenants, users, config)`

### Task 0.4: Auth (JWT + OTP, multi-tenant)
- Phone/email OTP login (reuse Matrimonial pattern: request → verify → JWT)
- **OTP delivery: WhatsApp via existing Baileys bridge (FREE)** — SMS provider optional fallback
- JWT carries `tenant_id`; tenant resolution via host header (`shop1.domain.com` → tenant)
- Verify: e2e test — login returns token, wrong-tenant token rejected
- Commit: `feat: multi-tenant OTP auth`

### Task 0.5: Theme/branding engine (configurable part #1)
- `theme_config` JSON → CSS variables injected at runtime (exactly StockFlow's branding approach)
- Storefront renders tenant name/logo/colors from DB, no redeploy
- Verify: two tenants show different branding from one deploy
- Commit: `feat: tenant branding engine`

---

# PHASE 1 — Catalog & Inventory (4-5 days)

### Task 1.1: Product catalog
- Models: `Products` (name, slug, description, HSN, price, mrp, tax_rate, images, status), `Categories`, `Brands`, `ProductVariants`
- Storefront: product listing + detail pages (ui-ux-pro-max design)
- Admin: product CRUD with image upload (reuse photos module pattern)
- Verify: e2e — create product → visible on storefront
- Commit: `feat: product catalog`

### Task 1.2: Inventory ledger (reuse StockFlow pattern)
- `StockItems` (product+location), `StockMovements` (purchase/issue/adjust) with row locking + average costing
- Stock deduction on order placement (transactional)
- Verify: e2e — place order reduces stock atomically, race test
- Commit: `feat: inventory ledger`

### Task 1.3: Cart (Redis-backed)
- `CartService` — Redis hash per session, merge on login
- Storefront cart drawer + checkout preview
- Verify: cart persists, price/stock re-validated at checkout
- Commit: `feat: redis cart`

---

# PHASE 2 — GST MODULE (Indian Tax System) (6-8 days) ⭐ core differentiator

### Task 2.1: GST rate master + HSN/SAC
- `TaxRates` table: HSN code, description, CGST %, SGST %, IGST %, cess
- Seed with India GST master (~200 common HSN codes: 1001-9999)
- Service: `taxForHsn(hsn)` → rate breakdown; `taxTypeForState(fromState, toState)` → CGST+SGST (same state) vs IGST (interstate)
- Verify: unit tests — intra vs inter state tax calc
- Commit: `feat: GST rate master + HSN`

### Task 2.2: GSTIN validation (free — no paid API)
- `GSTIN` format validation (15-char regex: `^[0-9A-Z]{15}$` + checksum logic) — **100% free, no third-party API**
- Store per-tenant GSTIN + per-customer billing GSTIN (B2B)
- Verify: unit test validates valid/invalid GSTINs
- Commit: `feat: GSTIN validation (format + checksum)`

### Task 2.3: Tax engine on orders
- OrderItems compute: taxable_value, CGST, SGST/IGST per line (HSN-based)
- Order totals: taxable, tax, cess, round-off, grand total
- Reverse-charge handling (B2B unregistered receiver) flag
- Verify: e2e — inter-state order shows IGST, intra-state shows CGST+SGST; totals match GST formula
- Commit: `feat: GST tax engine on orders`

### Task 2.4: Invoice generation (GST invoice # series)
- Per-tenant per-financial-year invoice series (e.g. `ABC/24-25/0001`)
- `Invoices` table: invoice_no, order_id, gstin, buyer details, line items, tax summary
- PDF generation (react-pdf or pdfkit) with GST invoice template (INR, HSN, tax breakup — mandatory fields)
- Verify: e2e — order → invoice created with correct series + PDF downloadable
- Commit: `feat: GST invoice generation`

### Task 2.5: E-invoice JSON (GSTN IRP)
- Generate e-invoice JSON (IRN request format) — schema per GSTN spec
- Integration stub for IRP (sandbox) — IRN generation, QR code embedding
- Verify: JSON validates against e-invoice schema
- Commit: `feat: e-invoice JSON`

### Task 2.6: Credit/Debit notes (returns)
- Return → Credit Note (reduces output tax liability); debit note for corrections
- Link to original invoice, series per tenant
- Verify: e2e — return generates credit note
- Commit: `feat: credit/debit notes`

### Task 2.7: GST reports
- GSTR-1 summary (outward supplies), GSTR-3B summary (monthly)
- HSN-wise summary report, sales register with tax
- Export CSV/PDF for filing
- Verify: seeded orders → report totals match DB
- Commit: `feat: GST reports`

---

# PHASE 3 — Orders, Payments & Logistics (5-6 days)

### Task 3.1: Checkout flow
- Address management, payment selection (COD / Razorpay / UPI)
- Order creation (transactional: stock check → order → payment intent)
- Verify: e2e checkout happy path
- Commit: `feat: checkout`

### Task 3.2: Razorpay integration
- Payment intents, webhook verification (signature check), order status sync
- Refunds (linked to returns)
- Verify: sandbox payment completes → order confirmed
- Commit: `feat: razorpay payments`

### Task 3.3: Shiprocket logistics integration ⭐ (sandbox free — pay only on live parcels)
- Account/API key per tenant (configurable — `TenantConfig.logistics`); **Shiprocket sandbox is free during development**
- **Order push**: create shipment (pickup address from tenant config, delivery from order, weight/dimensions from items, COD flag)
- **AWB + tracking**: store `awb_number`, `courier`, `tracking_url`, `expected_delivery`
- **Webhook ingestion**: `POST /webhooks/shiprocket` → ShipmentEvents table (status: manifest → picked → in_transit → out_for_delivery → delivered → RTO)
- **Order status sync**: delivered event → order marked delivered
- Verify: sandbox shipment created, webhook sim updates tracking; e2e order → shipment → tracking visible to customer
- Commit: `feat: shiprocket logistics`

### Task 3.4: Seller dashboard
- Orders list w/ filters, shipment actions (create/label/track), returns management
- Verify: admin can see live tracking per order
- Commit: `feat: seller orders dashboard`

---

# PHASE 4 — Configurability & Storefront Polish (4-5 days)

### Task 4.1: Storefront config system (configurable part #2)
- `TenantConfig` JSON schema: store name, logo, hero banner, featured categories, payment methods toggle, COD toggle, GST display toggle, currency/INR, announcement bar
- Admin UI: settings pages write to config (ui-ux-pro-max design)
- Storefront reads config at runtime (API, not rebuild)
- Verify: change banner/logo in admin → storefront updates without deploy
- Commit: `feat: storefront config engine`

### Task 4.2: Admin theme builder
- Color picker → CSS variables, font picker, layout density
- Live preview in admin
- Verify: theme JSON persisted → storefront restyled
- Commit: `feat: theme builder`

### Task 4.3: White-label domains
- `Tenant.custom_domain` + host-based resolution; Caddy vhost per domain (proven pattern)
- Verify: two domains → two stores from one deploy
- Commit: `feat: white-label domains`

### Task 4.4: Storefront UX (ui-ux-pro-max)
- Product cards, quick view, filters, search (reuse Matrimonial search pattern), wishlist, reviews/stars
- Apply ui-ux-pro-max-skill design system throughout
- Verify: lighthouse > 80 mobile
- Commit: `feat: storefront UX polish`

---

# PHASE 5 — SaaS Billing & Multi-Tenant Admin (4-5 days)

### Task 5.1: Tenant provisioning
- Admin: create tenant → provisions schema, seeds config, creates admin user
- Verify: e2e — provision tenant → login → configure store
- Commit: `feat: tenant provisioning`

### Task 5.2: Plan/subscription (Razorpay subscriptions)
- Plans: Starter/Pro/Enterprise, feature flags per plan
- Tenant billing via Razorpay subscriptions
- Verify: sandbox subscription → plan active
- Commit: `feat: tenant subscriptions`

### Task 5.3: Platform admin dashboard
- All tenants list, status, plan, revenue, per-tenant metrics
- Suspend/activate tenants (feature flags toggle)
- Verify: admin actions reflect on tenant access
- Commit: `feat: platform admin`

### Task 5.4: Activity log + audit (reuse Matrimonial pattern)
- Audit trail for orders, invoices, config changes
- Verify: config change logged
- Commit: `feat: audit log`

---

# PHASE 6 — Hardening, Testing & Deploy (4-5 days)

### Task 6.1: Security
- Rate limiting (OTP, login), input validation (class-validator), JWT expiry/refresh
- UFW (only 22/80/443), postgres/redis localhost-only (learned from the matrimonial attack!)
- Backup cron: nightly pg_dump per tenant DB to `/root/backups`
- Verify: `hermes doctor`-style checklist; port scan clean
- Commit: `security: harden + backups`

### Task 6.2: Full test suite
- e2e: auth, catalog, cart, checkout, GST calc, invoice, logistics webhook
- Target: >100 tests, all green via `jest --runInBand`
- Verify: `pnpm test` green
- Commit: `test: full e2e suite`

### Task 6.3: Deploy to VPS (proven pattern)
- Docker Compose `-p ecommerce-deploy` on 178.212.35.171
- Caddy: `app1.brndrockstar.com`, `app2.brndrockstar.com`, `admin.brndrockstar.com`
- Git pull → `docker compose -p ecommerce-deploy up -d --build` (same as matrimonial)
- Verify: both stores live + SSL
- Commit: `deploy: vps`

### Task 6.4: Production checklist
- SMTP (mailpit → **free SendGrid tier** or VPS SMTP), WhatsApp OTP (Baileys bridge — free), Razorpay live keys, Shiprocket live keys
- Monitoring: uptime, error logs (existing VPS logging)

---

# API Endpoint Map (key routes)

```
POST   /auth/otp/request | /auth/otp/verify          — login
GET    /tenant/resolve?host=                          — tenant resolution
GET    /catalog/products?filters=                     — storefront catalog
POST   /cart/items | GET /cart | PATCH /cart/items    — cart
POST   /orders                                         — checkout
POST   /orders/:id/pay                                 — razorpay intent
POST   /webhooks/razorpay                              — payment confirm
POST   /webhooks/shiprocket                            — logistics events
GET    /orders/:id/tracking                            — customer tracking view
GET    /gst/rates?hsn=                                 — tax lookup
POST   /invoices                                       — generate invoice
GET    /invoices/:id/pdf                               — invoice PDF
GET    /reports/gstr1 | /reports/gstr3b                — GST reports
GET    /admin/tenants | POST /admin/tenants            — platform admin
PATCH  /admin/tenants/:id/plan | /status               — plan/status mgmt
PATCH  /tenant/config                                  — storefront config
```

---

# Cost Optimization (applied — ₹0 to run MVP)

All four cost-saving decisions are baked into the plan above:

1. **OTP delivery = WhatsApp via existing Baileys bridge (FREE)** — no SMS provider needed. SMS becomes optional fallback only. (Task 0.4)
2. **GSTIN validation = format + checksum only (FREE)** — no paid verification API (Signzy/Vernacular/Quicko removed entirely). (Task 2.2)
3. **Email = free SendGrid tier or VPS SMTP** — no paid email service. (Task 6.4)
4. **Shiprocket sandbox during development (FREE)** — pay only per live parcel (₹35-90/kg) once real shipping starts. (Task 3.3)

**Remaining real-world costs at go-live:** Razorpay ~2%/transaction + Shiprocket per-parcel shipping. Nothing else.

---

# Risks & Tradeoffs

| Risk | Mitigation |
|------|-----------|
| GST rules complexity (rates change) | Rate master in DB, not code; admin-editable |
| Shiprocket sandbox vs live | Config flag per tenant; webhook sim endpoint for dev |
| Multi-tenant schema sprawl | Registry in admin DB; automated migration runner across schemas |
| Razorpay webhook security | Signature verification mandatory |
| VPS load with N tenants | Per-tenant DB sizing; Redis caching; monitor via docker stats |
| GSTIN verification without paid API | Format+checksum validation only (free); note in UI that govt verification is pending |
| ui-ux-pro-max-skill is an AI skill, not a component lib | Use it to *generate* shadcn-based components in Claude Code sessions (your proven workflow) |

# Open Questions

1. **Logistics provider**: Shiprocket (recommended — all-in-one Indian courier aggregator) vs Delhivery vs Dunzo? Confirm API key availability.
2. **E-invoice IRP**: sandbox only first, or live IRN (needs GSTN credentials)?
3. **Hosting**: same VPS (178.212.35.171) OK for MVP? (yes for demo; scale later)
4. **Payments**: Razorpay confirmed (UPI)? Any existing merchant account?
5. **Storefront domains**: `shop1.brndrockstar.com`, `shop2.brndrockstar.com` for demo tenants?

---

**Estimated timeline:** 6-8 weeks total (Phase 0-1: ~2 weeks, Phase 2 GST: ~1.5 weeks, Phase 3: ~1.5 weeks, Phase 4-5: ~2 weeks, Phase 6: ~1 week)

**Suggested execution order:** Phases 0→1→2 are sequential (GST needs catalog+orders). Phases 3-4 can partially parallelize after Phase 2. Phase 5-6 wrap up.
