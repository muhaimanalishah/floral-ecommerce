import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

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
    if (user.role !== "ADMIN") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalOrders, totalRevenue, activeUsers, lowStockProducts, pendingReviews, confirmed, qualityCheck, inTransit, delivered] =
      await prisma.$transaction([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.user.count({ where: { isActive: true, role: "CUSTOMER" } }),
        prisma.product.findMany({
          where: { stockQty: { lte: 5 }, isActive: true },
          select: { id: true, name: true, stockQty: true },
        }),
        prisma.review.count({ where: { isApproved: false } }),
        prisma.order.count({ where: { status: "ORDER_CONFIRMED" } }),
        prisma.order.count({ where: { status: "QUALITY_CHECK" } }),
        prisma.order.count({ where: { status: "IN_TRANSIT" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
      ]);

    const ordersByStatus = {
      ORDER_CONFIRMED: confirmed,
      QUALITY_CHECK: qualityCheck,
      IN_TRANSIT: inTransit,
      DELIVERED: delivered,
    };

    return Response.json(
      {
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() ?? 0,
        activeUsers,
        pendingReviews,
        lowStockProducts,
        ordersByStatus,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
