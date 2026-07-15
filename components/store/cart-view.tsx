"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Trash2Icon,
  ShoppingBagIcon,
  ArrowRightIcon,
  Loader2Icon,
  LeafIcon,
  PlusIcon,
  MinusIcon,
  SunIcon,
  DropletIcon,
  ShieldCheckIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface CartItem {
  id: string
  quantity: number
  productId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    stockQty: number
    size: string | null
    images: { url: string }[]
  }
}

export function CartView() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadCart = async () => {
    try {
      const res = await fetch("/api/cart")
      if (res.status === 401) {
        toast.error("Please sign in to view your cart")
        router.push("/auth/login?redirectTo=/cart")
        return
      }
      const data = await res.json()
      if (res.ok) {
        setItems(data.items ?? [])
        setTotal(data.total ?? 0)
      } else {
        toast.error(data.error ?? "Failed to load cart")
      }
    } catch {
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const handleUpdateQty = async (item: CartItem, newQty: number) => {
    if (newQty < 1) return
    if (newQty > item.product.stockQty) {
      toast.error(`Only ${item.product.stockQty} items left in stock`)
      return
    }

    setUpdatingId(item.id)
    try {
      const res = await fetch(`/api/cart/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      })

      if (res.ok) {
        await loadCart()
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to update quantity")
      }
    } catch {
      toast.error("Failed to update quantity")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    setUpdatingId(itemId)
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Removed plant from cart")
        await loadCart()
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to delete item")
      }
    } catch {
      toast.error("Failed to delete item")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-80 items-center justify-center text-muted-foreground bg-[#fafaf9]">
        <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
        Loading your cart...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-6 flex-1 bg-[#fafaf9] max-w-xl rounded-2xl border my-12 shadow-sm">
        <ShoppingBagIcon className="size-16 text-muted-foreground/30" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground font-serif">Your cart is empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You haven't adopted any green plant parents yet. Head over to our catalog to start building your garden!
          </p>
        </div>
        <Button size="lg" className="font-semibold cursor-pointer h-11 px-6 text-sm" render={<Link href="/shop" />}>
          <span className="flex items-center gap-2">
            Start Shopping
            <ArrowRightIcon className="size-4" />
          </span>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-8 flex-1 flex flex-col lg:flex-row gap-10 items-start bg-[#fafaf9]">
      {/* Cart Items List */}
      <div className="flex-1 w-full space-y-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-serif">Shopping Cart</h1>
        <div className="divide-y divide-zinc-200/60 border-y border-zinc-200/60 py-4">
          {items.map((item) => {
            const primaryImg = item.product.images[0]?.url || "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?q=80&w=300&auto=format&fit=crop"
            return (
              <div key={item.id} className="py-6 flex gap-6 items-center first:pt-2 last:pb-2">
                <div className="size-20 rounded-xl overflow-hidden bg-muted shrink-0 border">
                  <img src={primaryImg} alt={item.product.name} className="object-cover w-full h-full" />
                </div>
                <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-base hover:text-primary transition-colors font-serif">
                      <Link href={`/shop/${item.product.slug}`}>{item.product.name}</Link>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold">
                      <span>Size: {item.product.size?.toLowerCase() || "N/A"}</span>
                      <span>•</span>
                      <span>PKR {item.product.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 justify-between md:justify-end">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-lg h-9 overflow-hidden bg-card">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity === 1}
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-muted-foreground disabled:opacity-50 cursor-pointer border-r"
                      >
                        <MinusIcon className="size-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-foreground">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item, item.quantity + 1)}
                        disabled={updatingId === item.id || item.quantity >= item.product.stockQty}
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-muted-foreground disabled:opacity-50 cursor-pointer border-l"
                      >
                        <PlusIcon className="size-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Price subtotal */}
                      <span className="font-bold text-foreground text-sm min-w-[90px] text-right">
                        PKR {(item.product.price * item.quantity).toLocaleString()}
                      </span>
                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={updatingId === item.id}
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer hover:bg-destructive/10 h-8 w-8 rounded-lg"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="w-full lg:w-96 space-y-6 shrink-0">
        <h2 className="text-xl font-bold text-foreground tracking-tight font-serif">Order Summary</h2>
        <Card className="p-6 space-y-6 bg-card shadow-sm border">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between pb-3 border-b text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">PKR {total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pb-3 border-b text-muted-foreground font-medium">
              <span>Delivery Charges</span>
              <span className="font-bold text-emerald-600 uppercase text-xs tracking-wider">Free COD Delivery</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2">
              <span>Total Price</span>
              <span className="font-serif font-black text-lg">PKR {total.toLocaleString()}</span>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-800 space-y-2">
            <p className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <LeafIcon className="size-3.5 fill-emerald-800/10 text-emerald-700" />
              FloraFetch Inspection Standards
            </p>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Pay 100% via Cash on Delivery. Take all the time you need to inspect leaf state and root hydration before handoff.
            </p>
          </div>

          <Button className="w-full h-11 text-sm font-bold cursor-pointer" render={<Link href="/checkout" />}>
            <span className="flex items-center justify-center gap-2">
              Proceed to Checkout
              <ArrowRightIcon className="size-4" />
            </span>
          </Button>
        </Card>

        {/* Botanical Care Guarantee card to fill space */}
        <Card className="p-6 bg-card border shadow-sm space-y-4">
          <h3 className="font-bold text-xs uppercase text-muted-foreground tracking-wider font-serif">Your Plant Care Checklist</h3>
          <div className="space-y-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <SunIcon className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p>Keep your specimens in indirect sunlight unless noted otherwise.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <DropletIcon className="size-4 text-sky-500 shrink-0 mt-0.5" />
              <p>Water only when the top 1-2 inches of soil feels completely dry.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <ShieldCheckIcon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
              <p>Always inspect leaf structure for humidity needs during winter months.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
