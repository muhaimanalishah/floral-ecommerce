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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StarIcon, EyeIcon, Loader2Icon, ChevronLeftIcon, ChevronRightIcon, MessageSquareTextIcon, CheckIcon, ShieldAlertIcon } from "lucide-react"
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

export function ReviewsTable() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [adminReply, setAdminReply] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchReviews = async (currentPage = page, status = statusFilter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reviews?page=${currentPage}&limit=10&status=${status}`)
      const json = await res.json()
      setReviews(json.data ?? [])
      setTotalPages(Math.ceil((json.pagination?.total ?? 0) / (json.pagination?.limit ?? 10)))
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
          // Auto approve if they are replying
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

  const renderStars = (count: number, activeColor = "text-amber-500", inactiveColor = "text-muted-foreground/20") => {
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Moderate customer review entries
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="review-filter" className="text-xs text-muted-foreground whitespace-nowrap">Filter Reviews:</Label>
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger id="review-filter" className="w-[180px]">
              <SelectValue placeholder="Pending" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved / Published</SelectItem>
              <SelectItem value="all">All Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Product Rating</TableHead>
                <TableHead>Plant Health</TableHead>
                <TableHead>Comment Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.length ? (
                reviews.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{r.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{r.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {r.product.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(r.rating, "text-amber-500")}
                        <span className="text-xs text-muted-foreground font-semibold">({r.rating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {renderStars(r.healthRating, "text-emerald-500")}
                        <span className="text-xs text-muted-foreground font-semibold">({r.healthRating})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate text-sm text-muted-foreground" title={r.reviewText ?? ""}>
                        {r.reviewText || <span className="italic text-muted-foreground/45">Rating only</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={r.isApproved ? "default" : "outline"}
                        className={cn(
                          r.isApproved
                            ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/25 border-amber-500/20"
                        )}
                      >
                        {r.isApproved ? "Approved" : "Awaiting Approval"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModerate(r)}
                        className="cursor-pointer hover:bg-accent"
                      >
                        <EyeIcon className="size-4 mr-1" />
                        Moderate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
        {selectedReview && (
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader className="pb-4 border-b">
              <SheetTitle>Moderate Review</SheetTitle>
              <SheetDescription>
                Moderate feedback and respond with expert gardening advice.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Review details */}
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
                    "{selectedReview.reviewText || "Rating left with no comments."}"
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

              {/* Action buttons */}
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

                {/* Reply section */}
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
