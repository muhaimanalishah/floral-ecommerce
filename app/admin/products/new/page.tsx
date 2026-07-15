import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminHeader } from "@/components/admin/admin-header"
import { ProductForm } from "@/components/admin/product-form"

export default function NewProduct() {
  return (
    <>
      <AdminHeader title="New Product" />
      <div className="space-y-4">
        <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}>
          <ArrowLeftIcon className="size-4 mr-1" />
          Back to Products
        </Link>
        <ProductForm hideHeader />
      </div>
    </>
  )
}
