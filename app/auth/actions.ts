"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signIn, signOut } from "@/auth"

const signUpSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type AuthState =
  | { errors?: Record<string, string[] | undefined>; message?: string }
  | undefined

function fieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  for (const issue of issues) {
    const key = String(issue.path[0])
    if (issue.path.length > 0) (map[key] ??= []).push(issue.message)
  }
  return map
}

export async function signUp(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) }
  }

  const { fullName, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { message: "An account with this email already exists" }
  }

  const hashedPassword = await hash(password, 10)

  await prisma.user.create({
    data: {
      fullName,
      email,
      hashedPassword,
    },
  })

  await signIn("credentials", { email, password, redirect: false })
  redirect("/")
}

export async function login(
  _state: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.issues) }
  }

  const { email, password } = parsed.data

  try {
    await signIn("credentials", { email, password, redirect: false })
  } catch {
    return { message: "Invalid email or password" }
  }

  redirect("/")
}

export async function logout() {
  await signOut({ redirect: false })
  redirect("/auth/login")
}
