"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCartIcon,
  StarIcon,
  SunIcon,
  DropletIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ShieldAlertIcon,
  ChevronRightIcon,
  Loader2Icon,
  InfoIcon,
  PenLineIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  reviewText: string | null
  createdAt: string
  user: {
    fullName: string
  }
}

interface ProductDetailsProps {
  product: {
    id: string
    slug: string
    name: string
    botanicalName: string | null
    description: string | null
    price: number
    size: string | null
    stockQty: number
    sunlightReq: string | null
    wateringFreq: string | null
    lowMaintenance: boolean
    petFriendly: boolean
    growthRate: string | null
    temperatureRange: string | null
    soilType: string | null
    productType: string
    createdAt: string
    category: { name: string }
    images: { id: string; url: string; isPrimary: boolean }[]
    reviews: Review[]
  }
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState(
    product.images.find((img) => img.isPrimary)?.url ||
      product.images[0]?.url ||
      "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?q=80&w=600&auto=format&fit=crop"
  )

  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewHealthRating, setReviewHealthRating] = useState(0)
  const [reviewHealthHover, setReviewHealthHover] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || reviewHealthRating === 0) {
      toast.error("Please select both a product rating and a plant health rating")
      return
    }
    setSubmittingReview(true)
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: reviewRating, healthRating: reviewHealthRating, reviewText: reviewText.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Review submitted! It will appear after admin approval.")
        setShowReviewForm(false)
        setReviewRating(0)
        setReviewHealthRating(0)
        setReviewText("")
      } else if (res.status === 401) {
        toast.error("Please sign in to leave a review")
        router.push(`/auth/login?redirectTo=/shop/${product.slug}`)
      } else {
        toast.error(data.error ?? "Failed to submit review")
      }
    } catch {
      toast.error("Failed to submit review")
    } finally {
      setSubmittingReview(false)
    }
  }

  // Reviews calculations
  const averageRating = product.reviews.length
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : "No ratings yet"

  const handleAddToCart = async () => {
    setAddingToCart(true)
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      })

      if (res.ok) {
        toast.success(`Added ${quantity} x ${product.name} to your cart!`)
        router.refresh()
      } else {
        const data = await res.json()
        if (res.status === 401) {
          toast.error("Please sign in to add items to your cart")
          router.push(`/auth/login?redirectTo=/shop/${product.slug}`)
        } else {
          toast.error(data.error ?? "Failed to add to cart")
        }
      }
    } catch {
      toast.error("Failed to add to cart")
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Product Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase font-semibold">
        <Link href="/shop" className="hover:text-foreground transition-colors">
          Shop
        </Link>
        <ChevronRightIcon className="size-3" />
        <span>{product.category.name}</span>
        <ChevronRightIcon className="size-3" />
        <span className="text-foreground normal-case font-bold">{product.name}</span>
      </div>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden border bg-muted shadow-sm flex items-center justify-center">
            <img src={selectedImage} alt={product.name} className="object-cover w-full h-full" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.url)}
                  className={`relative aspect-square w-20 shrink-0 rounded-lg overflow-hidden border cursor-pointer ${
                    selectedImage === img.url ? "border-primary ring-2 ring-primary/20" : "hover:border-foreground/40"
                  }`}
                >
                  <img src={img.url} alt={product.name} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Order Panel & Details */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase font-bold text-primary tracking-widest">{product.category.name}</span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-1 font-serif">{product.name}</h1>
              {product.botanicalName && (
                <p className="text-sm italic text-muted-foreground mt-0.5">{product.botanicalName}</p>
              )}
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-500">
                <StarIcon className="size-4 fill-amber-500" />
                <span className="text-sm font-bold ml-1 text-foreground">{averageRating}</span>
              </div>
              <span className="text-muted-foreground text-xs font-medium">({product.reviews.length} reviews)</span>
            </div>

            {/* Pricing / Stock */}
            <div className="flex items-end justify-between py-4 border-y">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Price</p>
                <span className="text-3xl font-black text-foreground">PKR {product.price.toLocaleString()}</span>
              </div>
              <div>
                {product.stockQty > 0 ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/15 border-emerald-500/20 font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    In Stock ({product.stockQty})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5">
                    Out of Stock
                  </Badge>
                )}
              </div>
            </div>

            {/* Botanical Care Specs Grid */}
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/40">
                <SunIcon className="size-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Sunlight</p>
                  <p className="text-sm font-bold mt-1 text-foreground capitalize">{product.sunlightReq?.toLowerCase() || "Not Specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/40">
                <DropletIcon className="size-5 text-sky-500 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Watering</p>
                  <p className="text-sm font-bold mt-1 text-foreground capitalize">{product.wateringFreq?.toLowerCase() || "Not Specified"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/40">
                {product.petFriendly ? (
                  <ShieldCheckIcon className="size-5 text-emerald-500 shrink-0" />
                ) : (
                  <ShieldAlertIcon className="size-5 text-rose-500 shrink-0" />
                )}
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Pet Safety</p>
                  <p className="text-sm font-bold mt-1 text-foreground capitalize">
                    {product.petFriendly ? "Pet Safe" : "Toxic to Pets"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-xl border bg-card/40">
                <SparklesIcon className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Maintenance</p>
                  <p className="text-sm font-bold mt-1 text-foreground capitalize">
                    {product.lowMaintenance ? "Easy Care" : "Moderate Care"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cart Quantity Selector & Add */}
          {product.stockQty > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex border rounded-lg h-11 shrink-0 overflow-hidden items-center bg-card">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-full flex items-center justify-center font-bold border-r hover:bg-muted text-foreground cursor-pointer transition-colors"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-bold text-foreground">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                  className="w-10 h-full flex items-center justify-center font-bold border-l hover:bg-muted text-foreground cursor-pointer transition-colors"
                >
                  +
                </button>
              </div>
              <Button
                size="lg"
                disabled={addingToCart}
                onClick={handleAddToCart}
                className="flex-1 h-11 text-sm font-bold cursor-pointer"
              >
                {addingToCart ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <ShoppingCartIcon className="mr-2 size-4" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Description & Growth Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-foreground font-serif">Botanical Profile</h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {product.description || "No botanical description provided for this foliage addition."}
          </p>
        </div>
        <div className="space-y-4 border rounded-xl p-6 bg-muted/30">
          <h3 className="font-bold text-foreground flex items-center gap-1.5">
            <InfoIcon className="size-4 text-primary" />
            Quick Metrics
          </h3>
          <div className="space-y-3 text-sm">
            {product.size && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Pot Size</span>
                <span className="font-semibold text-foreground capitalize">{product.size.toLowerCase()}</span>
              </div>
            )}
            {product.growthRate && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Growth Rate</span>
                <span className="font-semibold text-foreground capitalize">{product.growthRate.toLowerCase()}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Product Type</span>
              <span className="font-semibold text-foreground capitalize">{product.productType.toLowerCase()}</span>
            </div>
            {product.soilType && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Soil Profile</span>
                <span className="font-semibold text-foreground capitalize">{product.soilType.toLowerCase()}</span>
              </div>
            )}
            {product.temperatureRange && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Temperature</span>
                <span className="font-semibold text-foreground">{product.temperatureRange}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Catalogued On</span>
              <span className="font-semibold text-foreground">
                {new Date(product.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6 pt-8 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground font-serif">Customer Reviews</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Ratings from plant parents who ordered this specimen</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-primary">Average: {averageRating}</span>
            <Button
              size="sm"
              variant="outline"
              className="text-xs font-semibold cursor-pointer"
              onClick={() => setShowReviewForm((v) => !v)}
            >
              <PenLineIcon className="size-3.5 mr-1.5" />
              Write a Review
            </Button>
          </div>
        </div>

        {/* Review submission form */}
        {showReviewForm && (
          <Card className="p-6 space-y-5 border bg-card/60">
            <h3 className="font-bold text-sm text-foreground font-serif">Share Your Experience</h3>
            <p className="text-xs text-muted-foreground -mt-2">Only customers who received this product can leave a review.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="cursor-pointer"
                    >
                      <StarIcon
                        className={`size-6 transition-colors ${star <= (reviewHoverRating || reviewRating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plant Health on Arrival</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewHealthRating(star)}
                      onMouseEnter={() => setReviewHealthHover(star)}
                      onMouseLeave={() => setReviewHealthHover(0)}
                      className="cursor-pointer"
                    >
                      <StarIcon
                        className={`size-6 transition-colors ${star <= (reviewHealthHover || reviewHealthRating) ? "text-emerald-400 fill-emerald-400" : "text-muted-foreground/30"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-text" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Review <span className="font-normal normal-case text-muted-foreground/60">(optional)</span>
              </Label>
              <Textarea
                id="review-text"
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience — leaf condition, how it settled in, tips for other plant parents..."
                className="text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowReviewForm(false)} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" disabled={submittingReview} onClick={handleSubmitReview} className="text-xs font-semibold cursor-pointer">
                {submittingReview ? <><Loader2Icon className="size-3.5 mr-1.5 animate-spin" />Submitting…</> : "Submit Review"}
              </Button>
            </div>
          </Card>
        )}

        {product.reviews.length === 0 ? (
          <div className="border border-dashed rounded-xl p-8 text-center text-muted-foreground bg-card/40">
            No reviews yet. Be the first to share your plant parenting experience!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.reviews.map((rev) => (
              <Card key={rev.id} className="p-5 space-y-3 bg-card/60 shadow-sm border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{rev.user.fullName}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <StarIcon key={i} className="size-3.5 fill-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rev.reviewText || <span className="italic">Rated without comment.</span>}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
