import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _request: NextRequest,
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

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
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

    if (!order) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Customer can only see their own orders. Admin can see any.
    if (user.role !== "ADMIN" && order.userId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return Response.json(JSON.parse(JSON.stringify(order)), { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
