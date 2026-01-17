# Authentication Rules

This document outlines the authentication and authorization architecture for the HeyContext web application. The system is designed to provide seamless and secure access for both interactive user sessions and programmatic API requests.

---

## 1. Core Principles

1.  **Dual Credential System**: The application uses two types of credentials:
    -   **Firebase ID Tokens**: Short-lived JWTs issued by Firebase upon login. Their only purpose is to authenticate the user's session to generate or refresh a long-lived HeyContext API key.
    -   **HeyContext API Keys**: Long-lived, custom-formatted API keys that are used to authenticate all subsequent API requests from the client.

2.  **Client-Side Abstraction**: All logic for retrieving and refreshing the API key is handled by the `getApiKey()` function in `src/app/lib/api-helpers.ts`. Components and services should **never** manage API keys directly.

3.  **Server-Side Trust**: The server trusts the HeyContext API Key as the primary method of authentication for ongoing requests after the initial session is established.

---

## 2. API Key Lifecycle & Format

### Key Format

The HeyContext API key follows a strict format: `heycontext_<userId>_<random_string>`
-   `heycontext_`: A static prefix.
-   `<userId>`: The user's unique Firebase UID. This is critical for validation.
-   `<random_string>`: A securely generated random string from the backend.

### Key Management Flow

The entire lifecycle is managed by `getApiKey()` in `src/app/lib/api-helpers.ts`.

1.  **Request**: When a client-side function needs to make an authenticated request, it calls `getApiKey()`.
2.  **Retrieval**: The function first attempts to retrieve the key from a browser cookie named `apiKey`.
3.  **Validation**: If a key exists in the cookie, it is validated:
    -   **Format Check**: It ensures the key starts with `heycontext_`.
    -   **User Match**: It extracts the `<userId>` from the key and compares it against the currently logged-in Firebase user's ID. If they do not match, the key is considered invalid and discarded.
4.  **Automatic Refresh**: If no valid key is found in the cookie (either because it's missing, expired, or belongs to a different user), the function automatically performs a refresh:
    -   It obtains a fresh Firebase `idToken` for the current user.
    -   It sends this `idToken` to the `/api/auth/key` endpoint.
    -   This endpoint proxies the request to the secure backend, which validates the `idToken` and returns a new, valid HeyContext API key.
5.  **Storage**: Upon receiving a new key, `getApiKey()` stores it in the `apiKey` cookie with a 7-day expiration.
6.  **Return**: The function returns the valid API key.

---

## 3. Making Authenticated Requests

All client-side API requests to the application's backend **must** use the `fetchWithApiKey` helper function from `src/app/lib/api-helpers.ts`.

```typescript
import { fetchWithApiKey } from '@/app/lib/api-helpers';

async function someApiCall() {
  const response = await fetchWithApiKey('/api/some/endpoint', {
    method: 'POST',
    body: JSON.stringify({ some: 'data' }),
  });
  // ...
}
```

This function handles the entire process:
-   It calls `getApiKey()` to retrieve a valid key, triggering a refresh if necessary.
-   It automatically includes the key in the `Authorization: Bearer <apiKey>` header.

---

## 4. Core Files

-   **`src/app/lib/api-helpers.ts`**: Contains the essential client-side auth functions:
    -   `getApiKey()`: The single source of truth for retrieving a valid API key.
    -   `fetchWithApiKey()`: The required helper for making authenticated API calls.
-   **`src/app/lib/server-auth.ts`**: Contains server-side validation logic, primarily `getServerSession`, which reads the `Authorization` header and validates the token.
-   **`src/app/auth/`**: Contains all UI components for login, registration, etc. These components interact with the client-side Firebase SDK.
-   **`/api/auth/key/route.ts`**: The Next.js proxy route that facilitates the API key refresh mechanism.