import { AdminHeader } from "@/components/admin/admin-header"
import { CategoriesTable } from "@/components/admin/categories-table"

export default function AdminCategories() {
  return (
    <>
      <AdminHeader title="Categories" />
      <div className="px-4 lg:px-6">
        <CategoriesTable />
      </div>
    </>
  )
}
