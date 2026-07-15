import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Prisma } from "@/generated/client";
import { UpdateOrderStatusSchema } from "@/lib/validators/admin";

const STATUS_ORDER = ["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
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
    const isAdvance = newIndex === currentIndex + 1;
    const isRevert = newIndex === currentIndex - 1;
    if (!isAdvance && !isRevert) {
      return Response.json(
        { error: "Invalid status transition — can only move one step forward or back" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.order.update({
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

      return tx.order.findUnique({
        where: { id },
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          address: true,
          items: {
            include: {
              product: {
                include: { images: { where: { isPrimary: true }, take: 1 } },
              },
            },
          },
          statusHistory: { orderBy: { changedAt: "asc" } },
        },
      });
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
