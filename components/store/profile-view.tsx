"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Loader2Icon,
  UserIcon,
  MapPinIcon,
  ShoppingBagIcon,
  Trash2Icon,
  PlusIcon,
  ArrowRightIcon,
  MailIcon,
  CalendarIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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

interface OrderItem {
  id: string
  quantity: number
  product: {
    name: string
  }
}

interface Order {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  items: OrderItem[]
}

interface UserProfile {
  id: string
  fullName: string
  email: string
  phone: string | null
}

export function ProfileView() {
  const router = useRouter()

  // Data states
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Profile Edit states
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [updatingProfile, setUpdatingProfile] = useState(false)

  // Address add form states
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newLabel, setNewLabel] = useState("Home")
  const [newStreet, setNewStreet] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newProvince, setNewProvince] = useState("")
  const [newPostalCode, setNewPostalCode] = useState("")
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  const loadProfileData = async () => {
    try {
      // 1. Fetch Profile
      const profileRes = await fetch("/api/profile")
      if (profileRes.status === 401) {
        toast.error("Please sign in to view your profile")
        router.push("/auth/login?redirectTo=/profile")
        return
      }
      const profileData = await profileRes.json()
      if (profileRes.ok) {
        setProfile(profileData)
        setEditName(profileData.fullName)
        setEditPhone(profileData.phone || "")
      }

      // 2. Fetch Addresses
      const addressRes = await fetch("/api/profile/addresses")
      const addressData = await addressRes.json()
      if (addressRes.ok) {
        setAddresses(addressData.data ?? [])
      }

      // 3. Fetch Orders
      const ordersRes = await fetch("/api/orders")
      const ordersData = await ordersRes.json()
      if (ordersRes.ok) {
        setOrders(ordersData.data ?? [])
      }
    } catch {
      toast.error("Failed to load profile details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfileData()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editName) {
      toast.error("Name is required")
      return
    }

    setUpdatingProfile(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editName,
          phone: editPhone || undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Profile updated successfully!")
        setProfile(data)
      } else {
        toast.error(data.error ?? "Failed to update profile")
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setUpdatingProfile(false)
    }
  }

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

      if (res.ok) {
        toast.success("Address added!")
        // Reset form
        setNewStreet("")
        setNewCity("")
        setNewProvince("")
        setNewPostalCode("")
        setShowAddressForm(false)

        // Reload addresses list
        const reloadRes = await fetch("/api/profile/addresses")
        const reloadData = await reloadRes.json()
        if (reloadRes.ok) {
          setAddresses(reloadData.data ?? [])
        }
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to save address")
      }
    } catch {
      toast.error("Failed to save address")
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/profile/addresses/${addressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      })

      if (res.ok) {
        toast.success("Default address updated!")
        // Reload addresses list
        const reloadRes = await fetch("/api/profile/addresses")
        const reloadData = await reloadRes.json()
        if (reloadRes.ok) {
          setAddresses(reloadData.data ?? [])
        }
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to set default address")
      }
    } catch {
      toast.error("Failed to update address status")
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/profile/addresses/${addressId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success("Address deleted")
        // Reload addresses list
        const reloadRes = await fetch("/api/profile/addresses")
        const reloadData = await reloadRes.json()
        if (reloadRes.ok) {
          setAddresses(reloadData.data ?? [])
        }
      } else {
        const data = await res.json()
        toast.error(data.error ?? "Failed to delete address")
      }
    } catch {
      toast.error("Failed to delete address")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-80 items-center justify-center text-muted-foreground bg-background">
        <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
        Loading profile information...
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-10 flex-1 max-w-5xl bg-[#fafaf9] rounded-2xl border my-12 shadow-sm">
      <div className="flex flex-col gap-1 border-b pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-serif">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage personal details, shipping addresses, and plant history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Profile & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="p-6 border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b font-serif">
              <UserIcon className="size-4 text-primary" />
              Personal Details
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+92 300 1234567"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                  <div className="flex h-9 w-full items-center rounded-md border bg-muted/40 px-3 text-xs text-muted-foreground">
                    <MailIcon className="size-3.5 mr-2 text-muted-foreground/60" />
                    {profile?.email}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">Email cannot be changed. Contact support if needed.</p>
                </div>
              </div>
              <Button type="submit" disabled={updatingProfile} className="cursor-pointer text-xs font-semibold h-9 px-4">
                {updatingProfile ? <Loader2Icon className="size-3.5 animate-spin" /> : "Save Changes"}
              </Button>
            </form>
          </Card>

          {/* Addresses Card */}
          <Card className="p-6 border bg-card shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5 font-serif">
                <MapPinIcon className="size-4 text-primary" />
                Shipping Addresses
              </h3>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-xs h-8 cursor-pointer font-semibold"
              >
                <PlusIcon className="size-3.5 mr-1" /> Add Address
              </Button>
            </div>

            {/* Address Add Form */}
            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="p-5 border rounded-xl bg-zinc-50 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-serif">Add New Address</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="addr-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address Label</Label>
                    <Input id="addr-label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="addr-street" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Street Address</Label>
                    <Input id="addr-street" placeholder="123 Plant Street, Nursery Block" value={newStreet} onChange={(e) => setNewStreet(e.target.value)} required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-city" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</Label>
                    <Input id="addr-city" placeholder="Lahore" value={newCity} onChange={(e) => setNewCity(e.target.value)} required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-province" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Province</Label>
                    <Input id="addr-province" placeholder="Punjab" value={newProvince} onChange={(e) => setNewProvince(e.target.value)} required className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="addr-postal" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Postal Code</Label>
                    <Input id="addr-postal" placeholder="54000" value={newPostalCode} onChange={(e) => setNewPostalCode(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="flex items-center gap-2 self-end h-9">
                    <Checkbox
                      id="addr-default"
                      checked={newIsDefault}
                      onCheckedChange={(checked) => setNewIsDefault(!!checked)}
                    />
                    <Label htmlFor="addr-default" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer">Set as default</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddressForm(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={savingAddress} size="sm" className="cursor-pointer text-xs font-semibold">
                    {savingAddress ? <Loader2Icon className="size-4 animate-spin" /> : "Save Address"}
                  </Button>
                </div>
              </form>
            )}

            {/* Saved Addresses list */}
            {addresses.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-xl p-4 bg-zinc-50 font-semibold uppercase tracking-wider">
                No saved addresses found.
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 border rounded-xl bg-card flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-0.5 rounded">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground pt-1">{addr.street}</p>
                      <p className="text-xs text-muted-foreground">
                        {addr.city}, {addr.province} {addr.postalCode && `- ${addr.postalCode}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!addr.isDefault && (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-xs text-muted-foreground hover:text-foreground cursor-pointer h-8 px-2"
                        >
                          Make Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-muted-foreground hover:text-destructive cursor-pointer hover:bg-destructive/10 h-8 w-8 rounded-lg"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Order History */}
        <div className="space-y-6">
          <Card className="p-6 border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b font-serif">
              <ShoppingBagIcon className="size-4 text-primary" />
              Order History
            </h3>
            {orders.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground border border-dashed rounded-xl p-4 bg-zinc-50 space-y-3 font-semibold uppercase tracking-wider">
                <p>No orders catalogued yet.</p>
                <Button size="xs" className="cursor-pointer" render={<Link href="/shop" />}>
                  Go Shop Plants
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {orders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/orders/${ord.id}`}
                    className="block p-4 border rounded-xl hover:border-primary bg-card hover:bg-zinc-50/50 transition-all space-y-2 group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                        #{ord.id}
                      </span>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-bold py-0.5 uppercase tracking-wider">
                        {ord.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                      <CalendarIcon className="size-3" />
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Grand Total</p>
                        <span className="text-xs font-bold text-foreground">PKR {ord.totalAmount.toLocaleString()}</span>
                      </div>
                      <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5">
                        Track <ArrowRightIcon className="size-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
