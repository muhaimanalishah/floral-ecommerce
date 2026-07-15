import { NextResponse } from "next/server"
import { signOut } from "@/auth"

export async function POST() {
  try {
    await signOut({ redirect: false })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    )
  }
}
