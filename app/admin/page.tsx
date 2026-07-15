import { AdminHeader } from "@/components/admin/admin-header"
import { DashboardCards } from "@/components/admin/dashboard-cards"

export default function AdminDashboard() {
  return (
    <>
      <AdminHeader title="Dashboard" />
      <DashboardCards />
    </>
  )
}
