# FloraFetch — API Route Specification

This file is a complete implementation guide for all Next.js API route handlers.
Read every section carefully before writing any code.

---

## Stack & Versions (do not deviate)

- **Next.js**: 16.2.10 — API routes live in `app/api/**/route.ts` (App Router)
- **Prisma**: 7.8.0 — client imported from `@/generated/client` via `@/lib/prisma`
- **Zod**: 4.4.3 — use `z.object({...}).safeParse()`. Use `error.issues` (NOT `error.flatten()` or `error.format()` — both are deprecated in v4)
- **Supabase**: `@supabase/ssr` ^0.12.3 — use `createClient()` from `@/utils/supabase/server` to get the current user
- **TypeScript**: strict mode

---

## File Naming Convention

Next.js 16 App Router: every API route is a file named `route.ts` inside `app/api/`.

```
app/api/
  products/
    route.ts                        ← GET (list), POST (create)
    [id]/
      route.ts                      ← GET, PUT, DELETE
      images/
        route.ts                    ← POST (upload)
        [imageId]/
          route.ts                  ← DELETE
  categories/
    route.ts                        ← GET, POST
    [id]/
      route.ts                      ← PUT, DELETE
  cart/
    route.ts                        ← GET, POST (add item), DELETE (clear)
    [itemId]/
      route.ts                      ← PUT (update qty), DELETE (remove item)
  orders/
    route.ts                        ← GET (my orders), POST (place order)
    [id]/
      route.ts                      ← GET (order detail + history)
  products/
    [id]/
      reviews/
        route.ts                    ← GET (approved reviews), POST (create review)
  admin/
    dashboard/
      route.ts                      ← GET (stats)
    orders/
      route.ts                      ← GET (all orders)
      [id]/
        status/
          route.ts                  ← PUT (advance status + note)
    reviews/
      route.ts                      ← GET (all reviews)
      [id]/
        route.ts                    ← PUT (approve/reject/reply)
    users/
      route.ts                      ← GET (all users)
      [id]/
        status/
          route.ts                  ← PUT (activate/deactivate)
```

---

## Shared Patterns — Read This First

### 1. Getting the current user (auth check)

Every protected route must do this at the top:

```ts
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

const supabase = await createClient();
const { data } = await supabase.auth.getClaims();
if (!data?.claims) {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

// Get our internal User record from supabaseUserId
const user = await prisma.user.findUnique({
  where: { supabaseUserId: data.claims.sub },
});
if (!user) {
  return Response.json({ error: "User not found" }, { status: 404 });
}
```

### 2. Admin-only check

After getting `user` (see above):

```ts
if (user.role !== "ADMIN") {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

### 3. Parsing request body with Zod v4

```ts
const body = await request.json();
const parsed = MySchema.safeParse(body);
if (!parsed.success) {
  return Response.json(
    { error: "Validation failed", issues: parsed.error.issues },
    { status: 422 }
  );
}
const data = parsed.data;
```

### 4. Standard response shape

Always return JSON. Use these status codes:
- `200` — success (GET, PUT)
- `201` — created (POST)
- `204` — deleted (DELETE, no body)
- `400` — bad request
- `401` — not authenticated
- `403` — authenticated but not authorized
- `404` — not found
- `422` — validation error
- `500` — unexpected server error (wrap in try/catch)

### 5. Route handler signature (Next.js 16 App Router)

```ts
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // params is a Promise in Next.js 16
  // ...
}
```

**Important**: In Next.js 16, `params` is a `Promise` — always `await params` before using it.

### 6. Query params

```ts
const { searchParams } = new URL(request.url);
const q = searchParams.get("q") ?? "";
const page = parseInt(searchParams.get("page") ?? "1");
const limit = parseInt(searchParams.get("limit") ?? "20");
const skip = (page - 1) * limit;
```

### 7. Prisma Decimal serialization

Prisma `Decimal` fields (price, totalAmount, unitPrice, subtotal) do not serialize to JSON automatically. Convert them:

```ts
// When returning a product:
{ ...product, price: product.price.toNumber() }

// Or use a helper:
function serializeDecimal<T extends Record<string, unknown>>(obj: T) {
  return JSON.parse(JSON.stringify(obj));
}
```

---

## Endpoints

---

### PRODUCTS

---

#### `GET /api/products`

**File**: `app/api/products/route.ts`
**Auth**: Public (no auth required)
**Description**: List products with optional search and filters. Supports pagination.

**Query params**:
| Param | Type | Description |
|---|---|---|
| `q` | string | Search by name or botanicalName (case-insensitive) |
| `category` | string | Filter by category id |
| `lowMaintenance` | `"true"` | Filter boolean |
| `petFriendly` | `"true"` | Filter boolean |
| `priceMin` | number string | Min price |
| `priceMax` | number string | Max price |
| `growthRate` | `"SLOW"` \| `"FAST"` | Enum filter |
| `page` | number string | Default `1` |
| `limit` | number string | Default `20`, max `100` |

**Prisma query**:
```ts
const products = await prisma.product.findMany({
  where: {
    isActive: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { botanicalName: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && { categoryId: category }),
    ...(lowMaintenance === "true" && { lowMaintenance: true }),
    ...(petFriendly === "true" && { petFriendly: true }),
    ...(growthRate && { growthRate: growthRate as GrowthRate }),
    ...(priceMin || priceMax
      ? {
          price: {
            ...(priceMin && { gte: parseFloat(priceMin) }),
            ...(priceMax && { lte: parseFloat(priceMax) }),
          },
        }
      : {}),
  },
  include: {
    category: true,
    images: { where: { isPrimary: true }, take: 1 },
  },
  skip,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Monstera Deliciosa",
      "slug": "monstera-deliciosa",
      "botanicalName": "Monstera deliciosa",
      "productType": "PLANT",
      "price": 24.99,
      "size": "MEDIUM",
      "lowMaintenance": true,
      "petFriendly": false,
      "growthRate": "FAST",
      "stockQty": 10,
      "isActive": true,
      "category": { "id": "uuid", "name": "Indoor" },
      "images": [{ "id": "uuid", "url": "https://...", "isPrimary": true }]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

---

#### `POST /api/products`

**File**: `app/api/products/route.ts`
**Auth**: Admin only
**Description**: Create a new product listing.

**Request body**:
```json
{
  "categoryId": "uuid",
  "name": "Monstera Deliciosa",
  "slug": "monstera-deliciosa",
  "botanicalName": "Monstera deliciosa",
  "productType": "PLANT",
  "price": 24.99,
  "size": "MEDIUM",
  "sunlightReq": "Bright indirect light",
  "wateringFreq": "Once a week",
  "soilType": "Well-draining potting mix",
  "temperatureRange": "18-27°C",
  "lowMaintenance": true,
  "petFriendly": false,
  "growthRate": "FAST",
  "stockQty": 10,
  "description": "A beautiful tropical plant."
}
```

**Zod schema**:
```ts
const CreateProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  botanicalName: z.string().optional(),
  productType: z.enum(["PLANT", "ACCESSORY"]).default("PLANT"),
  price: z.number().positive(),
  size: z.enum(["SMALL", "MEDIUM", "LARGE"]).optional(),
  sunlightReq: z.string().optional(),
  wateringFreq: z.string().optional(),
  soilType: z.string().optional(),
  temperatureRange: z.string().optional(),
  lowMaintenance: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  growthRate: z.enum(["SLOW", "FAST"]).optional(),
  stockQty: z.number().int().min(0).default(0),
  description: z.string().optional(),
});
```

**Response `201`**: The created product object (same shape as GET single product below).

---

#### `GET /api/products/[id]`

**File**: `app/api/products/[id]/route.ts`
**Auth**: Public
**Description**: Get a single product by id. Include all images, category, and reviews summary.

**Prisma query**:
```ts
const product = await prisma.product.findUnique({
  where: { id },
  include: {
    category: true,
    images: { orderBy: { sortOrder: "asc" } },
    reviews: {
      where: { isApproved: true },
      select: { rating: true, healthRating: true },
    },
  },
});
if (!product) return Response.json({ error: "Not found" }, { status: 404 });
```

**Response `200`**:
```json
{
  "id": "uuid",
  "name": "Monstera Deliciosa",
  "slug": "monstera-deliciosa",
  "botanicalName": "Monstera deliciosa",
  "productType": "PLANT",
  "price": 24.99,
  "size": "MEDIUM",
  "sunlightReq": "Bright indirect light",
  "wateringFreq": "Once a week",
  "soilType": "Well-draining potting mix",
  "temperatureRange": "18-27°C",
  "lowMaintenance": true,
  "petFriendly": false,
  "growthRate": "FAST",
  "stockQty": 10,
  "description": "A beautiful tropical plant.",
  "isActive": true,
  "category": { "id": "uuid", "name": "Indoor" },
  "images": [
    { "id": "uuid", "url": "https://...", "isPrimary": true, "sortOrder": 0 }
  ],
  "reviewsSummary": {
    "count": 12,
    "avgRating": 4.5,
    "avgHealthRating": 4.2
  }
}
```

Note: compute `reviewsSummary` from the included reviews array before returning — don't return the raw reviews array here.

---

#### `PUT /api/products/[id]`

**File**: `app/api/products/[id]/route.ts`
**Auth**: Admin only
**Description**: Update a product. All fields optional (partial update).

**Zod schema**: Same as `CreateProductSchema` but wrap in `z.partial()`:
```ts
const UpdateProductSchema = CreateProductSchema.partial();
```

**Response `200`**: Updated product object.

---

#### `DELETE /api/products/[id]`

**File**: `app/api/products/[id]/route.ts`
**Auth**: Admin only
**Description**: Soft-delete a product by setting `isActive: false`. Do NOT hard delete — orders may reference it.

```ts
await prisma.product.update({
  where: { id },
  data: { isActive: false },
});
```

**Response `204`**: No body.

---

#### `POST /api/products/[id]/images`

**File**: `app/api/products/[id]/images/route.ts`
**Auth**: Admin only
**Description**: Add an image URL to a product. Images are stored as URLs (assumed already uploaded to storage externally).

**Request body**:
```json
{
  "url": "https://your-storage.com/image.jpg",
  "isPrimary": false,
  "sortOrder": 1
}
```

**Zod schema**:
```ts
const AddImageSchema = z.object({
  url: z.url(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});
```

If `isPrimary: true`, first set all other images for this product to `isPrimary: false` in a transaction.

**Response `201`**: Created `ProductImage` object.

---

#### `DELETE /api/products/[id]/images/[imageId]`

**File**: `app/api/products/[id]/images/[imageId]/route.ts`
**Auth**: Admin only
**Description**: Delete a product image.

**Response `204`**: No body.

---

### CATEGORIES

---

#### `GET /api/categories`

**File**: `app/api/categories/route.ts`
**Auth**: Public
**Description**: List all categories with product count.

**Prisma query**:
```ts
const categories = await prisma.category.findMany({
  include: { _count: { select: { products: true } } },
  orderBy: { name: "asc" },
});
```

**Response `200`**:
```json
{
  "data": [
    { "id": "uuid", "name": "Indoor", "description": "...", "_count": { "products": 12 } }
  ]
}
```

---

#### `POST /api/categories`

**File**: `app/api/categories/route.ts`
**Auth**: Admin only

**Request body**:
```json
{ "name": "Indoor", "description": "Plants for indoors" }
```

**Zod schema**:
```ts
const CategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
```

**Response `201`**: Created category object.

---

#### `PUT /api/categories/[id]`

**File**: `app/api/categories/[id]/route.ts`
**Auth**: Admin only

**Request body**: Same as POST, all fields optional.

**Response `200`**: Updated category object.

---

#### `DELETE /api/categories/[id]`

**File**: `app/api/categories/[id]/route.ts`
**Auth**: Admin only
**Warning**: Check for products in this category first. If any exist, return `400` with message `"Cannot delete category with existing products"`.

**Response `204`**: No body.

---

### CART

---

#### `GET /api/cart`

**File**: `app/api/cart/route.ts`
**Auth**: Required (customer)
**Description**: Get the current user's cart with product details.

**Prisma query**:
```ts
const cartItems = await prisma.cartItem.findMany({
  where: { userId: user.id },
  include: {
    product: {
      include: { images: { where: { isPrimary: true }, take: 1 } },
    },
  },
  orderBy: { addedAt: "desc" },
});
```

**Response `200`**:
```json
{
  "items": [
    {
      "id": "uuid",
      "quantity": 2,
      "addedAt": "2026-07-15T00:00:00.000Z",
      "product": {
        "id": "uuid",
        "name": "Monstera",
        "slug": "monstera",
        "price": 24.99,
        "stockQty": 10,
        "images": [{ "url": "https://..." }]
      }
    }
  ],
  "total": 49.98
}
```

Compute `total` server-side by summing `item.quantity * item.product.price`.

---

#### `POST /api/cart`

**File**: `app/api/cart/route.ts`
**Auth**: Required (customer)
**Description**: Add a product to cart. If the product is already in cart, increment quantity instead.

**Request body**:
```json
{ "productId": "uuid", "quantity": 1 }
```

**Zod schema**:
```ts
const AddToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
});
```

Before inserting, verify the product exists, is active, and has sufficient stock.

Use `upsert`:
```ts
await prisma.cartItem.upsert({
  where: { userId_productId: { userId: user.id, productId } },
  create: { userId: user.id, productId, quantity },
  update: { quantity: { increment: quantity } },
});
```

**Response `201`**: Updated cart (same shape as GET /api/cart).

---

#### `PUT /api/cart/[itemId]`

**File**: `app/api/cart/[itemId]/route.ts`
**Auth**: Required (customer)
**Description**: Update quantity of a specific cart item. Verify the item belongs to the current user.

**Request body**:
```json
{ "quantity": 3 }
```

**Zod schema**:
```ts
const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
});
```

**Response `200`**: Updated cart item object.

---

#### `DELETE /api/cart/[itemId]`

**File**: `app/api/cart/[itemId]/route.ts`
**Auth**: Required (customer)
**Description**: Remove a single item from cart. Verify item belongs to current user.

**Response `204`**: No body.

---

#### `DELETE /api/cart`

**File**: `app/api/cart/route.ts`
**Auth**: Required (customer)
**Description**: Clear all items from the current user's cart.

```ts
await prisma.cartItem.deleteMany({ where: { userId: user.id } });
```

**Response `204`**: No body.

Note: The same `app/api/cart/route.ts` file handles both `GET`, `POST`, and `DELETE` (clear cart) by exporting multiple named functions.

---

### ORDERS

---

#### `GET /api/orders`

**File**: `app/api/orders/route.ts`
**Auth**: Required (customer)
**Description**: Get the current user's order history, newest first.

**Prisma query**:
```ts
const orders = await prisma.order.findMany({
  where: { userId: user.id },
  include: {
    address: true,
    items: {
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
    },
  },
  orderBy: { createdAt: "desc" },
});
```

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "IN_TRANSIT",
      "totalAmount": 74.97,
      "deliveryDate": "2026-07-20T00:00:00.000Z",
      "createdAt": "2026-07-15T00:00:00.000Z",
      "address": { "label": "Home", "street": "...", "city": "...", "province": "..." },
      "items": [
        {
          "id": "uuid",
          "quantity": 3,
          "unitPrice": 24.99,
          "subtotal": 74.97,
          "product": { "id": "uuid", "name": "Monstera", "images": [{ "url": "https://..." }] }
        }
      ]
    }
  ]
}
```

---

#### `POST /api/orders`

**File**: `app/api/orders/route.ts`
**Auth**: Required (customer)
**Description**: Place a new order from the current cart contents.

**Request body**:
```json
{
  "addressId": "uuid",
  "deliveryDate": "2026-07-20T00:00:00.000Z",
  "specialInstructions": "Please leave at the door"
}
```

**Zod schema**:
```ts
const PlaceOrderSchema = z.object({
  addressId: z.string().min(1),
  deliveryDate: z.iso.datetime().optional(),
  specialInstructions: z.string().optional(),
});
```

**Logic** (all inside a Prisma transaction):
1. Verify `addressId` belongs to the current user.
2. Fetch user's cart items with products.
3. If cart is empty, return `400 "Cart is empty"`.
4. Verify all products are active and have sufficient stock.
5. Compute `totalAmount`.
6. Create `Order` with `status: "ORDER_CONFIRMED"`.
7. Create `OrderItem` rows for each cart item (snapshot `unitPrice` and `subtotal` from current product price).
8. Decrement `stockQty` on each product.
9. Create first `OrderStatusHistory` entry with `status: "ORDER_CONFIRMED"`.
10. Delete all user's cart items.

```ts
const order = await prisma.$transaction(async (tx) => {
  // all steps above using `tx` instead of `prisma`
});
```

**Response `201`**: Full order object (same shape as GET /api/orders/[id]).

---

#### `GET /api/orders/[id]`

**File**: `app/api/orders/[id]/route.ts`
**Auth**: Required. Customer can only see their own orders. Admin can see any.
**Description**: Get full order detail including status history.

**Auth check**:
```ts
if (user.role !== "ADMIN" && order.userId !== user.id) {
  return Response.json({ error: "Forbidden" }, { status: 403 });
}
```

**Prisma query**:
```ts
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    address: true,
    items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } } } },
    statusHistory: { orderBy: { changedAt: "asc" } },
  },
});
```

**Response `200`**: Full order with `statusHistory` array:
```json
{
  "id": "uuid",
  "status": "IN_TRANSIT",
  "totalAmount": 74.97,
  "deliveryDate": "2026-07-20T00:00:00.000Z",
  "specialInstructions": "Please leave at the door",
  "createdAt": "2026-07-15T00:00:00.000Z",
  "address": { "label": "Home", "street": "...", "city": "...", "province": "..." },
  "items": [ "...same as GET /api/orders items..." ],
  "statusHistory": [
    { "id": "uuid", "status": "ORDER_CONFIRMED", "note": null, "changedAt": "2026-07-15T00:00:00.000Z" },
    { "id": "uuid", "status": "QUALITY_CHECK", "note": "Inspected and packed", "changedAt": "2026-07-16T00:00:00.000Z" }
  ]
}
```

---

### REVIEWS

---

#### `GET /api/products/[id]/reviews`

**File**: `app/api/products/[id]/reviews/route.ts`
**Auth**: Public
**Description**: Get approved reviews for a product.

**Query params**: `page`, `limit`, `sort` (`newest` | `rating`)

**Prisma query**:
```ts
const reviews = await prisma.review.findMany({
  where: { productId: id, isApproved: true },
  include: { user: { select: { fullName: true } } },
  orderBy: sort === "rating" ? { rating: "desc" } : { createdAt: "desc" },
  skip,
  take: limit,
});
```

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 5,
      "healthRating": 4,
      "reviewText": "Beautiful plant!",
      "plantPhotoUrl": "https://...",
      "adminReply": "Thank you!",
      "createdAt": "2026-07-15T00:00:00.000Z",
      "user": { "fullName": "Jane Doe" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5 }
}
```

---

#### `POST /api/products/[id]/reviews`

**File**: `app/api/products/[id]/reviews/route.ts`
**Auth**: Required (customer)
**Description**: Submit a review. User must have a delivered order containing this product (verified purchase).

**Verified purchase check**:
```ts
const purchase = await prisma.orderItem.findFirst({
  where: {
    productId: id,
    order: { userId: user.id, status: "DELIVERED" },
  },
});
if (!purchase) {
  return Response.json({ error: "You can only review products you have purchased and received" }, { status: 403 });
}
```

Also check the user hasn't already reviewed this product:
```ts
const existing = await prisma.review.findFirst({
  where: { userId: user.id, productId: id },
});
if (existing) {
  return Response.json({ error: "You have already reviewed this product" }, { status: 409 });
}
```

**Request body**:
```json
{
  "rating": 5,
  "healthRating": 4,
  "reviewText": "Beautiful plant!",
  "plantPhotoUrl": "https://..."
}
```

**Zod schema**:
```ts
const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  healthRating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
  plantPhotoUrl: z.url().optional(),
});
```

New reviews are created with `isApproved: false` — admin must approve before they appear publicly.

**Response `201`**: Created review object (without adminReply).

---

### ADMIN ENDPOINTS

All admin endpoints require `user.role === "ADMIN"`. Return `403` otherwise.

---

#### `GET /api/admin/dashboard`

**File**: `app/api/admin/dashboard/route.ts`
**Auth**: Admin only
**Description**: Aggregate stats for the dashboard.

Use `prisma.$transaction` to run all queries in parallel:
```ts
const [totalOrders, totalRevenue, activeUsers, lowStockProducts, pendingReviews] =
  await prisma.$transaction([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.user.count({ where: { isActive: true, role: "CUSTOMER" } }),
    prisma.product.findMany({ where: { stockQty: { lte: 5 }, isActive: true }, select: { id: true, name: true, stockQty: true } }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);
```

**Response `200`**:
```json
{
  "totalOrders": 120,
  "totalRevenue": 4500.50,
  "activeUsers": 85,
  "pendingReviews": 3,
  "lowStockProducts": [
    { "id": "uuid", "name": "Succulent Mix", "stockQty": 2 }
  ],
  "ordersByStatus": {
    "ORDER_CONFIRMED": 10,
    "QUALITY_CHECK": 5,
    "IN_TRANSIT": 8,
    "DELIVERED": 97
  }
}
```

For `ordersByStatus`, use `prisma.order.groupBy`:
```ts
const statusCounts = await prisma.order.groupBy({
  by: ["status"],
  _count: { status: true },
});
```

---

#### `GET /api/admin/orders`

**File**: `app/api/admin/orders/route.ts`
**Auth**: Admin only
**Description**: List all orders. Filterable by status.

**Query params**: `status` (one of the `OrderStatus` enum values), `page`, `limit`

**Response `200`**: Same shape as customer GET /api/orders but includes all users' orders, plus `user: { fullName, email }` on each order.

---

#### `PUT /api/admin/orders/[id]/status`

**File**: `app/api/admin/orders/[id]/status/route.ts`
**Auth**: Admin only
**Description**: Advance an order's status and optionally add a note. Status must follow the allowed progression.

**Allowed status progression**:
```
ORDER_CONFIRMED → QUALITY_CHECK → IN_TRANSIT → DELIVERED
```

Reject if the new status is not the next step (no skipping, no going back).

**Request body**:
```json
{ "status": "QUALITY_CHECK", "note": "Inspected and packed" }
```

**Zod schema**:
```ts
const UpdateOrderStatusSchema = z.object({
  status: z.enum(["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"]),
  note: z.string().optional(),
});
```

**Logic**:
```ts
const statusOrder = ["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"];
const currentIndex = statusOrder.indexOf(order.status);
const newIndex = statusOrder.indexOf(body.status);
if (newIndex !== currentIndex + 1) {
  return Response.json({ error: "Invalid status transition" }, { status: 400 });
}
```

Use a transaction to update the order status and create a new `OrderStatusHistory` entry simultaneously.

**Response `200`**: Updated order object.

---

#### `GET /api/admin/reviews`

**File**: `app/api/admin/reviews/route.ts`
**Auth**: Admin only
**Description**: List all reviews for moderation.

**Query params**: `status` (`"pending"` | `"approved"` | `"all"`), `page`, `limit`

Map `status` to Prisma where clause:
- `"pending"` → `{ isApproved: false }`
- `"approved"` → `{ isApproved: true }`
- `"all"` → `{}`

Include user and product info:
```ts
include: {
  user: { select: { fullName: true, email: true } },
  product: { select: { name: true, slug: true } },
}
```

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": 4,
      "healthRating": 5,
      "reviewText": "Great plant",
      "plantPhotoUrl": null,
      "isApproved": false,
      "adminReply": null,
      "createdAt": "2026-07-15T00:00:00.000Z",
      "user": { "fullName": "Jane Doe", "email": "jane@example.com" },
      "product": { "name": "Monstera", "slug": "monstera" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 10 }
}
```

---

#### `PUT /api/admin/reviews/[id]`

**File**: `app/api/admin/reviews/[id]/route.ts`
**Auth**: Admin only
**Description**: Approve or reject a review, and/or add/update admin reply.

**Request body** (all optional, send only what you want to change):
```json
{
  "isApproved": true,
  "adminReply": "Thank you for your feedback!"
}
```

**Zod schema**:
```ts
const ModerateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
  adminReply: z.string().optional(),
});
```

**Response `200`**: Updated review object.

---

#### `GET /api/admin/users`

**File**: `app/api/admin/users/route.ts`
**Auth**: Admin only
**Description**: List all users.

**Query params**: `page`, `limit`, `role` (`"CUSTOMER"` | `"ADMIN"`)

```ts
const users = await prisma.user.findMany({
  where: role ? { role: role as UserRole } : {},
  select: {
    id: true,
    fullName: true,
    email: true,
    phone: true,
    role: true,
    isActive: true,
    createdAt: true,
    _count: { select: { orders: true } },
  },
  orderBy: { createdAt: "desc" },
  skip,
  take: limit,
});
```

Never return `supabaseUserId` to the client.

**Response `200`**:
```json
{
  "data": [
    {
      "id": "uuid",
      "fullName": "Jane Doe",
      "email": "jane@example.com",
      "phone": null,
      "role": "CUSTOMER",
      "isActive": true,
      "createdAt": "2026-07-15T00:00:00.000Z",
      "_count": { "orders": 3 }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 85 }
}
```

---

#### `PUT /api/admin/users/[id]/status`

**File**: `app/api/admin/users/[id]/status/route.ts`
**Auth**: Admin only
**Description**: Activate or deactivate a user account. Admin cannot deactivate themselves.

**Request body**:
```json
{ "isActive": false }
```

**Zod schema**:
```ts
const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
```

**Guard**:
```ts
if (targetUser.id === user.id) {
  return Response.json({ error: "Cannot deactivate your own account" }, { status: 400 });
}
```

**Response `200`**: `{ "id": "uuid", "isActive": false }`

---

## User Profile Endpoints

These are needed for the `/profile` page but not strictly admin:

#### `GET /api/profile`
**File**: `app/api/profile/route.ts`
**Auth**: Required
Returns current user's profile: `{ id, fullName, email, phone, role, createdAt }`. Never return `supabaseUserId`.

#### `PUT /api/profile`
**File**: `app/api/profile/route.ts`
**Auth**: Required
Update `fullName` and/or `phone`. Email changes require going through Supabase Auth — do not allow email update here.

**Zod schema**:
```ts
const UpdateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
});
```

#### `GET /api/profile/addresses`
**File**: `app/api/profile/addresses/route.ts`
**Auth**: Required
Returns all addresses for the current user.

#### `POST /api/profile/addresses`
**File**: `app/api/profile/addresses/route.ts`
**Auth**: Required

**Zod schema**:
```ts
const AddressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});
```

If `isDefault: true`, first set all other addresses for this user to `isDefault: false` in a transaction.

#### `PUT /api/profile/addresses/[id]`
**File**: `app/api/profile/addresses/[id]/route.ts`
**Auth**: Required. Verify address belongs to current user.
Same schema as POST, all fields optional.

#### `DELETE /api/profile/addresses/[id]`
**File**: `app/api/profile/addresses/[id]/route.ts`
**Auth**: Required. Verify address belongs to current user.
**Response `204`**: No body.

---

## Error Handling Template

Wrap all route handlers in try/catch:

```ts
export async function GET(request: NextRequest) {
  try {
    // ... your logic
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

---

## Imports Reference

These are the exact import paths to use — do not guess:

```ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

// Prisma enum types (when needed for casting):
import type { GrowthRate, OrderStatus, UserRole } from "@/generated/client";
```

---

## What NOT to do

- Do NOT use `error.flatten()` or `error.format()` — deprecated in Zod v4. Use `error.issues`.
- Do NOT put the Prisma client in a global variable in route files — import from `@/lib/prisma`.
- Do NOT forget to `await params` — it is a Promise in Next.js 16.
- Do NOT return raw Prisma `Decimal` objects — call `.toNumber()` or `JSON.parse(JSON.stringify(...))`.
- Do NOT allow email updates via the profile API — email is owned by Supabase Auth.
- Do NOT hard-delete products — soft delete via `isActive: false`.
- Do NOT return `supabaseUserId` in any response.
- Do NOT skip the ownership check on cart items, addresses, and orders.
