import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@/generated/client";
import { UpdateOrderStatusSchema } from "@/lib/validators/admin";

const STATUS_ORDER = ["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = UpdateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const currentIndex = STATUS_ORDER.indexOf(order.status);
    const newIndex = STATUS_ORDER.indexOf(parsed.data.status);
    if (newIndex !== currentIndex + 1) {
      return Response.json(
        { error: "Invalid status transition" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id },
        data: { status: parsed.data.status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: parsed.data.status,
          note: parsed.data.note ?? null,
        },
      });

      return result;
    });

    return Response.json(JSON.parse(JSON.stringify(updated)), { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
