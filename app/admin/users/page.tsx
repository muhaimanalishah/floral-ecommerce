import { AdminHeader } from "@/components/admin/admin-header"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsers() {
  return (
    <>
      <AdminHeader title="User Registry" />
      <div className="px-4 lg:px-6">
        <UsersTable />
      </div>
    </>
  )
}
