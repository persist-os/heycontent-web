# Gmail Batch Refresh: Simple Consistent Approach

This guide describes how to implement a refresh system for Gmail that is **as consistent as possible** with Instagram and YouTube, without overengineering. The goal is to provide a unified, user-friendly experience and keep the codebase DRY and easy to maintain.

---

## 1. Core Principle: Consistency & Simplicity

- Use the **same refresh button UI and logic** as Instagram and YouTube.
- Place the button in the same spot, with the same style and feedback (spinner, error, disabled state).
- Use a single async refresh handler pattern for all platforms.
- Avoid unnecessary abstractions—only extract a hook if it saves real duplication.

---

## 2. Implementation Steps

### Step 1: Backend Endpoint
- Ensure there is a backend endpoint for Gmail refresh (e.g., `/api/social/gmail/refresh`).
- This endpoint should trigger a background sync for Gmail and return a status (success/error).

### Step 2: Frontend Refresh Logic
- In the Gmail platform component:
  - Add a `refresh` function and `refreshing` state (just like Instagram/YouTube).
  - Add a refresh button in the header area:
    ```tsx
    <Button onClick={refresh} disabled={refreshing}>
      <RefreshCw className={refreshing ? 'animate-spin' : ''} />
      {refreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
    ```
  - On click, call the `refresh` function, which POSTs to `/api/social/gmail/refresh` with the user ID.
  - Show spinner and disable the button while refreshing.
  - Show error message if refresh fails.
  - After refresh, trigger a data refetch (using your data fetching hook or SWR/React Query).

### Step 3: (Optional) Reusable Hook
- If you want to DRY up the code, create a simple `usePlatformRefresh(endpoint, userId)` hook:
    ```tsx
    import { useState } from 'react';
    export function usePlatformRefresh(endpoint, userId) {
      const [refreshing, setRefreshing] = useState(false);
      const [error, setError] = useState(null);
      const refresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({ userId }),
          });
          const data = await res.json();
          if (!res.ok || data.status !== 'success') {
            setError(data.error || 'Failed to refresh.');
          }
        } catch (e) {
          setError(e.message || 'Unknown error');
        } finally {
          setRefreshing(false);
        }
      };
      return { refresh, refreshing, error };
    }
    ```
- Use this hook in Gmail, Instagram, and YouTube for maximum consistency.

---

## 3. User Experience
- Users get the **same refresh experience** on all platforms.
- No extra learning curve; the UI and feedback are always familiar.
- The codebase is easier to maintain and extend.

---

## 4. Summary Table

| Feature/Pattern         | Instagram | YouTube | Gmail (Proposed) |
|------------------------|-----------|---------|------------------|
| Refresh button         | Yes       | Yes     | Yes              |
| Spinner/disabled state | Yes       | Yes     | Yes              |
| Error feedback         | Yes       | Yes     | Yes              |
| Async refresh handler  | Yes       | Yes     | Yes              |
| Data refetch after     | Yes       | Yes     | Yes              |
| Custom hook possible   | Yes       | Yes     | Yes              |

---

**Keep it simple, keep it consistent.**

