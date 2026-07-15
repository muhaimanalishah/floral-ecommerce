import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { CreateReviewSchema } from "@/lib/validators/review";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: id, isApproved: true },
        include: { user: { select: { fullName: true } } },
        orderBy: sort === "rating" ? { rating: "desc" } : { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId: id, isApproved: true } }),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const { id } = await params;

    // Verified purchase check
    const purchase = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: { userId: user.id, status: "DELIVERED" },
      },
    });
    if (!purchase) {
      return Response.json(
        { error: "You can only review products you have purchased and received" },
        { status: 403 },
      );
    }

    // Duplicate review check
    const existing = await prisma.review.findFirst({
      where: { userId: user.id, productId: id },
    });
    if (existing) {
      return Response.json(
        { error: "You have already reviewed this product" },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsed = CreateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: id,
        rating: parsed.data.rating,
        healthRating: parsed.data.healthRating,
        reviewText: parsed.data.reviewText ?? null,
        plantPhotoUrl: parsed.data.plantPhotoUrl ?? null,
        isApproved: false,
      },
    });

    return Response.json(review, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
