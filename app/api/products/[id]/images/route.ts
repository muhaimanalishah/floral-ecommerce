import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const AddImageSchema = z.object({
  url: z.url(),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export async function POST(
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
