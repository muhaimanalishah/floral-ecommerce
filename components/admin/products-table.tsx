"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from "lucide-react"
import { CreateProductSchema, type CreateProductInput } from "@/lib/validators/product"
import type { GrowthRate, ProductSize, ProductType } from "@/generated/client"

interface Product {
  id: string
  name: string
  slug: string
  botanicalName: string | null
  productType: ProductType
  price: number
  size: ProductSize | null
  sunlightReq: string | null
  wateringFreq: string | null
  soilType: string | null
  temperatureRange: string | null
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

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<CreateProductInput>({
    name: "",
    slug: "",
    categoryId: "",
    productType: "PLANT",
    price: 0,
    stockQty: 0,
    lowMaintenance: false,
    petFriendly: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([productsRes, categoriesRes]) => {
      setProducts(productsRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
    })
  }, [])

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
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openEdit(row.original)}
        >
          <PencilIcon className="size-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  function resetForm() {
    setForm({
      name: "",
      slug: "",
      categoryId: "",
      productType: "PLANT",
      price: 0,
      stockQty: 0,
      lowMaintenance: false,
      petFriendly: false,
    })
    setFormErrors({})
    setEditingProduct(null)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setForm({
      categoryId: product.category.id,
      name: product.name,
      slug: product.slug,
      botanicalName: product.botanicalName ?? undefined,
      productType: product.productType,
      price: product.price,
      size: product.size ?? undefined,
      sunlightReq: product.sunlightReq ?? undefined,
      wateringFreq: product.wateringFreq ?? undefined,
      soilType: product.soilType ?? undefined,
      temperatureRange: product.temperatureRange ?? undefined,
      lowMaintenance: product.lowMaintenance,
      petFriendly: product.petFriendly,
      growthRate: product.growthRate ?? undefined,
      stockQty: product.stockQty,
      description: product.description ?? undefined,
    } as CreateProductInput)
    setFormErrors({})
    setSheetOpen(true)
  }

  function updateField(key: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "name" && !editingProduct) {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  async function handleSave() {
    const parsed = CreateProductSchema.safeParse(form)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0])
        if (!errors[key]) errors[key] = issue.message
      }
      setFormErrors(errors)
      return
    }

    setSaving(true)
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : "/api/products"
      const method = editingProduct ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormErrors({ _form: err.error ?? "Failed to save" })
        return
      }

      // Refresh product list
      const productsRes = await fetch("/api/products").then((r) => r.json())
      setProducts(productsRes.data ?? [])
      setSheetOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {products.length} products
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
          <SheetTrigger onClick={() => { resetForm(); setSheetOpen(true) }}
            className={cn(buttonVariants(), "cursor-pointer")}
          >
            <PlusIcon className="size-4 mr-2" />
            Add Product
          </SheetTrigger>
          <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle>{editingProduct ? "Edit Product" : "Add Product"}</SheetTitle>
              <SheetDescription>
                {editingProduct ? "Update the product details" : "Fill in the details to create a new product"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid gap-6">
              {formErrors._form && (
                <p className="text-sm text-destructive">{formErrors._form}</p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                  {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                  />
                  {formErrors.slug && <p className="text-xs text-destructive">{formErrors.slug}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => updateField("categoryId", v)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {formErrors.categoryId && <p className="text-xs text-destructive">{formErrors.categoryId}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="productType">Type</Label>
                  <Select
                    value={form.productType}
                    onValueChange={(v) => updateField("productType", v)}
                  >
                    <SelectTrigger id="productType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="PLANT">Plant</SelectItem>
                        <SelectItem value="ACCESSORY">Accessory</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Price (PKR)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                  />
                  {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="size">Size</Label>
                  <Select
                    value={form.size ?? ""}
                    onValueChange={(v) => updateField("size", v || undefined)}
                  >
                    <SelectTrigger id="size">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="SMALL">Small</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LARGE">Large</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="stockQty">Stock</Label>
                  <Input
                    id="stockQty"
                    type="number"
                    min="0"
                    value={form.stockQty}
                    onChange={(e) => updateField("stockQty", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="growthRate">Growth Rate</Label>
                  <Select
                    value={form.growthRate ?? ""}
                    onValueChange={(v) => updateField("growthRate", v || undefined)}
                  >
                    <SelectTrigger id="growthRate">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="SLOW">Slow</SelectItem>
                        <SelectItem value="FAST">Fast</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="botanicalName">Botanical Name</Label>
                  <Input
                    id="botanicalName"
                    value={form.botanicalName ?? ""}
                    onChange={(e) => updateField("botanicalName", e.target.value || undefined)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sunlightReq">Sunlight</Label>
                  <Input
                    id="sunlightReq"
                    value={form.sunlightReq ?? ""}
                    onChange={(e) => updateField("sunlightReq", e.target.value || undefined)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="wateringFreq">Watering</Label>
                  <Input
                    id="wateringFreq"
                    value={form.wateringFreq ?? ""}
                    onChange={(e) => updateField("wateringFreq", e.target.value || undefined)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="soilType">Soil Type</Label>
                  <Input
                    id="soilType"
                    value={form.soilType ?? ""}
                    onChange={(e) => updateField("soilType", e.target.value || undefined)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="temperatureRange">Temperature</Label>
                  <Input
                    id="temperatureRange"
                    value={form.temperatureRange ?? ""}
                    onChange={(e) => updateField("temperatureRange", e.target.value || undefined)}
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="lowMaintenance"
                    checked={form.lowMaintenance}
                    onCheckedChange={(v) => updateField("lowMaintenance", !!v)}
                  />
                  <Label htmlFor="lowMaintenance">Low Maintenance</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="petFriendly"
                    checked={form.petFriendly}
                    onCheckedChange={(v) => updateField("petFriendly", !!v)}
                  />
                  <Label htmlFor="petFriendly">Pet Friendly</Label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value || undefined)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setSheetOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  No products yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
