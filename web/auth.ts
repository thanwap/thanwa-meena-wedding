import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { apiFetch } from "@/lib/api"

declare module "next-auth" {
  interface Session {
    idToken?: string
    role?: string
    user?: {
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
  interface User {
    idToken?: string
    role?: string
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    idToken?: string
    role?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined
        const password = credentials?.password as string | undefined
        if (!username || !password) return null

        let res: Response
        try {
          // Guest IP so the API's brute-force limit is per attacker, not shared with the admins
          res = await apiFetch(
            "/api/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username, password }),
              cache: "no-store",
            },
            { guest: true },
          )
        } catch (err) {
          console.error("[auth] API unreachable:", err)
          return null
        }

        if (!res.ok) return null
        const data = (await res.json()) as {
          token: string
          username: string
          role: string
        }
        return {
          id: data.username,
          name: data.username,
          idToken: data.token,
          role: data.role,
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth }) {
      return !!auth
    },
    jwt({ token, user }) {
      if (user?.idToken) token.idToken = user.idToken
      if (user?.role) token.role = user.role
      return token
    },
    session({ session, token }) {
      session.idToken = token.idToken
      session.role = token.role
      if (session.user && typeof token.sub === "string") {
        session.user.name = token.sub
      }
      return session
    },
  },
})
