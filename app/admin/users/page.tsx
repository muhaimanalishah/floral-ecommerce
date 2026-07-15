import { AdminHeader } from "@/components/admin/admin-header"
import { UsersTable } from "@/components/admin/users-table"

export default function AdminUsers() {
  return (
    <>
      <AdminHeader title="User Registry" />
      <UsersTable />
    </>
  )
}
