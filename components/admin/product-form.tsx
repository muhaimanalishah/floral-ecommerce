"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreateProductSchema, type CreateProductInput } from "@/lib/validators/product"
import type { GrowthRate, ProductSize, ProductType } from "@/generated/client"
import { ArrowLeftIcon, ImageIcon, LeafIcon, Loader2Icon, ShoppingBagIcon, SunIcon, TagIcon, Trash2Icon, StarIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ProductImage {
  id: string
  url: string
  isPrimary: boolean
  sortOrder: number
}

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
  images: ProductImage[]
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

interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
  hideHeader?: boolean
}

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex items-start gap-3 pb-4 border-b">
      <div className="mt-0.5 rounded-md bg-primary/10 p-1.5 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  )
}

export function ProductForm({ product, onSuccess, hideHeader }: ProductFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<CreateProductInput>({
    name: "",
    slug: "",
    categoryId: "",
    productType: "PLANT",
    price: 0,
    stockQty: 0,
    isActive: true,
    lowMaintenance: false,
    petFriendly: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isEditing = !!product

  // Image management (edit mode only)
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? [])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd })
      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        toast.error(err.error ?? "Upload failed")
        return
      }
      const { url: relativePath } = await uploadRes.json()
      const url = `${window.location.origin}${relativePath}`
      const isPrimary = images.length === 0
      const attachRes = await fetch(`/api/products/${product.id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, isPrimary, sortOrder: images.length }),
      })
      if (!attachRes.ok) {
        toast.error("Failed to attach image to product")
        return
      }
      const newImage: ProductImage = await attachRes.json()
      setImages((prev) => [...prev, newImage])
      toast.success("Image uploaded")
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    if (!product) return
    try {
      const res = await fetch(`/api/products/${product.id}/images/${imageId}`, { method: "PATCH" })
      if (res.ok) {
        setImages((prev) => prev.map((img) => ({ ...img, isPrimary: img.id === imageId })))
      } else {
        toast.error("Failed to set primary image")
      }
    } catch {
      toast.error("Failed to set primary image")
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    if (!product) return
    setDeletingImageId(imageId)
    try {
      const res = await fetch(`/api/products/${product.id}/images/${imageId}`, { method: "DELETE" })
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId))
        toast.success("Image removed")
      } else {
        toast.error("Failed to delete image")
      }
    } catch {
      toast.error("Failed to delete image")
    } finally {
      setDeletingImageId(null)
    }
  }

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((res) => setCategories(res.data ?? []))
  }, [])

  useEffect(() => {
    if (product) {
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
        isActive: product.isActive,
        lowMaintenance: product.lowMaintenance,
        petFriendly: product.petFriendly,
        growthRate: product.growthRate ?? undefined,
        stockQty: product.stockQty,
        description: product.description ?? undefined,
      } as CreateProductInput)
    }
  }, [product])

  function updateField(key: string, value: unknown) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === "name" && !product) {
        next.slug = slugify(value as string)
      }
      return next
    })
    setFormErrors((prev) => {
      const { [key]: _, ...rest } = prev
      return rest
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
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"

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

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/admin/products")
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
            <ArrowLeftIcon className="size-4" />
          </Link>
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? "Edit Product" : "New Product"}</h2>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update the product details below" : "Fill in the required fields to list a new product"}
            </p>
          </div>
        </div>
      )}

      {formErrors._form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formErrors._form}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-4">

          {/* Section 1: Identity */}
          <div className="rounded-lg border bg-card p-6 space-y-5">
            <SectionHeader
              icon={<TagIcon className="size-4" />}
              title="Product Identity"
              description="Core details that identify this product in the catalog and URL."
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">
                  Common Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Monstera Deliciosa"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  aria-invalid={!!formErrors.name}
                />
                {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="botanicalName">Botanical Name</Label>
                <Input
                  id="botanicalName"
                  placeholder="e.g. Monstera deliciosa"
                  value={form.botanicalName ?? ""}
                  onChange={(e) => updateField("botanicalName", e.target.value || undefined)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="slug">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/shop/</span>
                <Input
                  id="slug"
                  placeholder="monstera-deliciosa"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  aria-invalid={!!formErrors.slug}
                  className="font-mono text-sm"
                />
              </div>
              {formErrors.slug
                ? <p className="text-xs text-destructive">{formErrors.slug}</p>
                : <p className="text-xs text-muted-foreground">Auto-filled from name. Only lowercase letters, numbers, and hyphens.</p>
              }
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Describe the plant — its appearance, origin, ideal setting, and what makes it special..."
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Section 2: Care Guide */}
          <div className="rounded-lg border bg-card p-6 space-y-5">
            <SectionHeader
              icon={<SunIcon className="size-4" />}
              title="Care Guide"
              description="Displayed on the product page to help customers understand how to care for this plant. All fields are optional."
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sunlightReq">Sunlight</Label>
                <Input
                  id="sunlightReq"
                  placeholder="e.g. Bright indirect light"
                  value={form.sunlightReq ?? ""}
                  onChange={(e) => updateField("sunlightReq", e.target.value || undefined)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="wateringFreq">Watering</Label>
                <Input
                  id="wateringFreq"
                  placeholder="e.g. Once a week, let soil dry"
                  value={form.wateringFreq ?? ""}
                  onChange={(e) => updateField("wateringFreq", e.target.value || undefined)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="soilType">Soil Type</Label>
                <Input
                  id="soilType"
                  placeholder="e.g. Well-draining potting mix"
                  value={form.soilType ?? ""}
                  onChange={(e) => updateField("soilType", e.target.value || undefined)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="temperatureRange">Temperature Range</Label>
                <Input
                  id="temperatureRange"
                  placeholder="e.g. 18°C – 30°C"
                  value={form.temperatureRange ?? ""}
                  onChange={(e) => updateField("temperatureRange", e.target.value || undefined)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column — listing details */}
        <div className="space-y-4">

          {/* Section 3: Listing */}
          <div className="rounded-lg border bg-card p-6 space-y-5">
            <SectionHeader
              icon={<ShoppingBagIcon className="size-4" />}
              title="Listing"
              description="Pricing, stock, and catalog placement."
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select value={form.categoryId} onValueChange={(v) => updateField("categoryId", v)}>
                <SelectTrigger id="category" className="w-full" aria-invalid={!!formErrors.categoryId}>
                  <SelectValue placeholder="Select a category">
                    {categories.find((c) => c.id === form.categoryId)?.name ?? "Select a category"}
                  </SelectValue>
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productType">Product Type</Label>
              <Select value={form.productType} onValueChange={(v) => updateField("productType", v)}>
                <SelectTrigger id="productType" className="w-full">
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

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="size">Size</Label>
              <Select value={form.size ?? ""} onValueChange={(v) => updateField("size", v || undefined)}>
                <SelectTrigger id="size" className="w-full">
                  <SelectValue placeholder="Not specified" />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="price">
                  Price (PKR) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.price || ""}
                  onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                  aria-invalid={!!formErrors.price}
                />
                {formErrors.price && <p className="text-xs text-destructive">{formErrors.price}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stockQty">Stock Qty</Label>
                <Input
                  id="stockQty"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stockQty || ""}
                  onChange={(e) => updateField("stockQty", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Traits */}
          <div className="rounded-lg border bg-card p-6 space-y-5">
            <SectionHeader
              icon={<LeafIcon className="size-4" />}
              title="Traits & Filters"
              description="Used for storefront filtering. Affects how customers discover this product."
            />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="growthRate">Growth Rate</Label>
              <Select value={form.growthRate ?? ""} onValueChange={(v) => updateField("growthRate", v || undefined)}>
                <SelectTrigger id="growthRate" className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="SLOW">Slow</SelectItem>
                    <SelectItem value="FAST">Fast</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="lowMaintenance"
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition-colors",
                  form.lowMaintenance ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium">Low Maintenance</p>
                  <p className="text-xs text-muted-foreground">Easy to care for, tolerates neglect</p>
                </div>
                <Checkbox
                  id="lowMaintenance"
                  checked={form.lowMaintenance}
                  onCheckedChange={(v) => updateField("lowMaintenance", !!v)}
                />
              </label>

              <label
                htmlFor="petFriendly"
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition-colors",
                  form.petFriendly ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium">Pet Friendly</p>
                  <p className="text-xs text-muted-foreground">Non-toxic to cats and dogs</p>
                </div>
                <Checkbox
                  id="petFriendly"
                  checked={form.petFriendly}
                  onCheckedChange={(v) => updateField("petFriendly", !!v)}
                />
              </label>
            </div>

            <div className="border-t pt-4">
              <label
                htmlFor="isActive"
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-md border px-3 py-2.5 transition-colors",
                  form.isActive ? "border-emerald-500/40 bg-emerald-500/5" : "border-dashed hover:bg-muted/50"
                )}
              >
                <div>
                  <p className="text-sm font-medium">Published</p>
                  <p className="text-xs text-muted-foreground">
                    {form.isActive ? "Visible in the storefront" : "Hidden from customers"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {form.isActive
                    ? <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">Live</Badge>
                    : <Badge variant="outline" className="text-xs text-muted-foreground">Draft</Badge>
                  }
                  <Checkbox
                    id="isActive"
                    checked={form.isActive ?? true}
                    onCheckedChange={(v) => updateField("isActive", !!v)}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Section 5: Images */}
          <div className="rounded-lg border bg-card p-6 space-y-4">
            <SectionHeader
              icon={<ImageIcon className="size-4" />}
              title="Product Images"
              description={isEditing ? "Upload photos. First image or starred image is shown as the primary." : "Save the product first, then add images."}
            />

            {isEditing ? (
              <>
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img src={img.url} alt="" className="object-cover w-full h-full" />
                        {img.isPrimary && (
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                            Primary
                          </span>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {!img.isPrimary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(img.id)}
                              title="Set as primary"
                              className="rounded-full bg-white/20 p-1.5 hover:bg-white/40 transition-colors"
                            >
                              <StarIcon className="size-3.5 text-white" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            disabled={deletingImageId === img.id}
                            title="Delete image"
                            className="rounded-full bg-white/20 p-1.5 hover:bg-destructive/80 transition-colors"
                          >
                            {deletingImageId === img.id
                              ? <Loader2Icon className="size-3.5 text-white animate-spin" />
                              : <Trash2Icon className="size-3.5 text-white" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-colors",
                  uploadingImage ? "opacity-60 pointer-events-none" : "hover:border-primary/50 hover:bg-muted/40"
                )}>
                  {uploadingImage
                    ? <Loader2Icon className="size-5 text-primary animate-spin" />
                    : <ImageIcon className="size-5 text-muted-foreground" />}
                  <span className="text-xs font-medium text-muted-foreground">
                    {uploadingImage ? "Uploading…" : "Click to upload image"}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">JPEG, PNG, WebP — max 5MB</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                Create the product first, then add images from the edit page.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
            </Button>
            <Link href="/admin/products" className={cn(buttonVariants({ variant: "outline" }), "w-full text-center")}>
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
