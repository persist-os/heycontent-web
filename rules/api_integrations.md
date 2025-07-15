# API Integration Rules

This document outlines the architecture and conventions for integrating third-party services (e.g., Gmail, YouTube, Instagram) into the HeyContent application.

---

## 1. Core Architecture: OAuth 2.0 Proxy

All third-party integrations that require user-delegated access **must** follow the OAuth 2.0 Authorization Code flow. The Next.js application acts as a secure backend-for-frontend (BFF) that orchestrates this flow, ensuring that sensitive credentials like client secrets and access tokens are never exposed to the client.

The integration logic is structured within the `src/app/api/social/` directory.

---

## 2. Integration Flow & Directory Structure

Adding a new integration (e.g., "NewService") must follow this standard flow and directory structure.

### Step 1: Authorization Request

-   The user initiates the connection from the frontend (e.g., in the Settings screen).
-   The frontend redirects the user to the third-party service's OAuth 2.0 authorization page. This may be done by calling a dedicated API route (e.g., `/api/social/newservice/auth-url`) that constructs the correct authorization URL with the necessary scopes and a `redirect_uri`.

### Step 2: Callback Handling

-   After the user grants permission, the third-party service redirects back to a dedicated callback URL within our application.
-   **Convention**: A new callback handler must be created at `src/app/api/social/callback/newservice/route.ts`.
-   **Responsibilities**: This route is responsible for:
    1.  Receiving the temporary `authorization_code` from the service.
    2.  Exchanging the `code` for an `access_token` and a `refresh_token`. This must be done on the server to protect the application's `client_secret`.
    3.  Securely storing the tokens, associating them with the logged-in HeyContent user.

### Step 3: API Interaction

-   Once tokens are stored, the application can make API calls on behalf of the user.
-   **Convention**: All API interactions for a service must be encapsulated in their own API routes within a dedicated directory: `src/app/api/social/newservice/`.
-   **Example**: To fetch analytics, create an endpoint at `/api/social/newservice/analyze/route.ts`. This route retrieves the user's stored tokens, makes the request to the third-party API, and returns the data to the HeyContent frontend.

### Step 4: Token Refresh

-   Access tokens are short-lived. A mechanism to refresh them is required.
-   **Convention**: Each integration must have a `refresh` endpoint at `/api/social/newservice/refresh/route.ts`.
-   **Responsibility**: This endpoint uses the long-lived `refresh_token` to request a new `access_token` from the third-party service and updates the stored credentials.

### Step 5: Disconnection

-   Users must be able to disconnect a third-party service.
-   **Convention**: The global `/api/social/disconnect/route.ts` endpoint should be used.
-   **Responsibility**: This route takes a parameter identifying the service to disconnect (e.g., `{ service: 'newservice' }`). It should:
    1.  (Optional but recommended) Make an API call to the third-party service to revoke the token.
    2.  Delete the stored tokens from the database.

---

## 3. Summary of Conventions

-   **Directory Structure**: Each service gets a folder in `src/app/api/social/` and `src/app/api/social/callback/`.
-   **Proxy Pattern**: The Next.js API routes act as a secure proxy. The frontend never handles tokens or secrets.
-   **Standard Endpoints**: Follow the standard endpoint naming for `callback`, `refresh`, `disconnect`, and specific actions (e.g., `analyze`).
-   **Security**: All token exchanges and API calls involving secrets must happen server-side within the API routes. 