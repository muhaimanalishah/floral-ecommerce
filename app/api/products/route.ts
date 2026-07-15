import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { Prisma } from "@/generated/client";
import type { GrowthRate } from "@/generated/client";
import { CreateProductSchema } from "@/lib/validators/product";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? "";
    const lowMaintenance = searchParams.get("lowMaintenance");
    const petFriendly = searchParams.get("petFriendly");
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    const growthRate = searchParams.get("growthRate") as GrowthRate | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { botanicalName: { contains: q, mode: "insensitive" } },
        ],
      }),
      ...(category && { categoryId: category }),
      ...(lowMaintenance === "true" && { lowMaintenance: true }),
      ...(petFriendly === "true" && { petFriendly: true }),
      ...(growthRate && { growthRate }),
      ...((priceMin || priceMax) && {
        price: {
          ...(priceMin && { gte: parseFloat(priceMin) }),
          ...(priceMax && { lte: parseFloat(priceMax) }),
        },
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const data = products.map((p) => ({
      ...p,
      price: p.price.toNumber(),
    }));

    return Response.json(
      { data, pagination: { page, limit, total } },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = CreateProductSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 },
      );
    }

    const product = await prisma.product.create({ data: parsed.data });
    return Response.json(
      { ...product, price: product.price.toNumber() },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
