import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from '@/lib/prisma'

export const preferredRegion = 'auto'

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
          ].join(' '),
          access_type: "offline",
          prompt: "consent"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials

          if (!email || !password) {
            console.log('Missing email or password')
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: email.toString() }
          })

          if (!user || !user.password) {
            console.log('User not found or no password set')
            return null
          }

          const isPasswordValid = await compare(password.toString(), user.password)

          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          if (!user.emailVerified) {
            console.log('Email not verified')
            return null
          }

          console.log('Login successful for:', email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified
          }
        } catch (error) {
          console.error('Authorization error:', error)
          if (error instanceof Error && error.message === 'UNVERIFIED_EMAIL') {
            throw error
          }
          return null
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login'
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false
        
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { accounts: true }
          })

          if (!existingUser) {
            return true
          }

          if (existingUser.accounts.length === 0) {
            await prisma.user.update({
              where: { email: user.email },
              data: { emailVerified: new Date() }
            })
            return true
          }

          const hasGoogleAccount = existingUser.accounts.some(
            acc => acc.provider === 'google'
          )

          if (!hasGoogleAccount) {
            return '/login?error=EmailExists'
          }

          if (!existingUser.emailVerified) {
            await prisma.user.update({
              where: { email: user.email },
              data: { emailVerified: new Date() }
            })
          }

          return true
        } catch (error) {
          console.error('SignIn error:', error)
          return false
        }
      }

      if (account?.provider === 'credentials') {
        if (!user?.email) return false

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })

        if (existingUser && !existingUser.emailVerified) {
          return `/verify-email?email=${encodeURIComponent(user.email)}&resend=true`
        }

        if (!user.emailVerified) {
          return `/verify-email?email=${encodeURIComponent(user.email)}`
        }
      }

      return true
    },
    async session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string
          session.user.image = token.picture as string
          session.user.currentPersona = token.currentPersona as string | null
          session.user.futureVision = token.futureVision as string | null
          session.user.emailVerified = token.emailVerified as Date | null
          session.user.name = token.name as string | null
        }
        return session
      } catch (error) {
        console.error('Session error:', error)
        return session
      }
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user) {
        token.id = user.id
        token.currentPersona = user.currentPersona
        token.futureVision = user.futureVision
        token.emailVerified = user.emailVerified
        token.name = user.name
      }
      if (account?.provider === "google") {
        token.picture = profile?.picture
      }
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name
        token.currentPersona = session.user.currentPersona
        token.futureVision = session.user.futureVision
        token.emailVerified = session.user.emailVerified
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      return `${baseUrl}/chat`
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true
}

const { auth, handlers: { GET, POST }, signIn, signOut } = NextAuth(authConfig)

export { auth, GET, POST, signIn, signOut }
