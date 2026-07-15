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
import { Textarea } from "@/components/ui/textarea"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, Trash2Icon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { CategorySchema, type CategoryInput } from "@/lib/validators/category"

interface Category {
  id: string
  name: string
  description: string | null
  _count: {
    products: number
  }
}

export function CategoriesTable() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryInput>({
    name: "",
    description: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      const json = await res.json()
      setCategories(json.data ?? [])
    } catch {
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleDelete = async (category: Category) => {
    if (category._count.products > 0) {
      toast.error(`Cannot delete category "${category.name}" because it contains products.`)
      return
    }

    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(`Category "${category.name}" deleted successfully.`)
        fetchCategories()
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to delete category")
      }
    } catch {
      toast.error("An error occurred while deleting the category")
    }
  }

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Category Name",
      cell: ({ row }) => <div className="font-semibold text-foreground">{row.original.name}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[400px] truncate text-muted-foreground" title={row.original.description ?? ""}>
          {row.original.description || <span className="italic text-muted-foreground/50">No description</span>}
        </div>
      ),
    },
    {
      accessorKey: "_count.products",
      header: "Products Linked",
      cell: ({ row }) => (
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
          {row.original._count.products} products
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
            className="hover:bg-accent hover:text-accent-foreground"
            title="Edit category"
          >
            <PencilIcon className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original)}
            disabled={row.original._count.products > 0}
            className={cn(
              "hover:bg-destructive/10 hover:text-destructive",
              row.original._count.products > 0 && "opacity-50 cursor-not-allowed"
            )}
            title={
              row.original._count.products > 0
                ? "Cannot delete category with products"
                : "Delete category"
            }
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      ),
    },
  ]

  const table = useReactTable({
    data: categories,
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
      description: "",
    })
    setFormErrors({})
    setEditingCategory(null)
  }

  function openEdit(category: Category) {
    setEditingCategory(category)
    setForm({
      name: category.name,
      description: category.description ?? "",
    })
    setFormErrors({})
    setSheetOpen(true)
  }

  function updateField(key: keyof CategoryInput, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    const parsed = CategorySchema.safeParse(form)
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
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories"
      const method = editingCategory ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormErrors({ _form: err.error ?? "Failed to save category" })
        return
      }

      toast.success(
        editingCategory
          ? `Category "${parsed.data.name}" updated successfully.`
          : `Category "${parsed.data.name}" created successfully.`
      )
      setSheetOpen(false)
      resetForm()
      fetchCategories()
    } catch {
      toast.error("An error occurred while saving the category")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {categories.length} categories found
        </div>
        <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
          <SheetTrigger onClick={() => { resetForm(); setSheetOpen(true) }}
            className={cn(buttonVariants(), "cursor-pointer")}
          >
            <PlusIcon className="size-4 mr-2" />
            Add Category
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
              <SheetDescription>
                {editingCategory ? "Update details for this category" : "Create a new plant or accessory category"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 grid gap-6 px-4 pb-4">
              {formErrors._form && (
                <p className="text-sm text-destructive font-medium">{formErrors._form}</p>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Ferns"
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea
                  id="cat-desc"
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe the plant species or accessories in this category..."
                />
                {formErrors.description && <p className="text-xs text-destructive">{formErrors.description}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => { setSheetOpen(false); resetForm() }}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="min-w-[100px]">
                  {saving ? (
                    <>
                      <Loader2Icon className="mr-2 size-4 animate-spin" />
                      Saving...
                    </>
                  ) : editingCategory ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading categories...
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} className="font-semibold text-muted-foreground">
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
                    No categories found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeftIcon className="size-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next <ChevronRightIcon className="size-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
