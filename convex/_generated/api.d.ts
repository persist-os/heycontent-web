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
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as gmail from "../gmail.js";
import type * as internal_ from "../internal.js";
import type * as notes from "../notes.js";
import type * as personas from "../personas.js";
import type * as query from "../query.js";
import type * as social from "../social.js";
import type * as users from "../users.js";
import type * as youtube from "../youtube.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  chat: typeof chat;
  gmail: typeof gmail;
  internal: typeof internal_;
  notes: typeof notes;
  personas: typeof personas;
  query: typeof query;
  social: typeof social;
  users: typeof users;
  youtube: typeof youtube;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
