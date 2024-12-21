import { prisma } from './prisma';
import { cookies } from 'next/headers';

export interface Session {
  user?: {
    id: string;
    email?: string;
  };
}

export async function getSession(): Promise<Session | null> {
  try {
    const sessionToken = cookies().get('session')?.value;
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        user: true
      }
    });

    if (!session) return null;

    return {
      user: {
        id: session.user.id,
        email: session.user.email
      }
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
} 