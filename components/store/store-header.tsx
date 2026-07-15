"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCartIcon, LeafIcon, UserIcon, LogOutIcon, LayoutDashboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

interface StoreHeaderProps {
  user: {
    id: string
    fullName: string
    email: string
    role: string
  } | null
}

export function StoreHeader({ user }: StoreHeaderProps) {
  const pathname = usePathname()
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetch("/api/cart")
        .then((res) => {
          if (res.ok) return res.json()
          return null
        })
        .then((data) => {
          if (data && data.items) {
            const count = data.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
            setCartCount(count)
          }
        })
        .catch(() => {})
    }
  }, [user, pathname])

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" })
      if (res.ok) {
        toast.success("Logged out successfully!")
        window.location.href = "/"
      }
    } catch {
      toast.error("Failed to log out")
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-foreground hover:opacity-90 transition-opacity">
          <LeafIcon className="size-5 text-primary fill-primary/10" />
          <span className="font-bold tracking-tight text-primary">FloraFetch</span>
        </Link>

        {/* Right side aligned links and controls */}
        <div className="flex items-center gap-8">
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/shop"
              className={pathname.startsWith("/shop") ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}
            >
              Shop Plants
            </Link>
            {user && (
              <Link
                href="/profile"
                className={pathname === "/profile" ? "text-primary" : "text-muted-foreground hover:text-foreground transition-colors"}
              >
                My Orders
              </Link>
            )}
          </nav>

          {/* Cart & Profile Controls */}
          <div className="flex items-center gap-4">
          {/* Cart Icon */}
          <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
            <ShoppingCartIcon className="size-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Controls */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-muted border flex items-center justify-center p-0 cursor-pointer">
                    <UserIcon className="size-4 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.fullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                {user.role === "ADMIN" && (
                  <>
                    <DropdownMenuItem className="cursor-pointer" render={<Link href="/admin" className="w-full flex items-center gap-2" />}>
                      <LayoutDashboardIcon className="size-4" />
                      Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem className="cursor-pointer" render={<Link href="/profile" className="w-full flex items-center gap-2" />}>
                  <UserIcon className="size-4" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:bg-destructive/10">
                  <LogOutIcon className="size-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-sm font-medium" render={<Link href="/auth/login" />}>
                Sign In
              </Button>
              <Button size="sm" className="text-sm font-medium cursor-pointer" render={<Link href="/auth/signup" />}>
                Sign Up
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </header>
  )
}
