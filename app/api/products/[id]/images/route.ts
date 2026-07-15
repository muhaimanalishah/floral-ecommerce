import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { AddImageSchema } from "@/lib/validators/product";

export async function POST(
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
    const parsed = AddImageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const { url, isPrimary, sortOrder } = parsed.data;

    const image = await prisma.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.productImage.updateMany({
          where: { productId: id, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.productImage.create({
        data: { productId: id, url, isPrimary, sortOrder },
      });
    });

    return Response.json(image, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
