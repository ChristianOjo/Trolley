# Trolley 🛒

Food delivery platform for Eswatini — Mbabane & Manzini MVP.

**Stack:** Next.js 14 · Supabase (Postgres + Auth + Realtime + Storage) · Tailwind CSS · Vercel

---

## Project structure

```
trolley/
├── src/
│   ├── app/
│   │   ├── (customer)/          # Customer-facing routes (browsing, checkout, tracking)
│   │   ├── (restaurant)/        # Restaurant portal (orders, menu management)
│   │   ├── (driver)/            # Driver view (deliveries, mark as delivered)
│   │   ├── (operator)/          # Super admin (onboarding, revenue, zone pricing)
│   │   ├── api/
│   │   │   ├── orders/[id]/status/route.ts   # Order status updates
│   │   │   └── webhooks/payment/route.ts     # Peach Payments webhook
│   │   └── layout.tsx
│   ├── components/              # Shared + portal-specific UI components
│   ├── hooks/
│   │   └── useRealtimeOrders.ts # Supabase Realtime subscription
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts        # Browser client (client components)
│   │   │   └── server.ts        # Server client + service client
│   │   ├── db.ts                # All typed Supabase query functions
│   │   └── sms.ts               # Africa's Talking SMS integration
│   ├── middleware.ts            # Auth + role-based route protection
│   └── types/
│       └── database.types.ts    # TypeScript types (auto-gen in production)
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full DB schema with RLS
├── .env.local.example
└── package.json
```

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-org/trolley.git
cd trolley
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a region close to Eswatini (e.g. `af-south-1` — Cape Town)
3. Note your **Project URL** and **anon key** from Settings → API

### 3. Set environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase URL, anon key, service role key,
Africa's Talking API key, and Peach Payments credentials.

### 4. Run the database migration

```bash
# Option A: Using Supabase CLI (recommended)
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push

# Option B: Paste manually
# Copy supabase/migrations/001_initial_schema.sql into
# Supabase Dashboard → SQL Editor → Run
```

### 5. Enable Realtime

In Supabase Dashboard → Database → Replication, add the `orders` table
to the `supabase_realtime` publication. Or run in SQL editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
```

### 6. Generate TypeScript types (optional but recommended)

```bash
npm run db:types
```

This regenerates `src/types/database.types.ts` to match your live schema.

### 7. Run development server

```bash
npm run dev
```

---

## Authentication & Roles

| Role               | How created             | Can access             |
|--------------------|-------------------------|------------------------|
| `customer`         | Public signup or guest  | `/` customer app       |
| `restaurant_admin` | Operator creates        | `/restaurant`          |
| `driver`           | Operator creates        | `/driver`              |
| `operator`         | Manual DB insert only   | `/operator`            |

### Creating a restaurant admin account

```sql
-- 1. The operator creates the user in Supabase Dashboard → Auth → Users
-- 2. Then set their role:
UPDATE profiles SET role = 'restaurant_admin' WHERE id = '<user-uuid>';

-- 3. Link them to their restaurant:
INSERT INTO restaurant_admins (profile_id, restaurant_id)
VALUES ('<user-uuid>', '<restaurant-uuid>');
```

### Creating a driver account

```sql
UPDATE profiles SET role = 'driver' WHERE id = '<user-uuid>';

INSERT INTO drivers (profile_id, name, phone, zone)
VALUES ('<user-uuid>', 'Sifiso Mthembu', '+26876XXXXXXX', 'Mbabane');
```

### Creating an operator account (founding team only)

```sql
-- Do this directly in Supabase SQL editor — never via the app
UPDATE profiles SET role = 'operator' WHERE id = '<your-uuid>';
```

---

## Key integrations

### Peach Payments (MTN MoMo + Card)

1. Sign up at [peachpayments.com](https://peachpayments.com)
2. Get sandbox credentials → add to `.env.local`
3. Set webhook URL in Peach dashboard to: `https://your-domain.com/api/webhooks/payment`
4. The webhook handler at `src/app/api/webhooks/payment/route.ts` transitions
   the order from `payment_pending` → `placed` and sends the confirmation SMS.

### Africa's Talking (SMS)

1. Sign up at [africastalking.com](https://africastalking.com)
2. Register alphanumeric sender ID `Trolley`
3. Add API key to `.env.local`
4. SMS templates are in `src/lib/sms.ts`

---

## Deployment (Vercel)

```bash
npx vercel --prod
```

Add all `.env.local` variables to Vercel → Project Settings → Environment Variables.

Vercel handles HTTPS, edge CDN, and preview deployments from PRs automatically —
matching the PRD's Vercel deployment target.

---

## Order lifecycle

```
Customer places order
  → status: payment_pending
  → Peach Payments processes payment
  → Webhook: status: placed + SMS to customer
  → Restaurant portal receives realtime update
  → Restaurant accepts: status: confirmed
  → Restaurant starts prep: status: preparing
  → Restaurant marks ready: status: ready_for_pickup
  → Operator assigns driver
  → Driver picks up: status: on_the_way
  → Driver delivers: status: delivered + SMS to customer
```

---

## PRD compliance checklist

| Requirement | Status | Notes |
|---|---|---|
| P0 customer stories (C-01 to C-08) | ✅ Designed | See `trolley-app.jsx` |
| Restaurant portal (R-01 to R-06) | ✅ Designed | See `trolley-restaurant-portal.jsx` |
| Driver view (D-01 to D-04) | ✅ Designed | See `trolley-driver-view.jsx` |
| Operator admin (O-01 to O-05) | ✅ Designed | See `trolley-operator-admin.jsx` |
| Supabase Auth + role-based routing | ✅ Built | `middleware.ts` |
| Database schema + RLS | ✅ Built | `001_initial_schema.sql` |
| Supabase Realtime orders | ✅ Built | `useRealtimeOrders.ts` |
| Peach Payments webhook | ✅ Built | `api/webhooks/payment/route.ts` |
| Africa's Talking SMS | ✅ Built | `lib/sms.ts` |
| item_name_snapshot on OrderItem | ✅ Built | Schema + `db.ts` |
| PII encrypted at rest | ✅ Supabase default | Supabase encrypts at rest |
| HTTPS enforced | ✅ Vercel default | |
| Auth tokens expire 24h | ✅ | Supabase JWT default |
| Order data retained 24 months | ⚠️ Configure | Set in Supabase → Database → Backups |
