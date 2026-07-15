import { getCurrentUser } from "@/lib/auth-helpers"
import { StoreHeader } from "@/components/store/store-header"
import { LeafIcon } from "lucide-react"
import Link from "next/link"

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans antialiased text-foreground">
      <StoreHeader user={user ? { id: user.id, fullName: user.fullName, email: user.email, role: user.role } : null} />
      
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      <footer className="border-t bg-muted/40 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
              <LeafIcon className="size-5 fill-primary/10" />
              <span>FloraFetch</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Centralized marketplace for premium, healthy plant parenting. Hand-inspected nursery specimens delivered directly to your doorstep.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Storefront</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shop Plants
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-muted-foreground hover:text-foreground transition-colors">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Security & Trust</h4>
            <p className="text-sm text-muted-foreground">
              We exclusively support <strong>Cash on Delivery (COD)</strong>. Inspect the foliage and root health of your plant parents upon receipt before making any payment!
            </p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} FloraFetch. All rights reserved. Spring 2026 CS519.
        </div>
      </footer>
    </div>
  )
}
