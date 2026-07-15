"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, Loader2Icon, ClockIcon, TruckIcon, CheckCircle2Icon, ClipboardCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  user: {
    fullName: string
    email: string
    phone: string | null
  }
  address: Address
  items: OrderItem[]
  statusHistory?: StatusHistory[]
}

const STATUS_ORDER = ["ORDER_CONFIRMED", "QUALITY_CHECK", "IN_TRANSIT", "DELIVERED"]

const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Confirmed",
  QUALITY_CHECK: "Quality Check",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
}

const STATUS_BADGES: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ORDER_CONFIRMED: "outline",
  QUALITY_CHECK: "secondary",
  IN_TRANSIT: "default",
  DELIVERED: "default", // will style custom green in markup
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [advancementNote, setAdvancementNote] = useState("")
  const [advancing, setAdvancing] = useState(false)

  const fetchOrders = async (currentPage = page, status = statusFilter) => {
    setLoading(true)
    try {
      const statusParam = status !== "ALL" ? `&status=${status}` : ""
      const res = await fetch(`/api/admin/orders?page=${currentPage}&limit=10${statusParam}`)
      const json = await res.json()
      setOrders(json.data ?? [])
      setTotalPages(Math.ceil((json.pagination?.total ?? 0) / (json.pagination?.limit ?? 10)))
    } catch {
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(page, statusFilter)
  }, [page, statusFilter])

  const handleFilterChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val)
      setPage(1)
    }
  }

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order)
    setSheetOpen(true)
    setAdvancementNote("")
    
    // Fetch full order (including statusHistory if not present)
    try {
      const res = await fetch(`/api/orders/${order.id}`)
      if (res.ok) {
        const json = await res.json()
        setSelectedOrder(json)
      }
    } catch {
      // Fallback to order from list
    }
  }

  const handleAdvanceStatus = async () => {
    if (!selectedOrder) return

    const currentIndex = STATUS_ORDER.indexOf(selectedOrder.status)
    if (currentIndex === -1 || currentIndex === STATUS_ORDER.length - 1) return

    const nextStatus = STATUS_ORDER[currentIndex + 1]
    setAdvancing(true)

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          note: advancementNote.trim() || undefined,
        }),
      })

      if (res.ok) {
        const updated = await res.json()
        toast.success(`Order advanced to "${STATUS_LABELS[nextStatus]}"`)
        setSelectedOrder(updated)
        setAdvancementNote("")
        fetchOrders(page, statusFilter)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ORDER_CONFIRMED":
        return <ClockIcon className="size-4 text-orange-500" />
      case "QUALITY_CHECK":
        return <ClipboardCheckIcon className="size-4 text-blue-500" />
      case "IN_TRANSIT":
        return <TruckIcon className="size-4 text-primary" />
      case "DELIVERED":
        return <CheckCircle2Icon className="size-4 text-emerald-500" />
      default:
        return null
    }
  }

  const getNextStatusText = (status: string) => {
    switch (status) {
      case "ORDER_CONFIRMED":
        return "Start Quality Check & Selection"
      case "QUALITY_CHECK":
        return "Dispatch Order (In Transit)"
      case "IN_TRANSIT":
        return "Mark as Delivered"
      default:
        return ""
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Showing orders
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter" className="text-xs text-muted-foreground whitespace-nowrap">Filter Status:</Label>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger id="status-filter" className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ORDER_CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="QUALITY_CHECK">Quality Check</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading orders...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length ? (
                orders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs">{o.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{o.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{o.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      PKR {o.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_BADGES[o.status]}
                        className={cn(
                          o.status === "DELIVERED" && "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
                          o.status === "IN_TRANSIT" && "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
                          o.status === "QUALITY_CHECK" && "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20"
                        )}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(o.status)}
                          {STATUS_LABELS[o.status]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(o)}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <EyeIcon className="size-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeftIcon className="size-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
          >
            Next <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {selectedOrder && (
          <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <SheetTitle>Order Details</SheetTitle>
                <Badge
                  variant={STATUS_BADGES[selectedOrder.status]}
                  className={cn(
                    selectedOrder.status === "DELIVERED" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    selectedOrder.status === "IN_TRANSIT" && "bg-primary/10 text-primary border-primary/20",
                    selectedOrder.status === "QUALITY_CHECK" && "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  )}
                >
                  {STATUS_LABELS[selectedOrder.status]}
                </Badge>
              </div>
              <SheetDescription className="font-mono text-xs">
                Order ID: {selectedOrder.id}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer Details</h4>
                  <p className="mt-1 font-semibold text-foreground">{selectedOrder.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.user.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.user.phone || "No phone provided"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Shipping Address</h4>
                  <p className="mt-1 font-medium text-foreground text-sm">
                    Label: <span className="font-semibold text-primary">{selectedOrder.address.label}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.address.city}, {selectedOrder.address.province} {selectedOrder.address.postalCode}
                  </p>
                </div>
              </div>

              {/* Delivery Date & Special instructions */}
              <div className="space-y-3">
                {selectedOrder.deliveryDate && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Delivery Date</h4>
                    <p className="text-sm font-medium mt-0.5 text-foreground">
                      {new Date(selectedOrder.deliveryDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {selectedOrder.specialInstructions && (
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3">
                    <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider">Special Handling Instructions</h4>
                    <p className="text-sm text-amber-900 mt-1 italic">"{selectedOrder.specialInstructions}"</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Order Items</h4>
                <div className="rounded-lg border divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 text-sm">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.product.name}</p>
                        {item.product.botanicalName && (
                          <p className="text-xs italic text-muted-foreground">{item.product.botanicalName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-right">
                        <span className="text-muted-foreground text-sm">Qty: {item.quantity}</span>
                        <span className="text-muted-foreground text-sm">PKR {item.unitPrice.toLocaleString()}</span>
                        <span className="font-semibold text-foreground min-w-[80px]">PKR {item.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 font-semibold text-foreground bg-muted/20">
                    <span>Grand Total</span>
                    <span>PKR {selectedOrder.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status History / Timeline */}
              {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Status Timeline</h4>
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-4">
                    {selectedOrder.statusHistory.map((h) => (
                      <div key={h.id} className="relative">
                        <span className="absolute -left-[31px] top-0.5 rounded-full border bg-background p-1 text-primary">
                          {getStatusIcon(h.status)}
                        </span>
                        <div className="text-sm">
                          <span className="font-semibold text-foreground">{STATUS_LABELS[h.status]}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {new Date(h.changedAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {h.note && <p className="text-xs text-muted-foreground mt-1 italic">Note: "{h.note}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Progression Form */}
              {selectedOrder.status !== "DELIVERED" ? (
                <div className="border-t pt-4 space-y-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Advance Order Process</h4>
                  <div className="space-y-2">
                    <Label htmlFor="adv-note">Status Note (Optional)</Label>
                    <Textarea
                      id="adv-note"
                      rows={2}
                      value={advancementNote}
                      onChange={(e) => setAdvancementNote(e.target.value)}
                      placeholder="e.g. Plant checked for leaf health, watered and securely packed."
                    />
                  </div>
                  <Button
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className="w-full cursor-pointer"
                  >
                    {advancing ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Advancing Order...
                      </>
                    ) : (
                      <>
                        {getNextStatusText(selectedOrder.status)}
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-4 text-center">
                  <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-4 py-2 font-medium">
                    Order is fully completed and delivered.
                  </Badge>
                </div>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
