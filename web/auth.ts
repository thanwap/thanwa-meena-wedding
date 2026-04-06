import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session {
    idToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    jwt({ token, account }) {
      // account is only present on first sign-in — capture the Google ID token
      if (account?.id_token) {
        token.idToken = account.id_token
      }
      return token
    },
    session({ session, token }) {
      // Expose idToken to Server Actions via session
      session.idToken = token.idToken
      return session
    },
  },
})
