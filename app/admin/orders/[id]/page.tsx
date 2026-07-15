import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AdminHeader } from "@/components/admin/admin-header"
import { OrderDetails } from "@/components/admin/order-details"
import { prisma } from "@/lib/prisma"

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      address: true,
      items: {
        include: {
          product: {
            include: { images: { where: { isPrimary: true }, take: 1 } },
          },
        },
      },
      statusHistory: { orderBy: { changedAt: "asc" } },
    },
  })
  if (!order) return null
  return JSON.parse(JSON.stringify(order))
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params
  const order = await getOrder(id)

  if (!order) {
    return (
      <>
        <AdminHeader title="Order Details" />
        <div>
          <p className="text-sm text-destructive">Order not found.</p>
          <Link href="/admin/orders" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Back to Orders
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <AdminHeader title={`Order: ${order.id.substring(0, 8)}...`} />
      <div>
        <OrderDetails order={order} />
      </div>
    </>
  )
}
