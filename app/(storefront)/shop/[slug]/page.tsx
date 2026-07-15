import { prisma } from "@/lib/prisma"
import { ProductDetails } from "@/components/store/product-details"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: true,
      reviews: {
        include: {
          user: {
            select: { fullName: true }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  })

  if (!product) {
    notFound()
  }

  // Convert Decimal fields to numbers for client-side serialization compatibility
  const serializedProduct = {
    ...product,
    price: product.price.toNumber(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    reviews: product.reviews.map((rev) => ({
      ...rev,
      createdAt: rev.createdAt.toISOString()
    }))
  }

  return <ProductDetails product={serializedProduct} />
}
