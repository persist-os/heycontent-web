/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as apiKeys from "../apiKeys.js";
import type * as apiKeysMutations from "../apiKeysMutations.js";
import type * as apiKeysQueries from "../apiKeysQueries.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as notes from "../notes.js";
import type * as personas from "../personas.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as users from "../users.js";
import type * as youtubeActions from "../youtubeActions.js";
import type * as youtubeMutations from "../youtubeMutations.js";
import type * as youtubeQueries from "../youtubeQueries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  apiKeys: typeof apiKeys;
  apiKeysMutations: typeof apiKeysMutations;
  apiKeysQueries: typeof apiKeysQueries;
  auth: typeof auth;
  chat: typeof chat;
  http: typeof http;
  internal: typeof internal_;
  notes: typeof notes;
  personas: typeof personas;
  rateLimiting: typeof rateLimiting;
  users: typeof users;
  youtubeActions: typeof youtubeActions;
  youtubeMutations: typeof youtubeMutations;
  youtubeQueries: typeof youtubeQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
