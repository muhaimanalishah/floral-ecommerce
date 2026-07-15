"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2Icon, SearchIcon, RefreshCwIcon, ShoppingCartIcon, LeafIcon, SunIcon, DropletIcon } from "lucide-react"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  slug: string
  botanicalName: string | null
  price: number
  size: string | null
  lowMaintenance: boolean
  petFriendly: boolean
  stockQty: number
  sunlightReq: string | null
  wateringFreq: string | null
  category: { id: string; name: string }
  images: { url: string }[]
}

interface Category {
  id: string
  name: string
}

export function ShopCatalog() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCartId, setAddingCartId] = useState<string | null>(null)

  // Local Filter Inputs State (does NOT trigger fetch immediately on modification)
  const [q, setQ] = useState(searchParams.get("q") ?? "")
  const [category, setCategory] = useState(searchParams.get("category") ?? "ALL")
  const [lowMaintenance, setLowMaintenance] = useState(searchParams.get("lowMaintenance") === "true")
  const [petFriendly, setPetFriendly] = useState(searchParams.get("petFriendly") === "true")
  const [priceMin, setPriceMin] = useState(searchParams.get("priceMin") ?? "")
  const [priceMax, setPriceMax] = useState(searchParams.get("priceMax") ?? "")
  const [growthRate, setGrowthRate] = useState(searchParams.get("growthRate") ?? "ALL")
  
  // Page number page state (changes instantly on pagination click, and will update URL parameter directly)
  const page = parseInt(searchParams.get("page") ?? "1")
  const [totalPages, setTotalPages] = useState(1)

  // Fetch categories once
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => setCategories(json.data ?? []))
      .catch(() => {})
  }, [])

  // Sync local inputs when URL search parameters change
  useEffect(() => {
    setQ(searchParams.get("q") ?? "")
    setCategory(searchParams.get("category") ?? "ALL")
    setLowMaintenance(searchParams.get("lowMaintenance") === "true")
    setPetFriendly(searchParams.get("petFriendly") === "true")
    setPriceMin(searchParams.get("priceMin") ?? "")
    setPriceMax(searchParams.get("priceMax") ?? "")
    setGrowthRate(searchParams.get("growthRate") ?? "ALL")
  }, [searchParams])

  // Load products when URL changes
  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?${searchParams.toString()}`)
      const json = await res.json()
      setProducts(json.data ?? [])
      const limit = json.pagination?.limit ?? 12
      const total = json.pagination?.total ?? 0
      setTotalPages(Math.ceil(total / limit))
    } catch {
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [searchParams])

  const buildParams = (overrides: Record<string, string> = {}) => {
    const state = { q, category, lowMaintenance: lowMaintenance ? "true" : "", petFriendly: petFriendly ? "true" : "", priceMin, priceMax, growthRate, ...overrides }
    const params = new URLSearchParams()
    if (state.q) params.set("q", state.q)
    if (state.category !== "ALL") params.set("category", state.category)
    if (state.lowMaintenance) params.set("lowMaintenance", "true")
    if (state.petFriendly) params.set("petFriendly", "true")
    if (state.priceMin) params.set("priceMin", state.priceMin)
    if (state.priceMax) params.set("priceMax", state.priceMax)
    if (state.growthRate !== "ALL") params.set("growthRate", state.growthRate)
    params.set("page", "1")
    return params
  }

  const handleApplyFilter = () => router.push(`/shop?${buildParams().toString()}`)

  const handleResetFilters = () => {
    setQ("")
    setCategory("ALL")
    setLowMaintenance(false)
    setPetFriendly(false)
    setPriceMin("")
    setPriceMax("")
    setGrowthRate("ALL")
    router.push("/shop")
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`/shop?${params.toString()}`)
  }

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault()
    setAddingCartId(product.id)
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      if (!res.ok) {
        throw new Error()
      }
      toast.success(`${product.name} added to cart!`)
      // Refresh cart count on header
      router.refresh()
    } catch {
      toast.error("Failed to add to cart. Are you logged in?")
    } finally {
      setAddingCartId(null)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-10 items-start">
      {/* Sidebar Filter Control */}
      <aside className="w-full lg:w-72 shrink-0 border rounded-2xl bg-card p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="font-bold text-foreground font-serif text-lg">Filter Plants</h2>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleResetFilters}
            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <RefreshCwIcon className="mr-1 size-3" />
            Reset
          </Button>
        </div>

        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Specimen</Label>
          <div className="relative">
            <Input
              id="search"
              placeholder="Snake Plant, Ivy..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pr-8 h-9 text-xs"
            />
            <SearchIcon className="absolute right-2.5 top-2.5 size-4 text-muted-foreground/60" />
          </div>
        </div>

        {/* Category List buttons (Toggle style instead of Select dropdown) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Plant Family</Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                category === "ALL"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-50 border-zinc-200/80"
              }`}
            >
              All Families
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  category === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-50 border-zinc-200/80"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Price Range (PKR)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="h-9 text-xs"
            />
            <span className="text-muted-foreground text-sm self-center">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* Growth Rate Buttons (Horizontal Toggle layout) */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Growth Rate</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "ALL", label: "All Rates" },
              { value: "SLOW", label: "Slow" },
              { value: "FAST", label: "Fast" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGrowthRate(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  growthRate === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-zinc-50 border-zinc-200/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Care Preferences */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="low-maintenance"
              checked={lowMaintenance}
              onCheckedChange={(checked) => {
                const val = !!checked
                setLowMaintenance(val)
                router.push(`/shop?${buildParams({ lowMaintenance: val ? "true" : "" }).toString()}`)
              }}
            />
            <Label htmlFor="low-maintenance" className="text-xs font-semibold text-muted-foreground cursor-pointer uppercase tracking-wider">
              Low Maintenance
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="pet-friendly"
              checked={petFriendly}
              onCheckedChange={(checked) => {
                const val = !!checked
                setPetFriendly(val)
                router.push(`/shop?${buildParams({ petFriendly: val ? "true" : "" }).toString()}`)
              }}
            />
            <Label htmlFor="pet-friendly" className="text-xs font-semibold text-muted-foreground cursor-pointer uppercase tracking-wider">
              Pet Friendly
            </Label>
          </div>
        </div>

        <Button onClick={handleApplyFilter} className="w-full h-9 text-sm cursor-pointer mt-4 font-semibold">
          Apply Filters
        </Button>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 space-y-6">
        {loading ? (
          <div className="flex h-80 items-center justify-center text-muted-foreground">
            <Loader2Icon className="mr-2 size-8 animate-spin text-primary" />
            Loading catalog...
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 border border-dashed rounded-xl bg-card/40 text-center p-6">
            <LeafIcon className="size-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-bold text-foreground font-serif">No plants found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              No matching plants fit your filters. Try resetting search criteria or choosing another category.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => {
                const primaryImg = p.images[0]?.url || "https://images.unsplash.com/photo-1520302630591-fd1c66edc19d?q=80&w=300&auto=format&fit=crop"
                return (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    className="group flex flex-col rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow relative"
                  >
                    {/* Image Cover */}
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      <img
                        src={primaryImg}
                        alt={p.name}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.lowMaintenance && (
                        <span className="absolute top-3 left-3 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Low Care
                        </span>
                      )}
                      {p.petFriendly && (
                        <span className="absolute top-3 right-3 bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 backdrop-blur-md text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Pet Safe
                        </span>
                      )}
                    </div>

                    {/* Card Content with Botanical Specs */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          <span>{p.category.name}</span>
                          <span>{p.size?.toLowerCase()}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors font-serif pt-1">
                          {p.name}
                        </h3>
                        {p.botanicalName && (
                          <p className="text-xs italic text-muted-foreground">{p.botanicalName}</p>
                        )}
                      </div>

                      {/* Botanical spec summary */}
                      <div className="grid grid-cols-2 gap-2 py-2 border-y text-[11px] text-muted-foreground font-semibold">
                        <div className="flex items-center gap-1">
                          <SunIcon className="size-3.5 text-amber-500 shrink-0" />
                          <span className="truncate capitalize">{p.sunlightReq?.toLowerCase() || "Sunlight"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DropletIcon className="size-3.5 text-sky-500 shrink-0" />
                          <span className="truncate capitalize">{p.wateringFreq?.toLowerCase() || "Watering"}</span>
                        </div>
                      </div>

                      {/* Price / Action */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Price</p>
                          <span className="font-bold text-foreground text-sm">PKR {p.price.toLocaleString()}</span>
                        </div>
                        {p.stockQty > 0 ? (
                          <Button
                            size="sm"
                            disabled={addingCartId === p.id}
                            onClick={(e) => handleAddToCart(p, e)}
                            className="cursor-pointer text-xs h-8 font-semibold"
                          >
                            {addingCartId === p.id ? (
                              <Loader2Icon className="size-3.5 animate-spin" />
                            ) : (
                              <>
                                <ShoppingCartIcon className="size-3.5 mr-1" />
                                Adopt
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
                            Out of stock
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </div>
  )
}
