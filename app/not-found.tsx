import Link from "next/link"
import { LeafIcon, ArrowLeftIcon } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="space-y-8 max-w-md">
        {/* Decorative leaf */}
        <div className="flex justify-center">
          <div className="relative">
            <LeafIcon className="size-24 text-primary/20 fill-primary/10" strokeWidth={1} />
            <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-primary/40 font-serif">
              404
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-serif">
            Page not found
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Looks like this page wandered off into the wild. It may have been moved, deleted, or never existed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "font-semibold")}>
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Home
          </Link>
          <Link href="/shop" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "font-semibold")}>
            Browse Plants
          </Link>
        </div>
      </div>
    </div>
  )
}
