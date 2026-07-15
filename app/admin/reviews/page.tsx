import { AdminHeader } from "@/components/admin/admin-header"
import { ReviewsTable } from "@/components/admin/reviews-table"

export default function AdminReviews() {
  return (
    <>
      <AdminHeader title="Reviews Moderation" />
      <div className="px-4 lg:px-6">
        <ReviewsTable />
      </div>
    </>
  )
}
