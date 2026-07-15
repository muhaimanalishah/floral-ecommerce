"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Loader2Icon,
  AlertCircleIcon,
  CheckCircle2Icon,
  TruckIcon,
  ChevronLeftIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface OrderStatusLog {
  id: string
  status: string
  changedAt: string
}

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  subtotal: number
  product: {
    name: string
    size: string | null
    images: { url: string }[]
  }
}

interface Order {
  id: string
  status: string
  totalAmount: number
  createdAt: string
  deliveryDate: string | null
  specialInstructions: string | null
  address: {
    label: string
    street: string
    city: string
    province: string
    postalCode: string | null
  }
  items: OrderItem[]
  statusHistory: OrderStatusLog[]
}

const STATUS_STEPS = [
  { key: "ORDER_CONFIRMED", label: "Confirmed", icon: CheckCircle2Icon },
  { key: "QUALITY_CHECK", label: "Quality Check", icon: CheckCircle2Icon },
  { key: "IN_TRANSIT", label: "In Transit", icon: TruckIcon },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2Icon },
]

export function OrderView({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const loadOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`)
      if (res.status === 401) {
        toast.error("Please sign in to view your orders")
        router.push(`/auth/login?redirectTo=/orders/${orderId}`)
        return
      }
      const data = await res.json()
      if (res.ok) {
        setOrder(data)
      } else {
        toast.error(data.error ?? "Failed to load order")
      }
    } catch {
      toast.error("Failed to load order")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="flex flex-col flex-1 h-80 items-center justify-center text-muted-foreground bg-[#fafaf9]">
        <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
        Fetching order timeline...
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center space-y-6 flex-1 bg-[#fafaf9] max-w-xl rounded-2xl border my-12 shadow-sm">
        <AlertCircleIcon className="size-16 text-rose-500/30" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground font-serif">Order not found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            This order ID does not exist or you do not have permission to view it.
          </p>
        </div>
        <Button size="sm" className="font-semibold cursor-pointer h-9" render={<Link href="/shop" />}>
          Go back to Shop
        </Button>
      </div>
    )
  }

  const getStatusIndex = () => {
    if (order.status === "CANCELLED") return -1
    return STATUS_STEPS.findIndex((step) => step.key === order.status)
  }
  const currentStepIndex = getStatusIndex()

  return (
    <div className="container mx-auto px-4 py-12 space-y-10 flex-1 max-w-4xl bg-[#fafaf9] rounded-2xl border my-12 shadow-sm">
      {/* Back button */}
      <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-wider transition-colors">
        <ChevronLeftIcon className="size-4" />
        Back to Profile
      </Link>

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-6 border-b">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none">Order Identifier</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-2 font-serif">#{order.id}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
          </p>
        </div>
        <div>
          {order.status === "CANCELLED" ? (
            <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
              Cancelled
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-wider text-[10px] px-2.5 py-1">
              {STATUS_STEPS[currentStepIndex]?.label || order.status.replace("_", " ")}
            </Badge>
          )}
        </div>
      </div>

      {/* Tracker Timeline */}
      <Card className="p-6 border bg-card shadow-sm space-y-6">
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider font-serif">Delivery Progress</h3>
        
        {order.status === "CANCELLED" ? (
          <div className="p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl flex gap-3 items-start">
            <AlertCircleIcon className="size-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-800 text-sm">Order Cancelled</h4>
              <p className="text-xs text-rose-700/80 leading-relaxed mt-0.5">
                This order has been marked as cancelled. If you believe this is a mistake, please reach out to customer support.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col md:flex-row items-start justify-between gap-8 md:gap-4 md:py-4">
            {STATUS_STEPS.map((step, idx) => {
              const StepIcon = step.icon
              const isCompleted = idx <= currentStepIndex
              const isActive = idx === currentStepIndex
              const historyLog = order.statusHistory.find((log) => log.status === step.key)

              return (
                <div key={step.key} className="flex md:flex-col items-center gap-4 md:gap-2 flex-1 relative w-full text-left md:text-center">
                  {/* Progress Line Connector */}
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className="hidden md:block absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-muted z-0">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: idx < currentStepIndex ? "100%" : "0%" }}
                      />
                    </div>
                  )}

                  {/* Icon Circle */}
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center z-10 shrink-0 border transition-all ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground shadow"
                        : "bg-muted border-muted text-muted-foreground"
                    } ${isActive ? "ring-4 ring-primary/20 scale-105" : ""}`}
                  >
                    <StepIcon className="size-4" />
                  </div>

                  {/* Text labels */}
                  <div className="space-y-0.5">
                    <p className={`text-xs font-bold uppercase tracking-wide leading-none ${isCompleted ? "text-foreground font-serif" : "text-muted-foreground"}`}>
                      {step.label}
                    </p>
                    {historyLog ? (
                      <p className="text-[10px] text-muted-foreground font-semibold">
                        {new Date(historyLog.changedAt).toLocaleDateString()}
                      </p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/45 font-normal">Pending</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left Columns: Items list & details */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 border bg-card shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider font-serif">Adopted Specimens</h3>
            
            <div className="divide-y divide-zinc-200/60 border-y border-zinc-200/60 py-2">
              {order.items.map((item) => {
                const primaryImg = item.product.images[0]?.url || "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?q=80&w=200&auto=format&fit=crop"
                return (
                  <div key={item.id} className="py-4 flex gap-4 items-center">
                    <div className="size-16 rounded-xl overflow-hidden bg-muted border shrink-0">
                      <img src={primaryImg} alt={item.product.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="flex-1 flex justify-between items-center text-xs">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-foreground text-sm font-serif">{item.product.name}</h4>
                        <p className="text-muted-foreground">Size: {item.product.size?.toLowerCase() || "N/A"}</p>
                        <p className="text-muted-foreground font-semibold">{item.quantity} x PKR {item.unitPrice.toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-foreground text-sm">PKR {item.subtotal.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-between text-sm font-bold pt-2">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="text-foreground">PKR {order.totalAmount.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        {/* Right Column: Address & instructions summary */}
        <div className="space-y-6">
          {/* Handover Details */}
          <Card className="p-6 border bg-card shadow-sm space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground font-serif">Handover Destination</h3>
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-primary uppercase tracking-wide bg-primary/10 px-2 py-0.5 rounded">
                {order.address.label}
              </span>
              <p className="font-semibold text-foreground mt-2">{order.address.street}</p>
              <p className="text-muted-foreground">
                {order.address.city}, {order.address.province} {order.address.postalCode && `- ${order.address.postalCode}`}
              </p>
            </div>

            {order.deliveryDate && (
              <div className="space-y-1 pt-2.5 border-t">
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Preferred Handover Date</p>
                <p className="font-bold text-foreground text-xs">
                  {new Date(order.deliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}

            {order.specialInstructions && (
              <div className="space-y-1 pt-2.5 border-t">
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Instructions</p>
                <p className="text-muted-foreground leading-relaxed italic">
                  "{order.specialInstructions}"
                </p>
              </div>
            )}
          </Card>

          {/* Payment Status Summary */}
          <Card className="p-6 border bg-card shadow-sm space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground font-serif">Financial Ledger</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="font-bold text-foreground">Cash on Delivery</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-bold uppercase ${order.status === "DELIVERED" ? "text-emerald-600" : "text-amber-500"}`}>
                  {order.status === "DELIVERED" ? "Collected" : "Pending Collection"}
                </span>
              </div>
              <div className="flex justify-between pt-2.5 border-t text-sm font-bold text-foreground">
                <span>Grand Total</span>
                <span className="font-serif font-black text-base">PKR {order.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
