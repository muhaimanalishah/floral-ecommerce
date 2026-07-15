# API Code Quality Fixes & Advice

---

## Fix 1 — Extract shared `where` clause (products/route.ts)

The `where` object is duplicated between `findMany` and `count`. Extract it:

```ts
const where = {
  isActive: true,
  ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { botanicalName: { contains: q, mode: "insensitive" } }] }),
  ...(category && { categoryId: category }),
  ...(lowMaintenance === "true" && { lowMaintenance: true }),
  ...(petFriendly === "true" && { petFriendly: true }),
  ...(growthRate && { growthRate }),
  ...((priceMin || priceMax) && { price: { ...(priceMin && { gte: parseFloat(priceMin) }), ...(priceMax && { lte: parseFloat(priceMax) }) } }),
};

const [products, total] = await Promise.all([
  prisma.product.findMany({ where, include: { ... }, skip, take: limit, orderBy: { createdAt: "desc" } }),
  prisma.product.count({ where }),
]);
```

---

## Fix 2 — Scope image delete to its product (products/[id]/images/[imageId]/route.ts)

Currently deletes by `imageId` alone — any image can be deleted regardless of which product it belongs to. Fix:

```ts
await prisma.productImage.delete({
  where: { id: imageId, productId: id }, // `id` comes from params
});
```

---

## Fix 3 — Handle Prisma P2025 (record not found) as 404 not 500

When `update` or `delete` is called with an id that doesn't exist, Prisma throws error code `P2025`. Catch it in routes that update/delete by id:

```ts
import { Prisma } from "@/generated/client";

} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  console.error(error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

Apply this to: `products/[id]` PUT, `categories/[id]` PUT, `categories/[id]` DELETE, and any future PUT/DELETE by id.

---

## ⚠️ CRITICAL — Move Zod schemas out of route files

Do NOT define Zod schemas inside `app/api/**/route.ts` files. They belong in `lib/validators/` so they can be shared across API routes, server actions, and frontend forms.

**File structure:**
```
lib/validators/
  product.ts      ← CreateProductSchema, UpdateProductSchema
  category.ts     ← CategorySchema, UpdateCategorySchema
  cart.ts         ← AddToCartSchema, UpdateCartItemSchema
  order.ts        ← PlaceOrderSchema
  review.ts       ← CreateReviewSchema, ModerateReviewSchema
  profile.ts      ← UpdateProfileSchema, AddressSchema
  admin.ts        ← UpdateOrderStatusSchema, UpdateUserStatusSchema
```

**In each validator file**, export the schema AND its inferred type:
```ts
// lib/validators/product.ts
import { z } from "zod";

export const CreateProductSchema = z.object({ ... });
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
```

**In route files**, import from the validator:
```ts
import { CreateProductSchema } from "@/lib/validators/product";
```

**In server actions and frontend forms**, import the same schema:
```ts
import { CreateProductSchema, type CreateProductInput } from "@/lib/validators/product";
```

This means all existing route files that have inline schemas need to be refactored to import from `lib/validators/` instead.

---

## Fix 4 — Serialize Decimal fields before returning responses

Prisma `Decimal` fields (`totalAmount`, `unitPrice`, `subtotal`, `price`) do NOT serialize to JSON automatically — they become empty objects `{}`. Always convert before returning.

Affected fields by model:
- `Product` → `price`
- `Order` → `totalAmount`
- `OrderItem` → `unitPrice`, `subtotal`

Use `JSON.parse(JSON.stringify(obj))` for nested objects rather than manually mapping every field:

```ts
return Response.json(JSON.parse(JSON.stringify(order)), { status: 200 });
```

Or for a flat object:
```ts
return Response.json({ ...product, price: product.price.toNumber() }, { status: 200 });
```

Apply to: every route that returns `Order`, `OrderItem`, or `Product` objects — including nested includes.

Known missed cases still needing the fix:
- `app/api/orders/route.ts` — GET response
- `app/api/orders/route.ts` — POST response (created order)
- `app/api/orders/[id]/route.ts` — GET response
- `app/api/admin/orders/route.ts` — GET response
- `app/api/admin/orders/[id]/status/route.ts` — PUT response

---

## General Rules (follow in every new route)

- **Always extract shared `where` clauses** — never duplicate filter logic between `findMany` and `count`.
- **Always scope deletes** — when deleting a nested resource (image, address, cart item), include the parent id in the `where` clause.
- **Always catch P2025** — any route that does `update`/`delete` by id must handle not-found as 404.
- **Never return `supabaseUserId`** — use `select` to exclude it when returning user objects.
- **Always verify ownership** — cart items, addresses, orders: check the resource belongs to the current user before mutating.
