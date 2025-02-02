import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import { fixMismatchedSocialAccounts } from '@/app/lib/auth-helpers';
import prisma from '@/app/lib/prisma';
import type { SocialAccount } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all social accounts that might be mismatched
    const allGmailAccounts = await prisma.socialAccount.findMany({
      where: {
        platform: 'gmail'
      }
    });

    console.log('Found Gmail accounts:', allGmailAccounts);

    // Check if current user has any Gmail accounts
    const currentUserAccounts = allGmailAccounts.filter((acc: SocialAccount) => acc.userId === session.user.id);
    
    if (currentUserAccounts.length > 0) {
      // User already has Gmail accounts, look for other accounts to merge
      const otherAccounts = allGmailAccounts.filter((acc: SocialAccount) => acc.userId !== session.user.id);
      
      if (otherAccounts.length === 0) {
        return NextResponse.json({ 
          message: 'No mismatched accounts found',
          currentUserId: session.user.id,
          totalGmailAccounts: allGmailAccounts.length,
          currentUserAccounts,
          allGmailAccounts: allGmailAccounts.map((a: SocialAccount) => ({ 
            userId: a.userId, 
            platform: a.platform,
            isConnected: a.isConnected
          }))
        });
      }

      // Fix each mismatched account
      const results = await Promise.all(
        otherAccounts.map((account: SocialAccount) => 
          fixMismatchedSocialAccounts(account.userId, session.user.id)
        )
      );

      return NextResponse.json({
        message: 'Successfully fixed mismatched accounts',
        fixed: results.length,
        currentUserId: session.user.id,
        previousUserIds: otherAccounts.map((a: SocialAccount) => a.userId)
      });
    } else {
      // Current user has no Gmail accounts, try to claim one
      const connectedAccount = allGmailAccounts.find((acc: SocialAccount) => acc.isConnected);
      
      if (!connectedAccount) {
        return NextResponse.json({ 
          message: 'No connected Gmail accounts found',
          currentUserId: session.user.id,
          totalGmailAccounts: allGmailAccounts.length
        });
      }

      // Fix the mismatched account
      await fixMismatchedSocialAccounts(connectedAccount.userId, session.user.id);

      return NextResponse.json({
        message: 'Successfully claimed existing Gmail account',
        currentUserId: session.user.id,
        previousUserId: connectedAccount.userId
      });
    }
  } catch (error) {
    console.error('Error fixing mismatched accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fix mismatched accounts' },
      { status: 500 }
    );
  }
} 