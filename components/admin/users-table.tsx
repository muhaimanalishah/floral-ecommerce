"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, UserIcon, ShieldIcon, PowerIcon } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: "ADMIN" | "CUSTOMER"
  isActive: boolean
  createdAt: string
  _count: { orders: number }
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json) setCurrentUserEmail(json.email) })
      .catch(() => {})
  }, [])

  const fetchUsers = async (currentPage = page, role = roleFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "10" })
      if (role !== "ALL") params.set("role", role)
      const res = await fetch(`/api/admin/users?${params}`)
      const json = await res.json()
      setUsers(json.data ?? [])
      const t = json.pagination?.total ?? 0
      setTotal(t)
      setTotalPages(Math.ceil(t / (json.pagination?.limit ?? 10)))
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page, roleFilter)
  }, [page, roleFilter])

  const handleRoleFilterChange = (val: string | null) => {
    if (val) { setRoleFilter(val); setPage(1) }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.email === currentUserEmail || user.email === "admin@florafetch.com") {
      toast.error("You cannot deactivate a protected account.")
      return
    }
    const actionText = user.isActive ? "deactivate" : "activate"
    if (!confirm(`Are you sure you want to ${actionText} "${user.fullName}"?`)) return

    setTogglingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (res.ok) {
        toast.success(`"${user.fullName}" is now ${!user.isActive ? "active" : "inactive"}.`)
        fetchUsers(page, roleFilter)
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to update user status")
      }
    } catch {
      toast.error("An error occurred while updating user status.")
    } finally {
      setTogglingId(null)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "user",
      header: "User",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            {row.original.role === "ADMIN"
              ? <ShieldIcon className="size-4" />
              : <UserIcon className="size-4" />}
          </div>
          <div>
            <div className="font-medium text-foreground">{row.original.fullName}</div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.phone || <span className="italic text-muted-foreground/50">—</span>}
        </span>
      ),
    },
    {
      id: "date",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            row.original.role === "ADMIN"
              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          {row.original.role === "ADMIN" ? "Admin" : "Customer"}
        </Badge>
      ),
    },
    {
      id: "orders",
      header: "Orders",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground">{row.original._count.orders}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            row.original.isActive
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-muted text-muted-foreground border-border"
          )}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const u = row.original
        const isProtected = u.email === currentUserEmail || u.email === "admin@florafetch.com"
        if (isProtected) {
          return <span className="text-xs text-muted-foreground/50 px-2">—</span>
        }
        return (
          <Button
            variant="ghost"
            size="icon"
            disabled={togglingId === u.id}
            onClick={() => handleToggleStatus(u)}
            title={u.isActive ? "Suspend user" : "Activate user"}
            className={cn(
              "cursor-pointer",
              u.isActive
                ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
                : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
            )}
          >
            {togglingId === u.id
              ? <Loader2Icon className="size-4 animate-spin" />
              : <PowerIcon className="size-4" />}
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
          <SelectTrigger className="w-40 h-8 text-sm">
            <SelectValue>
              {roleFilter === "ALL" ? "All Roles" : roleFilter === "ADMIN" ? "Admins" : "Customers"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="CUSTOMER">Customers</SelectItem>
              <SelectItem value="ADMIN">Admins</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading users...
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
                    No users found.
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
          {total} user{total !== 1 ? "s" : ""} &middot; Page {page} of {totalPages || 1}
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
