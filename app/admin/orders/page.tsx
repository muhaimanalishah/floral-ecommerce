import { AdminHeader } from "@/components/admin/admin-header"
import { OrdersTable } from "@/components/admin/orders-table"

export default function AdminOrders() {
  return (
    <>
      <AdminHeader title="Orders" />
      <div className="px-4 lg:px-6">
        <OrdersTable />
      </div>
    </>
  )
}
