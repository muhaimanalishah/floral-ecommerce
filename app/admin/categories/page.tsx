import { AdminHeader } from "@/components/admin/admin-header"
import { CategoriesTable } from "@/components/admin/categories-table"

export default function AdminCategories() {
  return (
    <>
      <AdminHeader title="Categories" />
      <CategoriesTable />
    </>
  )
}
