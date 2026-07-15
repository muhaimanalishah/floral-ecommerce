import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/auth"
import { loginSchema } from "@/lib/validators/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // In NextAuth v5, signIn handles setting session cookies
    await signIn("credentials", { email, password, redirect: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    const isRedirect = error instanceof Error && error.message === "NEXT_REDIRECT"
    if (isRedirect || (error as any).digest?.startsWith("NEXT_REDIRECT")) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    )
  }
}
