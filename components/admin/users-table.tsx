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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon, ToggleLeftIcon, ToggleRightIcon, UserIcon, ShieldIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User {
  id: string
  fullName: string
  email: string
  phone: string | null
  role: "ADMIN" | "CUSTOMER"
  isActive: boolean
  createdAt: string
  _count: {
    orders: number
  }
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  // Fetch current user profile to determine logged in user (to block self-deactivation)
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((json) => {
        if (json) setCurrentUserEmail(json.email)
      })
      .catch(() => {})
  }, [])

  const fetchUsers = async (currentPage = page, role = roleFilter) => {
    setLoading(true)
    try {
      const roleParam = role !== "ALL" ? `&role=${role}` : ""
      const res = await fetch(`/api/admin/users?page=${currentPage}&limit=10${roleParam}`)
      const json = await res.json()
      setUsers(json.data ?? [])
      setTotalPages(Math.ceil((json.pagination?.total ?? 0) / (json.pagination?.limit ?? 10)))
    } catch {
      toast.error("Failed to load users list")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(page, roleFilter)
  }, [page, roleFilter])

  const handleRoleFilterChange = (val: string | null) => {
    if (val) {
      setRoleFilter(val)
      setPage(1)
    }
  }

  const handleToggleStatus = async (user: User) => {
    if (user.email === currentUserEmail || user.email === "admin@florafetch.com") {
      toast.error("Security boundary: You cannot deactivate your own account.")
      return
    }

    const actionText = user.isActive ? "deactivate" : "activate"
    if (!confirm(`Are you sure you want to ${actionText} user "${user.fullName}"?`)) {
      return
    }

    setTogglingId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      })

      if (res.ok) {
        toast.success(`User "${user.fullName}" is now ${!user.isActive ? "active" : "inactive"}.`)
        fetchUsers(page, roleFilter)
      } else {
        const json = await res.json()
        toast.error(json.error ?? `Failed to change user status.`)
      }
    } catch {
      toast.error("An error occurred while updating user status.")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Manage system users and access controls
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="role-filter" className="text-xs text-muted-foreground whitespace-nowrap">Filter Role:</Label>
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger id="role-filter" className="w-[180px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="CUSTOMER">Customers</SelectItem>
              <SelectItem value="ADMIN">Administrators</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading user registry...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Orders Count</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length ? (
                users.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          {u.role === "ADMIN" ? <ShieldIcon className="size-4" /> : <UserIcon className="size-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{u.fullName}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.phone || <span className="italic text-muted-foreground/45">No phone</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{u._count.orders} orders</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.isActive ? "default" : "outline"}
                        className={cn(
                          u.isActive
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                            : "bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20"
                        )}
                      >
                        {u.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {u.email === currentUserEmail || u.email === "admin@florafetch.com" ? (
                        <span className="text-xs text-muted-foreground italic px-2">Protected</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={togglingId === u.id}
                          onClick={() => handleToggleStatus(u)}
                          className={cn(
                            "cursor-pointer text-xs",
                            u.isActive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                          )}
                        >
                          {togglingId === u.id ? (
                            <Loader2Icon className="size-3 animate-spin mr-1" />
                          ) : u.isActive ? (
                            <ToggleRightIcon className="size-4 mr-1 text-emerald-600" />
                          ) : (
                            <ToggleLeftIcon className="size-4 mr-1 text-muted-foreground" />
                          )}
                          {u.isActive ? "Suspend" : "Activate"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No users found
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
    </div>
  )
}
