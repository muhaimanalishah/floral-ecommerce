"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, Loader2Icon, SearchIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { GrowthRate, ProductSize, ProductType } from "@/generated/client"

interface Product {
  id: string
  name: string
  slug: string
  botanicalName: string | null
  productType: ProductType
  price: number
  size: ProductSize | null
  stockQty: number
  isActive: boolean
  lowMaintenance: boolean
  petFriendly: boolean
  growthRate: GrowthRate | null
  description: string | null
  category: { id: string; name: string }
  images: { url: string; isPrimary: boolean }[]
}

interface Category {
  id: string
  name: string
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const [q, setQ] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  const fetchProducts = useCallback(async (
    search: string,
    category: string,
    status: string,
    currentPage: number,
  ) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: "10" })
      if (search) params.set("q", search)
      if (category !== "all") params.set("category", category)
      if (status !== "all") params.set("status", status)

      const res = await fetch(`/api/admin/products?${params}`)
      const json = await res.json()
      setProducts(json.data ?? [])
      const t = json.pagination?.total ?? 0
      setTotal(t)
      setTotalPages(Math.ceil(t / (json.pagination?.limit ?? 10)))
    } catch {
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search, instant for filter dropdowns
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchProducts(q, categoryFilter, statusFilter, page)
    }, q ? 300 : 0)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [q, categoryFilter, statusFilter, page, fetchProducts])

  const handleFilterChange = (setter: (v: string) => void) => (val: string | null) => {
    if (val) { setter(val); setPage(1) }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value)
    setPage(1)
  }

  const handleClearSearch = () => {
    setQ("")
    setPage(1)
  }

  const handleToggleActive = async (product: Product) => {
    setTogglingId(product.id)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      })
      if (res.ok) {
        toast.success(`"${product.name}" is now ${!product.isActive ? "active" : "inactive"}.`)
        fetchProducts(q, categoryFilter, statusFilter, page)
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to update product status")
      }
    } catch {
      toast.error("An error occurred while updating product status")
    } finally {
      setTogglingId(null)
    }
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.slug}</div>
        </div>
      ),
    },
    {
      accessorKey: "category.name",
      header: "Category",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `PKR ${row.original.price.toLocaleString()}`,
    },
    {
      accessorKey: "stockQty",
      header: "Stock",
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const p = row.original
        return (
          <button
            onClick={() => handleToggleActive(p)}
            disabled={togglingId === p.id}
            className="cursor-pointer disabled:cursor-default"
            title={p.isActive ? "Click to deactivate" : "Click to activate"}
          >
            {togglingId === p.id ? (
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Badge
                variant={p.isActive ? "default" : "secondary"}
                className={cn(
                  p.isActive
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {p.isActive ? "Active" : "Inactive"}
              </Badge>
            )}
          </button>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Link
          href={`/admin/products/${row.original.id}/edit`}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <PencilIcon className="size-4" />
        </Link>
      ),
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  const hasActiveFilters = q || categoryFilter !== "all" || statusFilter !== "all"

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative w-64">
            <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or botanical..."
              value={q}
              onChange={handleSearchChange}
              className="pl-8 pr-8 h-8 text-sm"
            />
            {q && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <Select value={categoryFilter} onValueChange={handleFilterChange(setCategoryFilter)}>
            <SelectTrigger className="w-40 h-8 text-sm">
              <SelectValue>
                {categoryFilter === "all"
                  ? "All Categories"
                  : categories.find((c) => c.id === categoryFilter)?.name ?? "Category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue>
                {statusFilter === "all" ? "All Status" : statusFilter === "active" ? "Active" : "Inactive"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-muted-foreground"
              onClick={() => { setQ(""); setCategoryFilter("all"); setStatusFilter("all"); setPage(1) }}
            >
              <XIcon className="size-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <Link href="/admin/products/new" className={cn(buttonVariants(), "cursor-pointer shrink-0")}>
          <PlusIcon className="size-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading products...
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
                    {hasActiveFilters ? "No products match your filters." : "No products yet."}
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
          {total} product{total !== 1 ? "s" : ""} &middot; Page {page} of {totalPages || 1}
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
            disabled={page >= totalPages}
          >
            Next <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
