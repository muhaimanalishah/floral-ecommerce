import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Prisma } from "@/generated/client";
import { ModerateReviewSchema } from "@/lib/validators/review";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const { id } = await params;

    const body = await request.json();
    const parsed = ModerateReviewSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const review = await prisma.review.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        rating: true,
        healthRating: true,
        reviewText: true,
        plantPhotoUrl: true,
        isApproved: true,
        adminReply: true,
        createdAt: true,
      },
    });

    return Response.json(review, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
