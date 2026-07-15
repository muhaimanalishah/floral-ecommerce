"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
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
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { StarIcon, EyeIcon, Loader2Icon, ChevronLeftIcon, ChevronRightIcon, MessageSquareTextIcon, CheckIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  rating: number
  healthRating: number
  reviewText: string | null
  plantPhotoUrl: string | null
  isApproved: boolean
  adminReply: string | null
  createdAt: string
  user: {
    fullName: string
    email: string
  }
  product: {
    name: string
    slug: string
  }
}

function renderStars(count: number, activeColor = "text-amber-500", inactiveColor = "text-muted-foreground/20") {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={cn(
            "size-3.5 fill-current",
            star <= count ? activeColor : inactiveColor
          )}
        />
      ))}
    </div>
  )
}

export function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [adminReply, setAdminReply] = useState("")
  const [saving, setSaving] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchReviews = async (currentPage = page, status = statusFilter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?page=${currentPage}&limit=10&status=${status}`)
      const json = await res.json()
      setReviews(json.data ?? [])
      const t = json.pagination?.total ?? 0
      setTotal(t)
      setTotalPages(Math.ceil(t / (json.pagination?.limit ?? 10)))
    } catch {
      toast.error("Failed to load reviews")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews(page, statusFilter)
  }, [page, statusFilter])

  const handleFilterChange = (val: string | null) => {
    if (val) {
      setStatusFilter(val)
      setPage(1)
    }
  }

  const handleOpenModerate = (review: Review) => {
    setSelectedReview(review)
    setAdminReply(review.adminReply ?? "")
    setSheetOpen(true)
  }

  const handleApprove = async (reviewId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      })

      if (res.ok) {
        toast.success("Review approved and published!")
        setSheetOpen(false)
        fetchReviews(page, statusFilter)
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to approve review")
      }
    } catch {
      toast.error("An error occurred during approval")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReply = async () => {
    if (!selectedReview) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminReply: adminReply.trim() || undefined,
          isApproved: true,
        }),
      })

      if (res.ok) {
        toast.success("Expert advice reply saved successfully!")
        setSheetOpen(false)
        fetchReviews(page, statusFilter)
      } else {
        const json = await res.json()
        toast.error(json.error ?? "Failed to save reply")
      }
    } catch {
      toast.error("An error occurred while saving the reply")
    } finally {
      setSaving(false)
    }
  }

  const columns: ColumnDef<Review>[] = [
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
      id: "product",
      header: "Product",
      cell: ({ row }) => <span className="font-medium text-foreground">{row.original.product.name}</span>,
    },
    {
      id: "rating",
      header: "Product Rating",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {renderStars(row.original.rating, "text-amber-500")}
          <span className="text-xs text-muted-foreground font-semibold">({row.original.rating})</span>
        </div>
      ),
    },
    {
      id: "health",
      header: "Plant Health",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {renderStars(row.original.healthRating, "text-emerald-500")}
          <span className="text-xs text-muted-foreground font-semibold">({row.original.healthRating})</span>
        </div>
      ),
    },
    {
      id: "comment",
      header: "Comment Preview",
      cell: ({ row }) => (
        <p className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.original.reviewText ?? ""}>
          {row.original.reviewText || <span className="italic text-muted-foreground/45">Rating only</span>}
        </p>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            row.original.isApproved
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          )}
        >
          {row.original.isApproved ? "Approved" : "Pending"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenModerate(row.original)}
          className="cursor-pointer"
          title="Moderate review"
        >
          <EyeIcon className="size-4" />
        </Button>
      ),
    },
  ]

  const table = useReactTable({
    data: reviews,
    columns,
    state: { sorting, pagination: { pageIndex: page - 1, pageSize: 10 } },
    onSortingChange: setSorting,
    manualPagination: true,
    pageCount: totalPages,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-44 h-8 text-sm">
            <SelectValue>
              {statusFilter === "pending" ? "Pending" : statusFilter === "approved" ? "Approved" : "All Reviews"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="all">All Reviews</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-6 animate-spin text-primary" />
            Loading reviews...
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
                    No reviews found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total} review{total !== 1 ? "s" : ""} &middot; Page {page} of {totalPages || 1}
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
        {selectedReview && (
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Moderate Review</SheetTitle>
              <SheetDescription>
                Moderate feedback and respond with expert gardening advice.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reviewer</h4>
                    <p className="font-semibold text-foreground">{selectedReview.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedReview.user.email}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Product</h4>
                    <p className="font-semibold text-primary">{selectedReview.product.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-md border p-3 bg-muted/20">
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Product Quality</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {renderStars(selectedReview.rating, "text-amber-500")}
                      <span className="text-xs font-bold text-foreground">({selectedReview.rating}/5)</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block font-medium">Plant Arrival Health</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {renderStars(selectedReview.healthRating, "text-emerald-500")}
                      <span className="text-xs font-bold text-foreground">({selectedReview.healthRating}/5)</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Customer Review</h4>
                  <p className="text-sm text-foreground bg-muted/40 rounded-md p-3 border italic">
                    &ldquo;{selectedReview.reviewText || "Rating left with no comments."}&rdquo;
                  </p>
                </div>

                {selectedReview.plantPhotoUrl && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Customer Uploaded Photo</h4>
                    <div className="rounded-lg overflow-hidden border max-h-[220px] flex items-center justify-center bg-black/5">
                      <img
                        src={selectedReview.plantPhotoUrl}
                        alt="Customer plant in its new home"
                        className="object-contain max-h-[220px] w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                {!selectedReview.isApproved && (
                  <Button
                    onClick={() => handleApprove(selectedReview.id)}
                    disabled={saving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="mr-2 size-4" />
                        Approve & Publish Review
                      </>
                    )}
                  </Button>
                )}

                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                    <MessageSquareTextIcon className="size-4" />
                    <span>Expert Advice (Admin Reply)</span>
                  </div>
                  <Textarea
                    rows={4}
                    value={adminReply}
                    onChange={(e) => setAdminReply(e.target.value)}
                    placeholder="Provide professional plant care recommendations or thank the customer..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Adding a reply will automatically mark this review as approved and display your advice publicly beneath it.
                  </p>
                  <Button
                    onClick={handleSaveReply}
                    disabled={saving}
                    className="w-full cursor-pointer mt-2"
                  >
                    {saving ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Saving Reply...
                      </>
                    ) : (
                      "Save Reply & Publish"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
