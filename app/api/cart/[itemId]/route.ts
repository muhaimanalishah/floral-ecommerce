import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@/generated/client";
import { UpdateCartItemSchema } from "@/lib/validators/cart";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
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

    const { itemId } = await params;

    // Verify ownership
    const existing = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    // Check stock
    const product = await prisma.product.findUnique({
      where: { id: existing.productId },
    });
    if (product && product.stockQty < parsed.data.quantity) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const item = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parsed.data.quantity },
    });

    return Response.json(item, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
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

    const { itemId } = await params;

    // Verify ownership
    const existing = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!existing || existing.userId !== user.id) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
