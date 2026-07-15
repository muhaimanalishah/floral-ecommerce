import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    return { error: "Unauthorized", status: 401 as const }
  }
  return { user }
}

export async function requireAdmin() {
  const result = await requireAuth()
  if ("error" in result) return result

  if (result.user.role !== "ADMIN") {
    return { error: "Forbidden", status: 403 as const }
  }
  return { user: result.user }
}
