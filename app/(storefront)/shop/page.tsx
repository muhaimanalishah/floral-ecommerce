import { ShopCatalog } from "@/components/store/shop-catalog"
import { Suspense } from "react"
import { Loader2Icon } from "lucide-react"

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground bg-background">
          <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
          Loading catalog...
        </div>
      }
    >
      <ShopCatalog />
    </Suspense>
  )
}
