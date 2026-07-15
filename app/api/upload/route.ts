import { NextRequest } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import crypto from "node:crypto"
import { requireAdmin } from "@/lib/auth-helpers"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if ("error" in auth) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "File must be JPEG, PNG, WebP, or AVIF" },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `${crypto.randomUUID()}.${ext}`
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads")
    await mkdir(uploadDir, { recursive: true })
    await writeFile(join(uploadDir, filename), buffer)

    return Response.json({ url: `/uploads/${filename}` }, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: "Upload failed" }, { status: 500 })
  }
}
