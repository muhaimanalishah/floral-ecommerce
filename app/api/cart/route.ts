import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { AddToCartSchema } from "@/lib/validators/cart";

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

    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    const total = items.reduce(
      (sum, item) => sum + item.product.price.toNumber() * item.quantity,
      0,
    );

    return Response.json(JSON.parse(JSON.stringify({ items, total })), { status: 200 });
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
    const parsed = AddToCartSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const { productId, quantity } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    // Check stock against total (existing + new)
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });
    const newQty = (existing?.quantity ?? 0) + quantity;
    if (product.stockQty < newQty) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId, quantity },
      update: { quantity: { increment: quantity } },
    });

    // Return updated cart
    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { images: { where: { isPrimary: true }, take: 1 } },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    const total = items.reduce(
      (sum, item) => sum + item.product.price.toNumber() * item.quantity,
      0,
    );

    return Response.json(JSON.parse(JSON.stringify({ items, total })), { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
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

    await prisma.cartItem.deleteMany({ where: { userId: user.id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
