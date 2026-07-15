import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NextAuth authorize start for:", credentials?.email)
        const email = credentials?.email as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) {
          console.log("NextAuth authorize failed: missing email or password")
          return null
        }

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user) {
          console.log("NextAuth authorize failed: no user found for email:", email)
          return null
        }
        if (!user.hashedPassword) {
          console.log("NextAuth authorize failed: no hashedPassword for email:", email)
          return null
        }
        if (!user.isActive) {
          console.log("NextAuth authorize failed: user is inactive:", email)
          return null
        }

        const isValid = await compare(password, user.hashedPassword)
        if (!isValid) {
          console.log("NextAuth authorize failed: password mismatch for email:", email)
          return null
        }

        console.log("NextAuth authorize success for user:", user.email, "role:", user.role)
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
})
