import NextAuth from 'next-auth'
import type { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
}

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing Google OAuth credentials');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const preferredRegion = 'auto'

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === 'production',
  session: {
    strategy: "jwt"
  },
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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
          name: profile.name || "",
          email: profile.email || "",
          image: profile.picture || "",
          emailVerified: profile.email_verified ? new Date() : null
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        console.error("No email provided by Google");
        return false;
      }

      try {
        const existingUser = await convex.query(api.users.getByEmail, { email: user.email });
        
        if (!existingUser) {
          await convex.mutation(api.users.create, {
            name: user.name || "",
            email: user.email,
            image: user.image || "",
            userId: user.id || "",
          });
        } else {
          await convex.mutation(api.users.update, {
            name: user.name || existingUser.name,
            email: user.email,
            image: user.image || existingUser.image,
            userId: user.id || "",
          });
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    }
  },
  pages: {
    error: '/auth/error',
  }
};

const { auth, handlers: { GET, POST }, signIn, signOut } = NextAuth(authConfig)

export { auth, GET, POST, signIn, signOut }
