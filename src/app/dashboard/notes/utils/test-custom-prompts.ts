/**
 * Test utility for custom command prompts
 * 
 * Run this from the browser console to test the custom prompts feature.
 * 
 * Usage:
 * 1. Open the notes dashboard
 * 2. Open browser console
 * 3. Copy and paste this entire file into the console
 * 4. Run: testCustomPrompts()
 */

interface CustomCommandPrompt {
  id: string;
  label: string;
  category: string;
  noteType?: string;
}

/**
 * Test prompts to verify the feature works
 */
const TEST_PROMPTS: CustomCommandPrompt[] = [
  {
    id: 'test-general-1',
    label: 'Write about my experience with',
    category: 'Test Prompts',
  },
  {
    id: 'test-general-2',
    label: 'Outline my thoughts on',
    category: 'Test Prompts',
  },
  {
    id: 'test-writing-1',
    label: 'Describe the atmosphere of',
    category: 'Test Writing',
    noteType: 'content_script'
  },
  {
    id: 'test-ideas-1',
    label: 'Explore possibilities around',
    category: 'Test Ideas',
    noteType: 'idea_bank'
  },
];

/**
 * Main test function
 */
export async function testCustomPrompts() {
  console.log('🧪 Testing Custom Command Prompts...\n');

  // Step 1: Get user ID
  console.log('Step 1: Getting user ID...');
  const userId = await getUserId();
  if (!userId) {
    console.error('❌ Failed: Could not get user ID. Are you logged in?');
    return;
  }
  console.log(`✅ User ID: ${userId}\n`);

  // Step 2: Save test prompts
  console.log('Step 2: Saving test prompts...');
  const saveSuccess = await saveCustomPrompts(userId, TEST_PROMPTS);
  if (!saveSuccess) {
    console.error('❌ Failed: Could not save custom prompts');
    return;
  }
  console.log('✅ Test prompts saved successfully\n');

  // Step 3: Fetch and verify prompts
  console.log('Step 3: Fetching prompts to verify...');
  const fetchedPrompts = await fetchCustomPrompts(userId);
  if (!fetchedPrompts) {
    console.error('❌ Failed: Could not fetch custom prompts');
    return;
  }
  
  console.log(`✅ Fetched ${fetchedPrompts.length} prompts:`);
  fetchedPrompts.forEach((prompt: CustomCommandPrompt) => {
    console.log(`   - ${prompt.label} (${prompt.category}${prompt.noteType ? `, ${prompt.noteType}` : ''})`);
  });
  console.log('');

  // Step 4: Verify data integrity
  console.log('Step 4: Verifying data integrity...');
  const allPromptsPresent = TEST_PROMPTS.every(testPrompt => 
    fetchedPrompts.some((p: CustomCommandPrompt) => 
      p.id === testPrompt.id && 
      p.label === testPrompt.label &&
      p.category === testPrompt.category
    )
  );
  
  if (!allPromptsPresent) {
    console.error('❌ Failed: Not all test prompts were saved/fetched correctly');
    return;
  }
  console.log('✅ All test prompts verified\n');

  // Success!
  console.log('✨ All tests passed!\n');
  console.log('📝 Next steps:');
  console.log('   1. Open any note in the editor');
  console.log('   2. Trigger the command palette (Cmd/Ctrl + K)');
  console.log('   3. Look for "Test Prompts" category at the top');
  console.log('   4. Verify prompts appear with ✨ Sparkles icon');
  console.log('   5. Click a prompt to populate the input field');
  console.log('   6. Test that you can edit and send the prompt\n');
  
  // Cleanup option
  console.log('🧹 To clean up test prompts, run:');
  console.log(`   cleanupTestPrompts("${userId}")`);
}

/**
 * Get current user ID from Firebase auth
 */
async function getUserId(): Promise<string | null> {
  try {
    // Try to get from Firebase auth
    // @ts-ignore
    if (window.firebase && firebase.auth()?.currentUser) {
      // @ts-ignore
      return firebase.auth().currentUser.uid;
    }
    
    // Alternative: Try to get from React context (if available in window)
    // This would require the app to expose it, which it might not
    
    console.warn('⚠️  Could not auto-detect user ID');
    console.log('Please provide your user ID:');
    console.log('   const userId = "your-firebase-uid";');
    console.log('   testCustomPromptsWithUserId(userId);');
    
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Save custom prompts via API
 */
async function saveCustomPrompts(
  userId: string,
  prompts: CustomCommandPrompt[]
): Promise<boolean> {
  try {
    const response = await fetch(`/api/users/${userId}/custom-command-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customCommandPrompts: prompts,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
}

/**
 * Fetch custom prompts via API
 */
async function fetchCustomPrompts(userId: string): Promise<CustomCommandPrompt[] | null> {
  try {
    const response = await fetch(`/api/users/${userId}/custom-command-prompts`);

    if (!response.ok) {
      const error = await response.json();
      console.error('API Error:', error);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

/**
 * Clean up test prompts (removes all custom prompts)
 */
export async function cleanupTestPrompts(userId: string) {
  console.log('🧹 Cleaning up test prompts...');
  
  const success = await saveCustomPrompts(userId, []);
  if (success) {
    console.log('✅ Test prompts cleaned up successfully');
  } else {
    console.error('❌ Failed to clean up test prompts');
  }
}

/**
 * Alternative test function if user ID cannot be auto-detected
 */
export async function testCustomPromptsWithUserId(userId: string) {
  // Temporarily override getUserId to return the provided userId
  const originalGetUserId = getUserId;
  (window as any).getUserId = async () => userId;
  
  await testCustomPrompts();
  
  // Restore original
  (window as any).getUserId = originalGetUserId;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testCustomPrompts = testCustomPrompts;
  (window as any).testCustomPromptsWithUserId = testCustomPromptsWithUserId;
  (window as any).cleanupTestPrompts = cleanupTestPrompts;
}

console.log('✅ Custom Prompts Test Utility Loaded');
console.log('Run: testCustomPrompts()');

