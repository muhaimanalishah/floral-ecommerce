import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@/generated/client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> },
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

    const { id, imageId } = await params;

    await prisma.productImage.delete({
      where: { id: imageId, productId: id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
