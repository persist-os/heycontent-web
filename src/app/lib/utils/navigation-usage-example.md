# Navigation Utils Usage Guide

## Overview
The navigation utility functions have been refactored to fix React hooks rules violations. There are now two ways to use them:

## Option 1: Using the Custom Hook (Recommended for React Components)

```typescript
import { useNavigationUtils } from '@/app/lib/utils/navigation-hooks';

function MyComponent() {
  const { 
    navigateToChatWithInsight, 
    navigateToChatWithActionStep, 
    navigateToChatWithContentHubInsight 
  } = useNavigationUtils();

  const handleInsightClick = () => {
    navigateToChatWithInsight(
      {
        title: "YouTube Growth Opportunity",
        impact: "Increase subscriber engagement by 25%",
        whyNow: ["Trending topic", "High engagement window"],
        actionSteps: ["Create video series", "Optimize thumbnails"],
        expectedOutcome: "Higher subscriber retention",
        sourceDetails: ["Analytics data from last 30 days"]
      },
      'youtube'
    );
  };

  return (
    <button onClick={handleInsightClick}>
      Navigate to Chat with Insight
    </button>
  );
}
```

## Option 2: Using the Utility Functions Directly

```typescript
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { navigateToChatWithInsight } from '@/app/lib/utils/navigation-utils';

function MyComponent() {
  const contextActions = useContentContextActions();
  const router = useRouter();

  const handleInsightClick = () => {
    navigateToChatWithInsight(
      {
        title: "YouTube Growth Opportunity",
        impact: "Increase subscriber engagement by 25%",
        whyNow: ["Trending topic", "High engagement window"],
        actionSteps: ["Create video series", "Optimize thumbnails"],
        expectedOutcome: "Higher subscriber retention",
        sourceDetails: ["Analytics data from last 30 days"]
      },
      'youtube',
      contextActions,
      router
    );
  };

  return (
    <button onClick={handleInsightClick}>
      Navigate to Chat with Insight
    </button>
  );
}
```

## Benefits of the Refactoring

1. **Hooks Rules Compliance**: Functions no longer violate React hooks rules
2. **Better Testability**: Pure functions are easier to test
3. **Flexibility**: Can be used in non-React contexts if needed
4. **Separation of Concerns**: Hook calls are separated from business logic
5. **Type Safety**: Better TypeScript support with explicit interfaces

## Migration Guide

If you were previously using these functions, you need to:

1. **Option A**: Replace direct function calls with the `useNavigationUtils` hook
2. **Option B**: Pass the required hooks as parameters to the utility functions

Choose Option A for most React component use cases as it's simpler and more convenient. 