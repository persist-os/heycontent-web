import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      emailVerified?: Date | null
      currentPersona?: string | null
      futureVision?: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string | null
    emailVerified?: Date | null
    currentPersona?: string | null
    futureVision?: string | null
  }
} 