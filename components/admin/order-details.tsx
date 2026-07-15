"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeftIcon,
  Loader2Icon,
  ClockIcon,
  TruckIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  AlertTriangleIcon,
  PackageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  product: {
    name: string
    botanicalName: string | null
    images: { url: string }[]
  }
}

interface Address {
  label: string
  street: string
  city: string
  province: string
  postalCode: string | null
}

interface StatusHistory {
  id: string
  status: string
  note: string | null
  changedAt: string
}

interface Order {
  id: string
  createdAt: string
  totalAmount: number
  status: "ORDER_CONFIRMED" | "QUALITY_CHECK" | "IN_TRANSIT" | "DELIVERED"
  specialInstructions: string | null
  deliveryDate: string | null
  user: { fullName: string; email: string; phone: string | null } | null
  address: Address
  items: OrderItem[]
  statusHistory?: StatusHistory[]
}

const STATUS_ORDER = ["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"]

const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Confirmed",
  QUALITY_CHECK:   "Quality Check",
  IN_TRANSIT:      "In Transit",
  DELIVERED:       "Delivered",
}

const STATUS_CLASSES: Record<string, string> = {
  ORDER_CONFIRMED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  QUALITY_CHECK:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  IN_TRANSIT:      "bg-primary/10 text-primary border-primary/20",
  DELIVERED:       "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ORDER_CONFIRMED: <ClockIcon className="size-4" />,
  QUALITY_CHECK:   <ClipboardCheckIcon className="size-4" />,
  IN_TRANSIT:      <TruckIcon className="size-4" />,
  DELIVERED:       <CheckCircle2Icon className="size-4" />,
}

const NEXT_BUTTON_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Start Quality Check",
  QUALITY_CHECK:   "Dispatch — Mark In Transit",
  IN_TRANSIT:      "Mark as Delivered",
}

export function OrderDetails({ order: initialOrder }: { order: Order }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order>(initialOrder)
  const [advancementNote, setAdvancementNote] = useState("")
  const [advancing, setAdvancing] = useState(false)

  const currentIndex = STATUS_ORDER.indexOf(order.status)
  const isDelivered = order.status === "DELIVERED"
  const nextStatus = isDelivered ? null : STATUS_ORDER[currentIndex + 1]
  const prevStatus = currentIndex > 0 ? STATUS_ORDER[currentIndex - 1] : null
  const [reverting, setReverting] = useState(false)

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return
    setAdvancing(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, note: advancementNote.trim() || undefined }),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success(`Order advanced to "${STATUS_LABELS[nextStatus]}"`)
        setOrder(updated)
        setAdvancementNote("")
        router.refresh()
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to update order status")
      }
    } catch {
      toast.error("An error occurred while updating order status")
    } finally {
      setAdvancing(false)
    }
  }

  const handleRevertStatus = async () => {
    if (!prevStatus) return
    if (!confirm(`Revert order back to "${STATUS_LABELS[prevStatus]}"?`)) return
    setReverting(true)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: prevStatus, note: "Status reverted by admin." }),
      })
      if (res.ok) {
        const updated = await res.json()
        toast.success(`Order reverted to "${STATUS_LABELS[prevStatus]}"`)
        setOrder(updated)
        router.refresh()
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to revert order status")
      }
    } catch {
      toast.error("An error occurred while reverting order status")
    } finally {
      setReverting(false)
    }
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeftIcon className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">Order Details</h2>
            <Badge variant="outline" className={STATUS_CLASSES[order.status]}>
              {STATUS_ICONS[order.status]}
              <span className="ml-1">{STATUS_LABELS[order.status]}</span>
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {order.id} &middot; Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long", day: "numeric", year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center">
          {STATUS_ORDER.map((status, i) => {
            const isDone = currentIndex >= i
            const isCurrent = currentIndex === i
            return (
              <div key={status} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 transition-colors",
                    isDone
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}>
                    <span className={cn("scale-75", isDone ? "text-primary-foreground" : "text-muted-foreground")}>
                      {STATUS_ICONS[status]}
                    </span>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold text-center leading-tight w-16",
                    isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                {i < STATUS_ORDER.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 mx-1 mb-5 transition-colors",
                    currentIndex > i ? "bg-primary" : "bg-border"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* Left — items + timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order items */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-5 py-3">
              <PackageIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Order Items</h3>
            </div>
            <div className="divide-y">
              {order.items.map((item) => {
                const img = item.product.images[0]?.url
                return (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                    {img ? (
                      <img
                        src={img}
                        alt={item.product.name}
                        className="size-12 rounded-md object-cover border shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-md border bg-muted flex items-center justify-center shrink-0">
                        <PackageIcon className="size-5 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{item.product.name}</p>
                      {item.product.botanicalName && (
                        <p className="text-xs italic text-muted-foreground">{item.product.botanicalName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm text-right shrink-0">
                      <span className="text-muted-foreground">× {item.quantity}</span>
                      <span className="text-muted-foreground w-24">PKR {item.unitPrice.toLocaleString()}</span>
                      <span className="font-semibold text-foreground w-28">PKR {item.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30">
                <span className="text-sm font-semibold text-foreground">Grand Total</span>
                <span className="font-bold text-foreground">PKR {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center gap-2 border-b px-5 py-3">
                <ClockIcon className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Status Timeline</h3>
              </div>
              <div className="px-5 py-4">
                <div className="relative pl-6 border-l-2 border-border space-y-5">
                  {order.statusHistory.map((h, i) => (
                    <div key={h.id} className="relative">
                      <span className={cn(
                        "absolute -left-[27px] top-0.5 flex size-6 items-center justify-center rounded-full border bg-background",
                        i === order.statusHistory!.length - 1 ? "border-primary text-primary" : "border-border text-muted-foreground"
                      )}>
                        <span className="scale-75">{STATUS_ICONS[h.status]}</span>
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-foreground">{STATUS_LABELS[h.status]}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.changedAt).toLocaleString("en-US", {
                            month: "short", day: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">
                          &ldquo;{h.note}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — customer, delivery, action */}
        <div className="space-y-4">

          {/* Customer */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <UserIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Customer</h3>
            </div>
            <div className="px-4 py-3 space-y-0.5">
              {order.user ? (
                <>
                  <p className="font-semibold text-foreground">{order.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{order.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.user.phone ?? <span className="italic text-muted-foreground/60">No phone</span>}
                  </p>
                </>
              ) : (
                <p className="text-sm italic text-muted-foreground/60">Customer account deleted</p>
              )}
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <MapPinIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Delivery</h3>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">Address</p>
                <Badge variant="outline" className="mb-1 text-xs">{order.address.label}</Badge>
                <p className="text-sm text-foreground">{order.address.street}</p>
                <p className="text-sm text-muted-foreground">
                  {order.address.city}, {order.address.province}
                  {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
                </p>
              </div>

              {order.deliveryDate && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <CalendarIcon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Preferred Date</p>
                    <p className="text-sm text-foreground">
                      {new Date(order.deliveryDate).toLocaleDateString("en-US", {
                        weekday: "short", month: "long", day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {order.specialInstructions && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 p-3 pt-2 border-t-0">
                  <AlertTriangleIcon className="size-3.5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-600 mb-0.5">Special Instructions</p>
                    <p className="text-xs text-amber-800 italic">&ldquo;{order.specialInstructions}&rdquo;</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advance action */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <TruckIcon className="size-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Fulfillment</h3>
            </div>
            <div className="px-4 py-4">
              {isDelivered ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2Icon className="size-4 shrink-0" />
                    <p className="text-sm font-medium">Order delivered — complete.</p>
                  </div>
                  {prevStatus && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRevertStatus}
                      disabled={reverting}
                      className="w-full text-muted-foreground"
                    >
                      {reverting
                        ? <><Loader2Icon className="mr-2 size-3.5 animate-spin" />Reverting…</>
                        : `↩ Revert to ${STATUS_LABELS[prevStatus]}`}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Next step:{" "}
                    <span className="font-semibold text-foreground">{STATUS_LABELS[nextStatus!]}</span>
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="adv-note" className="text-xs">Note <span className="text-muted-foreground">(optional)</span></Label>
                    <Textarea
                      id="adv-note"
                      rows={2}
                      value={advancementNote}
                      onChange={(e) => setAdvancementNote(e.target.value)}
                      placeholder="e.g. Plant watered and securely packed."
                      className="text-sm resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className="w-full"
                  >
                    {advancing ? (
                      <><Loader2Icon className="mr-2 size-4 animate-spin" />Updating…</>
                    ) : (
                      NEXT_BUTTON_LABELS[order.status]
                    )}
                  </Button>
                  {prevStatus && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRevertStatus}
                      disabled={reverting}
                      className="w-full text-muted-foreground hover:text-foreground"
                    >
                      {reverting
                        ? <><Loader2Icon className="mr-2 size-3.5 animate-spin" />Reverting…</>
                        : `↩ Revert to ${STATUS_LABELS[prevStatus]}`}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
