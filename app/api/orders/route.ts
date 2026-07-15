import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { PlaceOrderSchema } from "@/lib/validators/order";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: data.claims.sub },
    });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

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

    return Response.json(JSON.parse(JSON.stringify({ data: orders })), { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { supabaseUserId: data.claims.sub },
    });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = PlaceOrderSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const { addressId, deliveryDate, specialInstructions } = parsed.data;

    const order = await prisma.$transaction(async (tx) => {
      // 1. Verify address belongs to current user
      const address = await tx.address.findUnique({ where: { id: addressId } });
      if (!address || address.userId !== user.id) {
        throw new Error("ADDRESS_NOT_FOUND");
      }

      // 2. Fetch cart items with products
      const cartItems = await tx.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });

      // 3. Check cart is not empty
      if (cartItems.length === 0) {
        throw new Error("CART_EMPTY");
      }

      // 4. Verify all products are active and have sufficient stock
      for (const item of cartItems) {
        if (!item.product.isActive) {
          throw new Error(`PRODUCT_INACTIVE:${item.productId}`);
        }
        if (item.product.stockQty < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${item.productId}`);
        }
      }

      // 5. Compute total
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.product.price.toNumber() * item.quantity,
        0,
      );

      // 6-10. Create order, order items, decrement stock, create history, clear cart
      const created = await tx.order.create({
        data: {
          userId: user.id,
          addressId,
          status: "ORDER_CONFIRMED",
          totalAmount,
          deliveryDate: deliveryDate ?? null,
          specialInstructions: specialInstructions ?? null,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
              subtotal: item.product.price.toNumber() * item.quantity,
            })),
          },
          statusHistory: {
            create: { status: "ORDER_CONFIRMED" },
          },
        },
      });

      // Decrement stock
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return created;
    });

    return Response.json(JSON.parse(JSON.stringify(order)), { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ADDRESS_NOT_FOUND") {
        return Response.json({ error: "Address not found" }, { status: 404 });
      }
      if (error.message === "CART_EMPTY") {
        return Response.json({ error: "Cart is empty" }, { status: 400 });
      }
      if (error.message.startsWith("PRODUCT_INACTIVE:")) {
        return Response.json({ error: "Some products are no longer available" }, { status: 400 });
      }
      if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
        return Response.json({ error: "Insufficient stock for some products" }, { status: 400 });
      }
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
