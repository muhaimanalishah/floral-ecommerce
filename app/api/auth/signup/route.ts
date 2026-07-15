import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn } from "@/auth"
import { signUpSchema } from "@/lib/validators/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = signUpSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { fullName, email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(password, 10)
    await prisma.user.create({
      data: {
        fullName,
        email,
        hashedPassword,
      },
    })

    // Log the user in
    await signIn("credentials", { email, password, redirect: false })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    const isRedirect = error instanceof Error && error.message === "NEXT_REDIRECT"
    if (isRedirect || (error as any).digest?.startsWith("NEXT_REDIRECT")) {
      return NextResponse.json({ success: true }, { status: 201 })
    }
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
