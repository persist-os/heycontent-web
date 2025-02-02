import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/auth-options";
import { compare } from 'bcryptjs'
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from '@/app/lib/prisma'

export const preferredRegion = 'auto'

export const auth = async (
  ...args: [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]] | [NextApiRequest, NextApiResponse] | []
) => {
  if (args.length > 0) {
    const [req, res] = args;
    if (!req || !res) throw new Error("Missing request or response objects");
    return await NextAuth(authOptions).auth(req as NextApiRequest, res as NextApiResponse);
  }
  return await NextAuth(authOptions).auth();
};

export type { Session }; 