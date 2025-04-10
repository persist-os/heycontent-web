import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');
    
    // Try to find existing user
    const existingUser = await convex.query(api.auth.getUserByEmail, { 
      email: session.user.email 
    });
    
    if (!existingUser) {
      await convex.action(api.auth.createUser, {
        name: session.user.name || "",
        email: session.user.email,
        image: session.user.image || "",
        userId: session.user.id || "",
      });
    } else {
      await convex.action(api.auth.updateUser, {
        name: session.user.name || existingUser.name,
        email: session.user.email,
        image: session.user.image || existingUser.image,
        userId: session.user.id || "",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error syncing user to Convex:", error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
} 