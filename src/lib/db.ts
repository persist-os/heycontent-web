/*
 * This file is currently not in use as the main Prisma instance is managed in app/lib/prisma.ts
 * Keeping this commented for reference in case it's needed later
 * The main difference is this includes error logging configuration
 */

// import { PrismaClient } from '@prisma/client'

// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined
// }

// const prismaGlobal = global as { prisma?: PrismaClient }

// export const prisma = prismaGlobal.prisma || new PrismaClient({
//   log: ['error'],
// })

// if (process.env.NODE_ENV !== 'production') {
//   prismaGlobal.prisma = prisma
// } 