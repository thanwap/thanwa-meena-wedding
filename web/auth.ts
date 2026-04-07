import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

declare module "next-auth" {
  interface Session {
    idToken?: string
  }
}
declare module "@auth/core/jwt" {
  interface JWT {
    idToken?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    jwt({ token, account }) {
      if (account?.id_token) token.idToken = account.id_token
      return token
    },
    session({ session, token }) {
      session.idToken = token.idToken
      return session
    },
  },
})
