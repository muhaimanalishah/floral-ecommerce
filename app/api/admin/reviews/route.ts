import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? "pending";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const where =
      status === "pending"
        ? { isApproved: false }
        : status === "approved"
          ? { isApproved: true }
          : {};

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return Response.json(
      { data: reviews, pagination: { page, limit, total } },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
