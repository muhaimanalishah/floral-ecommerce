import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/auth/login", req.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check admin role from JWT
    const userRole = (req.auth?.user as { role?: string } | undefined)?.role
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protect API admin routes
  if (pathname.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (req.auth?.user as { role?: string } | undefined)?.role
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
