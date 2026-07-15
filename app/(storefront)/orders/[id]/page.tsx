import { OrderView } from "@/components/store/order-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params

  return <OrderView orderId={id} />
}
