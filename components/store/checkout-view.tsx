"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2Icon,
  MapPinIcon,
  PlusIcon,
  CalendarIcon,
  AlertCircleIcon,
  ShoppingBagIcon,
  CheckCircle2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

interface Address {
  id: string
  label: string
  street: string
  city: string
  province: string
  postalCode: string | null
  isDefault: boolean
}

interface CartItem {
  id: string
  quantity: number
  product: {
    name: string
    price: number
    size: string | null
  }
}

export function CheckoutView() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)

  // Loading & states
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)

  // New Address Form State
  const [newLabel, setNewLabel] = useState("Home")
  const [newStreet, setNewStreet] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newProvince, setNewProvince] = useState("")
  const [newPostalCode, setNewPostalCode] = useState("")
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  // Delivery details
  const [deliveryDate, setDeliveryDate] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")

  const loadCheckoutData = async () => {
    try {
      // 1. Fetch Cart
      const cartRes = await fetch("/api/cart")
      if (cartRes.status === 401) {
        toast.error("Please sign in to complete checkout")
        router.push("/auth/login?redirectTo=/checkout")
        return
      }
      const cartData = await cartRes.json()
      if (cartRes.ok) {
        if (!cartData.items || cartData.items.length === 0) {
          toast.error("Your cart is empty. Add plants before checking out!")
          router.push("/shop")
          return
        }
        setCartItems(cartData.items)
        setCartTotal(cartData.total)
      } else {
        toast.error(cartData.error ?? "Failed to load cart items")
      }

      // 2. Fetch Addresses
      const addressRes = await fetch("/api/profile/addresses")
      const addressData = await addressRes.json()
      if (addressRes.ok) {
        const list = addressData.data ?? []
        setAddresses(list)
        // Select default address if exists, otherwise first
        const defaultAddr = list.find((a: Address) => a.isDefault)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id)
        } else if (list.length > 0) {
          setSelectedAddressId(list[0].id)
        }
      }
    } catch {
      toast.error("Failed to load checkout details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCheckoutData()
  }, [])

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStreet || !newCity || !newProvince) {
      toast.error("Please fill in all address fields")
      return
    }

    setSavingAddress(true)
    try {
      const res = await fetch("/api/profile/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newLabel,
          street: newStreet,
          city: newCity,
          province: newProvince,
          postalCode: newPostalCode || undefined,
          isDefault: newIsDefault,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("New address added!")
        setNewStreet("")
        setNewCity("")
        setNewProvince("")
        setNewPostalCode("")
        setShowNewAddressForm(false)

        // Reload addresses list
        const reloadRes = await fetch("/api/profile/addresses")
        const reloadData = await reloadRes.json()
        if (reloadRes.ok) {
          const list = reloadData.data ?? []
          setAddresses(list)
          setSelectedAddressId(data.id)
        }
      } else {
        toast.error(data.error ?? "Failed to save address")
      }
    } catch {
      toast.error("Failed to save address")
    } finally {
      setSavingAddress(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please specify a shipping delivery address")
      return
    }

    setPlacingOrder(true)
    try {
      const isoDeliveryDate = deliveryDate ? new Date(deliveryDate).toISOString() : undefined

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          deliveryDate: isoDeliveryDate,
          specialInstructions: specialInstructions || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success("Order placed successfully!")
        router.push(`/orders/${data.id}`)
      } else {
        toast.error(data.error ?? "Failed to place order")
      }
    } catch {
      toast.error("An error occurred. Failed to place order")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-80 items-center justify-center text-muted-foreground bg-[#fafaf9]">
        <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
        Preparing checkout details...
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-8 flex-1 flex flex-col lg:flex-row gap-10 items-start bg-[#fafaf9] rounded-2xl border my-12 shadow-sm">
      {/* Checkout Configuration Form */}
      <div className="flex-1 w-full space-y-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight font-serif pb-4 border-b">Checkout Details</h1>

        {/* 1. Address Selection */}
        <Card className="p-6 space-y-4 border bg-card shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-bold text-foreground flex items-center gap-1.5 font-serif text-base">
              <MapPinIcon className="size-4 text-primary" />
              Delivery Destination
            </h3>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowNewAddressForm(!showNewAddressForm)}
              className="text-xs h-8 cursor-pointer font-semibold"
            >
              <PlusIcon className="size-3.5 mr-1" /> New Address
            </Button>
          </div>

          {/* New Address Form (Toggleable) */}
          {showNewAddressForm && (
            <form onSubmit={handleSaveAddress} className="p-5 border rounded-xl bg-zinc-50 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-serif">Add Delivery Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address Label</Label>
                  <Input id="label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="street" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Street Address</Label>
                  <Input id="street" placeholder="123 Plant Street, Nursery Block" value={newStreet} onChange={(e) => setNewStreet(e.target.value)} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</Label>
                  <Input id="city" placeholder="Lahore" value={newCity} onChange={(e) => setNewCity(e.target.value)} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="province" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Province</Label>
                  <Input id="province" placeholder="Punjab" value={newProvince} onChange={(e) => setNewProvince(e.target.value)} required className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="postal-code" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Postal Code</Label>
                  <Input id="postal-code" placeholder="54000" value={newPostalCode} onChange={(e) => setNewPostalCode(e.target.value)} className="h-9 text-xs" />
                </div>
                <div className="flex items-center gap-2 self-end h-9">
                  <Checkbox
                    id="is-default"
                    checked={newIsDefault}
                    onCheckedChange={(checked) => setNewIsDefault(!!checked)}
                  />
                  <Label htmlFor="is-default" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">Set as default</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewAddressForm(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={savingAddress} size="sm" className="cursor-pointer text-xs font-semibold">
                  {savingAddress ? <Loader2Icon className="size-4 animate-spin" /> : "Save & Select"}
                </Button>
              </div>
            </form>
          )}

          {/* List of saved addresses */}
          {addresses.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-xl p-4 bg-zinc-50 font-semibold uppercase tracking-wider">
              No saved addresses found. Please add a shipping address above to checkout.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 border rounded-xl cursor-pointer bg-card flex flex-col justify-between gap-3 transition-all ${
                    selectedAddressId === addr.id
                      ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                      : "hover:border-foreground/30 hover:bg-zinc-50/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-0.5 rounded">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">Default</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-foreground pt-1">{addr.street}</p>
                    <p className="text-xs text-muted-foreground">
                      {addr.city}, {addr.province} {addr.postalCode && `- ${addr.postalCode}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 2. Delivery Date & Special Instructions */}
        <Card className="p-6 space-y-4 border bg-card shadow-sm">
          <h3 className="font-bold text-foreground flex items-center gap-1.5 pb-2 border-b font-serif text-base">
            <CalendarIcon className="size-4 text-primary" />
            Handover Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="delivery-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Preferred Date
                <span className="text-[10px] text-muted-foreground font-normal normal-case">(Optional)</span>
              </Label>
              <Input
                id="delivery-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="instructions" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                Courier Instructions
                <span className="text-[10px] text-muted-foreground font-normal normal-case">(Optional)</span>
              </Label>
              <textarea
                id="instructions"
                placeholder="Call before arrival, drop off at guard booth, handle delicate leaves..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full min-h-[70px] p-2.5 rounded-lg border text-xs bg-background placeholder:text-muted-foreground/60 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* 3. Payment Method */}
        <Card className="p-6 space-y-4 border bg-card shadow-sm">
          <h3 className="font-bold text-foreground flex items-center gap-1.5 pb-2 border-b font-serif text-base">
            <CheckCircle2Icon className="size-4 text-primary" />
            Payment Terms
          </h3>
          <div className="p-4 border rounded-xl bg-primary/5 border-primary/20 flex gap-3 items-start">
            <AlertCircleIcon className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-foreground text-sm font-serif">Cash on Delivery (COD) - 100% Secure</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                FloraFetch is dedicated to delivering only healthy nursery plants. You only pay PKR after you inspect leaf health and root hydration upon home receipt. No prepayment options exist for buyer safety.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Sidebar */}
      <div className="w-full lg:w-96 space-y-6 shrink-0">
        <h2 className="text-xl font-bold text-foreground tracking-tight font-serif">Order Summary</h2>
        <Card className="p-6 space-y-6 border bg-card shadow-sm">
          <div className="space-y-3 pb-4 border-b">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShoppingBagIcon className="size-3.5 text-primary" /> Items
            </h4>
            <div className="max-h-[220px] overflow-y-auto divide-y divide-zinc-150 pr-1">
              {cartItems.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between text-xs font-medium first:pt-0 last:pb-0">
                  <div className="truncate max-w-[180px] space-y-0.5">
                    <p className="text-foreground truncate font-serif font-bold">{item.product.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Size: {item.product.size?.toLowerCase() || "N/A"}</p>
                  </div>
                  <span className="text-muted-foreground shrink-0 ml-2 font-semibold">
                    {item.quantity} x PKR {item.product.price.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">PKR {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Delivery Charges</span>
              <span className="font-bold text-emerald-600 uppercase text-xs tracking-wider">Free COD Shipping</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-2.5 border-t">
              <span>Grand Total</span>
              <span className="font-serif font-black text-lg">PKR {cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId}
            className="w-full h-11 text-sm font-bold cursor-pointer"
          >
            {placingOrder ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Placing Order…
              </>
            ) : (
              "Confirm & Place COD Order"
            )}
          </Button>
        </Card>
      </div>
    </div>
  )
}
