"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, Loader2Icon, ClockIcon, TruckIcon, CheckCircle2Icon, ClipboardCheckIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Order {
  id: string
  createdAt: string
  totalAmount: number
  status: "ORDER_CONFIRMED" | "QUALITY_CHECK" | "IN_TRANSIT" | "DELIVERED"
  user: { fullName: string; email: string; phone: string | null }
}

const STATUS_LABELS: Record<string, string> = {
  ORDER_CONFIRMED: "Confirmed",
  QUALITY_CHECK: "Quality Check",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
}

const STATUS_CLASSES: Record<string, string> = {
  ORDER_CONFIRMED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  QUALITY_CHECK:   "bg-blue-500/10 text-blue-600 border-blue-500/20",
  IN_TRANSIT:      "bg-primary/10 text-primary border-primary/20",
  DELIVERED:       "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  ORDER_CONFIRMED: <ClockIcon className="size-3.5" />,
  QUALITY_CHECK:   <ClipboardCheckIcon className="size-3.5" />,
  IN_TRANSIT:      <TruckIcon className="size-3.5" />,
  DELIVERED:       <CheckCircle2Icon className="size-3.5" />,
}

export function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrders = async (currentPage = page, status = statusFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "10" })
      if (status !== "ALL") params.set("status", status)
      const res = await fetch(`/api/admin/orders?${params}`)
      const json = await res.json()
      setOrders(json.data ?? [])
      const t = json.pagination?.total ?? 0
      setTotal(t)
      setTotalPages(Math.ceil(t / (json.pagination?.limit ?? 10)))
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
    if (val) { setStatusFilter(val); setPage(1) }
  }

  const columns: ColumnDef<Order>[] = [
    {
      id: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.id.substring(0, 8)}…
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.original.user.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.original.user.email}</div>
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          PKR {row.original.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status
        return (
          <Badge variant="outline" className={cn("flex w-fit items-center gap-1", STATUS_CLASSES[s])}>
            {STATUS_ICONS[s]}
            {STATUS_LABELS[s]}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Link
          href={`/admin/orders/${row.original.id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          title="View order details"
        >
          <EyeIcon className="size-4" />
        </Link>
      ),
    },
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue>
              {statusFilter === "ALL" ? "All Statuses" : STATUS_LABELS[statusFilter]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ORDER_CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="QUALITY_CHECK">Quality Check</SelectItem>
              <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading orders...
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} order{total !== 1 ? "s" : ""} &middot; Page {page} of {totalPages || 1}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeftIcon className="size-4 mr-1" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
