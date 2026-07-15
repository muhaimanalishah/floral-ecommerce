# FloraFetch

A full-stack e-commerce platform for buying and selling plants and plant accessories. Customers pay on delivery after inspecting plant health at their doorstep.

Built with Next.js 16, React 19, Tailwind CSS v4, shadcn/ui, and Prisma with PostgreSQL.

## Features

### Storefront
- Product catalog with botanical metadata (sunlight, watering, soil, growth rate, pet-friendliness)
- Category-based browsing
- Shopping cart (one product per row, quantity managed server-side)
- Checkout with address selection
- Order tracking with status timeline (Confirmed > Quality Check > In Transit > Delivered)
- Product reviews with ratings, health ratings, and admin replies
- Cash on delivery only

### Admin Panel
- Dashboard with revenue and order stats
- Product CRUD with drag-and-drop image sorting
- Category management
- Order management with status updates
- User management (activate/suspend)
- Review moderation (approve/reject, reply)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, shadcn/ui |
| Database | PostgreSQL via Prisma ORM v7 |
| Auth | NextAuth.js v5 (credentials, JWT sessions) |
| Forms | react-hook-form + zod |
| Charts | recharts |
| Tables | @tanstack/react-table |
| Drag & drop | @dnd-kit |
| Icons | lucide-react |
| Toasts | sonner |
| Theme | next-themes |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in your values:

```bash
cp .example.env .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Secret for JWT encryption (generate with `openssl rand -hex 32`) |

3. Set up the database:

```bash
npx prisma migrate dev
```

4. (Optional) Seed the database with sample data:

```bash
npx prisma db seed
```

5. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@florafetch.com | admin123 |
| Customer | alice@example.com | password123 |

## Project Structure

```
app/
├── (storefront)/   # Public pages (shop, cart, checkout, etc.)
├── admin/          # Admin panel routes
└── auth/           # Login and signup
components/
├── admin/          # Admin-specific components
├── store/          # Storefront components
└── ui/             # shadcn/ui primitives
lib/
├── validators/     # Zod schemas
├── prisma.ts       # Prisma client (driver adapter)
└── auth-helpers.ts # Auth utilities
prisma/
└── schema.prisma   # Database schema
```

## Environment Variables

See `.example.env` for all required variables.
