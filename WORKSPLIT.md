# SmarteCommerce — Phase Plan & Work Distribution

> Working model: **Hermes (me) + Claude Code in parallel** on separate feature branches, tests before merge, merge to main, deploy to VPS (178.212.35.171). Same proven process as MatrimonialWebAppUI.
>
> **Split rule (established):** Frontend/design/UI → Claude Code (ui-ux-pro-max skill). Backend/API/DB/infra → Hermes.

---

## Phase 0 — Foundation (Monorepo + Infra + Auth)

| # | Task | Owner |
|---|------|-------|
| 0.1 | Turborepo monorepo scaffold (apps: storefront, admin, api; packages: database, shared, config) | **Hermes** |
| 0.2 | Docker Compose infra (postgres 16, redis, mailpit) + .env.example | **Hermes** |
| 0.3 | Prisma schema — core tables (Tenants, TenantConfig, Users, Roles) + migration strategy (schema-per-tenant) | **Hermes** |
| 0.4 | Auth API — OTP request/verify (WhatsApp delivery), JWT with tenant_id, tenant resolution by host | **Hermes** |
| 0.5 | Storefront shell — Next.js app with routing + tenant branding engine (CSS vars from TenantConfig) | **Claude Code** (ui-ux-pro-max) |
| 0.6 | Admin shell — Next.js app, layout, sidebar, login page wired to API | **Claude Code** |
| 0.7 | e2e tests: auth flows (login, wrong-tenant token rejected) | **Hermes** |

**Merge gate:** tsc clean + e2e green → merge to main.

---

## Phase 1 — Catalog & Inventory

| # | Task | Owner |
|---|------|-------|
| 1.1 | Products API — CRUD, variants, HSN, tax_rate, images, status | **Hermes** |
| 1.2 | Categories/Brands API | **Hermes** |
| 1.3 | Inventory ledger (StockItems + StockMovements, row locking, avg costing) | **Hermes** |
| 1.4 | Cart API (Redis-backed, session + login merge) | **Hermes** |
| 1.5 | Storefront: product listing/detail/cart pages | **Claude Code** |
| 1.6 | Admin: product CRUD UI, category tree, image upload | **Claude Code** |
| 1.7 | e2e tests: catalog CRUD, stock deduction race test, cart flow | **Hermes** |

---

## Phase 2 — GST Module (India) ⭐

| # | Task | Owner |
|---|------|-------|
| 2.1 | TaxRates master + HSN seed data (~200 codes) + tax calc service (intra vs inter state) | **Hermes** |
| 2.2 | GSTIN validation (15-char format + checksum — FREE, no API) | **Hermes** |
| 2.3 | Tax engine on orders (CGST/SGST/IGST per line, totals) | **Hermes** |
| 2.4 | Invoice generation (series per tenant+F.Y., PDF template) | **Hermes** (PDF lib) + **Claude Code** (template design) |
| 2.5 | E-invoice JSON (IRP format, sandbox) | **Hermes** |
| 2.6 | Credit/Debit notes (returns) | **Hermes** |
| 2.7 | GST reports (GSTR-1, GSTR-3B, HSN summary, CSV export) | **Hermes** (API) + **Claude Code** (report UI) |
| 2.8 | Admin UI: GST settings (business GSTIN, invoice prefix), invoice list/PDF view | **Claude Code** |
| 2.9 | e2e tests: intra/inter-state tax math, invoice series, credit note, GSTR-1 totals | **Hermes** |

---

## Phase 3 — Orders, Payments & Logistics

| # | Task | Owner |
|---|------|-------|
| 3.1 | Checkout API (address, payment select, transactional order creation) | **Hermes** |
| 3.2 | Razorpay integration (intents, webhook verify, refunds) | **Hermes** |
| 3.3 | Shiprocket integration (order push, AWB, webhooks, status sync) | **Hermes** |
| 3.4 | Checkout page (multi-step UI: address → payment → confirm) | **Claude Code** |
| 3.5 | Order confirmation + tracking page (shipment timeline) | **Claude Code** |
| 3.6 | Seller orders dashboard (list, detail, ship action, track) | **Claude Code** |
| 3.7 | e2e tests: checkout, razorpay webhook, shiprocket webhook sim, tracking | **Hermes** |

---

## Phase 4 — Configurability & Storefront Polish

| # | Task | Owner |
|---|------|-------|
| 4.1 | TenantConfig engine (JSON schema, admin settings API) | **Hermes** |
| 4.2 | Theme builder UI (colors → CSS vars, live preview) | **Claude Code** |
| 4.3 | White-label domains (custom_domain + host resolution + Caddy vhosts) | **Hermes** |
| 4.4 | Storefront UX polish (product cards, quick view, filters, wishlist, reviews) | **Claude Code** |
| 4.5 | e2e tests: config change reflects without redeploy | **Hermes** |

---

## Phase 5 — SaaS Billing & Platform Admin

| # | Task | Owner |
|---|------|-------|
| 5.1 | Tenant provisioning (create → schema → seed → admin user) | **Hermes** |
| 5.2 | Plans/subscriptions (Razorpay subscriptions, feature flags) | **Hermes** |
| 5.3 | Platform admin dashboard (tenants list, status, revenue, suspend/activate) | **Claude Code** |
| 5.4 | Audit log (orders, invoices, config changes) | **Hermes** |
| 5.5 | e2e tests: provision flow, plan change, suspend → access blocked | **Hermes** |

---

## Phase 6 — Hardening, Testing & Deploy

| # | Task | Owner |
|---|------|-------|
| 6.1 | Security: rate limiting, validation, UFW (22/80/443 only), postgres/redis localhost-only, nightly pg_dump backups | **Hermes** |
| 6.2 | Full e2e suite pass (>100 tests) | **Hermes** |
| 6.3 | Deploy to VPS (docker compose -p smartecommerce-deploy, Caddy: shop1.brndrockstar.com, admin.brndrockstar.com) | **Hermes** |
| 6.4 | Production checklist: SendGrid free tier, WhatsApp OTP, Razorpay live, Shiprocket live | **Hermes** + **Claude Code** (final QA pass) |

---

## Git Workflow (same as before)

```
main        ── stable, always green
├── hermes/*     ← backend branches (Hermes)
└── claude/*     ← frontend branches (Claude Code)

per feature: branch → implement → tests green → PR → merge to main → deploy
```

- Claude Code: **one well-scoped task per run**, max-turns 30-45, "don't churn" (learned lesson)
- Hermes: backend + integration + deploy
- Before merge: `tsc --noEmit` clean + `jest --runInBand` green (via SSH tunnel to VPS DB)
- Deploy: `git pull && docker compose -p smartecommerce-deploy up -d --build` on VPS

## Cost-Cut Decisions (locked)

1. OTP = WhatsApp Baileys bridge (free) — no SMS provider
2. GSTIN = format + checksum (free) — no Signzy/Vernacular
3. Email = SendGrid free tier (100/day)
4. Shiprocket sandbox free in dev; pay per live parcel
5. Razorpay: pay ~2%/txn only at live
