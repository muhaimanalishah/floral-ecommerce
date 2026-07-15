import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@/generated/client";
import { ModerateReviewSchema } from "@/lib/validators/review";

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
