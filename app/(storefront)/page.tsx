import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  ArrowRightIcon,
  LeafIcon,
  ShieldCheckIcon,
  TruckIcon,
  SunIcon,
  DropletIcon,
  ShieldAlertIcon,
  SparklesIcon,
  HeartHandshakeIcon,
  CheckIcon,
} from "lucide-react"

export default async function StorefrontHome() {
  // Query active products to display as popular plants
  const featuredProducts = await prisma.product.findMany({
    where: { isActive: true },
    take: 4,
    include: {
      category: true,
      images: { where: { isPrimary: true }, take: 1 }
    }
  })

  const dbCategories = await prisma.category.findMany()

  // Editorial descriptions mapping to seeded categories
  const categoryDetails: Record<string, { desc: string; img: string; tag: string }> = {
    "Indoor Foliage": {
      desc: "Broad-leaved statement plants designed to thrive in ambient indoor light.",
      img: "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=400&auto=format&fit=crop",
      tag: "Low Light Tolerant"
    },
    "Air Purifiers": {
      desc: "Active filtering specimens selected to maximize room oxygenation.",
      img: "https://images.unsplash.com/photo-1508500388902-74a441a60070?q=80&w=400&auto=format&fit=crop",
      tag: "Toxin Reduction"
    },
    "Succulents & Cacti": {
      desc: "Drought-tolerant architectural shapes requiring minimal irrigation.",
      img: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400&auto=format&fit=crop",
      tag: "High Sun / Easy Care"
    },
    "Flowering Plants": {
      desc: "Vibrant seasonal blooms selected to bring color and aroma to your space.",
      img: "https://images.unsplash.com/photo-1566847438217-76e82d383f84?q=80&w=400&auto=format&fit=crop",
      tag: "Seasonal Accents"
    }
  }

  return (
    <div className="flex flex-col gap-28 pb-28 bg-[#fafaf9]">
      {/* Immersive Hero Section with Full-Background Image */}
      <section className="relative min-h-[85vh] flex items-center justify-center text-center overflow-hidden bg-zinc-950">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1600&auto=format&fit=crop"
            alt="Warm botanical greenhouse"
            className="w-full h-full object-cover opacity-55 scale-105 select-none"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fafaf9] via-zinc-950/45 to-zinc-950/20" />
        </div>

        {/* Content Overlay */}
        <div className="container mx-auto px-4 z-10 space-y-6 max-w-4xl relative">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-300 tracking-wide uppercase">
            <LeafIcon className="size-3.5 fill-emerald-300/10 text-emerald-400" />
            nursery-to-door botanical specimens
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] font-serif">
            Bring Natural Sanctuary <br />
            <span className="text-emerald-400 italic">Into Your Living Spaces</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-200 max-w-xl mx-auto font-sans leading-relaxed">
            Centralized marketplace for premium, healthy plant parenting. Hand-inspected nursery specimens delivered directly to your doorstep. Pay only after home inspection.
          </p>
          <div className="pt-4 flex justify-center">
            <Button size="lg" className="w-full sm:w-auto font-semibold cursor-pointer h-11 px-8 text-sm" render={<Link href="/shop" />}>
              <span className="flex items-center gap-2">
                Explore Plant Shop
                <ArrowRightIcon className="size-4" />
              </span>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Detail section */}
      <section className="container mx-auto px-4 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase font-bold text-primary tracking-widest">Nursery Delivery Safeguards</span>
          <h2 className="text-3xl font-extrabold text-foreground font-serif">The FloraFetch Inspection Protocol</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unlike standard e-commerce, we do not ship foliage blind in generic boxes. We operate under a strict three-tier quality contract to ensure your plant parent arrives hydrated and healthy.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-5">
            <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center">
              <ShieldCheckIcon className="size-5.5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground font-serif">1. Inspection Upon Delivery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pay 100% via Cash on Delivery. Take all the time you need to inspect leaf state and root hydration at your doorstep before handing over payment.
              </p>
            </div>
          </div>
          <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-5">
            <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center">
              <LeafIcon className="size-5.5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground font-serif">2. Botanical Vital Statistics</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We document essential care variables—sunlight levels, watering schedules, and toxicity parameters—for every plant so you know how to keep it thriving.
              </p>
            </div>
          </div>
          <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-5">
            <div className="h-11 w-11 rounded-xl bg-primary/5 flex items-center justify-center">
              <TruckIcon className="size-5.5 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground font-serif">3. Hydrated Foliage Transit</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our specialized packing wraps the soil in breathable moisture blocks to preserve root hydration for up to 96 hours in transit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Showcase with Detailed Descriptions */}
      <section className="container mx-auto px-4 space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold text-primary tracking-widest">Botanical Families</span>
          <h2 className="text-3xl font-extrabold text-foreground font-serif">Curated Plant Collections</h2>
          <p className="text-sm text-muted-foreground">Select specimens suitable for your indoor environment</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {dbCategories.map((cat) => {
            const meta = categoryDetails[cat.name] || {
              desc: "Carefully curated healthy nursery specimens.",
              tag: "Nursery Quality"
            }
            return (
              <div
                key={cat.id}
                className="group p-6 border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {meta.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground font-serif pt-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{meta.desc}</p>
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  className="self-start text-xs font-bold text-primary hover:text-primary/80 hover:bg-transparent p-0 cursor-pointer"
                  render={<Link href={`/shop?category=${cat.id}`} />}
                >
                  <span className="flex items-center gap-1.5">
                    Explore Collection
                    <ArrowRightIcon className="size-3.5" />
                  </span>
                </Button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Popular Products with Detailed Botanical Info cards */}
      <section className="container mx-auto px-4 space-y-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-primary tracking-widest">Available Specimen</span>
            <h2 className="text-3xl font-extrabold text-foreground font-serif">Popular Nursery Adoptions</h2>
            <p className="text-sm text-muted-foreground">Select healthy, vetted specimens ready to bring home</p>
          </div>
          <Button variant="outline" className="cursor-pointer font-semibold text-xs h-9" render={<Link href="/shop" />}>
            <span className="flex items-center gap-1">
              View All Plants
              <ArrowRightIcon className="size-3.5" />
            </span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredProducts.map((p) => {
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

                  {/* Pricing */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider leading-none">Grand Price</p>
                      <span className="font-bold text-foreground text-sm">PKR {p.price.toNumber().toLocaleString()}</span>
                    </div>
                    <span className="text-xs font-bold text-primary group-hover:underline flex items-center gap-0.5">
                      Adopt <ArrowRightIcon className="size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
