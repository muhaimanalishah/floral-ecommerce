import { AdminHeader } from "@/components/admin/admin-header"
import { ProductsTable } from "@/components/admin/products-table"

export default function AdminProducts() {
  return (
    <>
      <AdminHeader title="Products" />
      <div className="px-4 lg:px-6">
        <ProductsTable />
      </div>
    </>
  )
}
