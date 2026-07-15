import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminHeader } from "@/components/admin/admin-header"
import { ProductForm } from "@/components/admin/product-form"

async function getProduct(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/products/${id}`, {
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProduct({ params }: PageProps) {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return (
      <>
        <AdminHeader title="Edit Product" />
        <div>
          <p className="text-sm text-destructive">Product not found.</p>
          <Link href="/admin/products" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Back to Products
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title={`Edit: ${product.name}`} />
      <div className="space-y-4">
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}>
          <ArrowLeftIcon className="size-4 mr-1" />
          Back to Products
        </Link>
        <ProductForm product={product} hideHeader />
      </div>
    </>
  )
}
