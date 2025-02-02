import { PrismaClient } from '@prisma/client'

/**
 * Using var is necessary here as let/const don't work the same way in global scope.
 * This pattern is a standard approach for Next.js applications to prevent multiple 
 * Prisma instances in development mode while maintaining proper TypeScript types.
 * 
 * Why var?
 * - In global scope, var creates a property on the global object
 * - let/const do not create properties on the global object
 * - This behavior is crucial for sharing the Prisma instance across modules
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma 