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
import type * as ambientInsights from "../ambientInsights.js";
import type * as apiKeys from "../apiKeys.js";
import type * as apiKeysMutations from "../apiKeysMutations.js";
import type * as apiKeysQueries from "../apiKeysQueries.js";
import type * as auth from "../auth.js";
import type * as chatMutations from "../chatMutations.js";
import type * as chatQueries from "../chatQueries.js";
import type * as contentHub from "../contentHub.js";
import type * as embeddingSystem from "../embeddingSystem.js";
import type * as feedback from "../feedback.js";
import type * as gmailMutations from "../gmailMutations.js";
import type * as gmailQueries from "../gmailQueries.js";
import type * as http from "../http.js";
import type * as instagramMutations from "../instagramMutations.js";
import type * as instagramQueries from "../instagramQueries.js";
import type * as internal_ from "../internal.js";
import type * as noteMutations from "../noteMutations.js";
import type * as noteQueries from "../noteQueries.js";
import type * as notes from "../notes.js";
import type * as personaQueries from "../personaQueries.js";
import type * as personas from "../personas.js";
import type * as platformRouter from "../platformRouter.js";
import type * as priceConfig from "../priceConfig.js";
import type * as projectsMutations from "../projectsMutations.js";
import type * as projectsQueries from "../projectsQueries.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as referrals from "../referrals.js";
import type * as setAdminRole from "../setAdminRole.js";
import type * as subscriptionActions from "../subscriptionActions.js";
import type * as subscriptionQueries from "../subscriptionQueries.js";
import type * as timelineQueries from "../timelineQueries.js";
import type * as usageEvents from "../usageEvents.js";
import type * as userActions from "../userActions.js";
import type * as userMutations from "../userMutations.js";
import type * as userQueries from "../userQueries.js";
import type * as vectorSearch from "../vectorSearch.js";
import type * as waitlist from "../waitlist.js";
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
  ambientInsights: typeof ambientInsights;
  apiKeys: typeof apiKeys;
  apiKeysMutations: typeof apiKeysMutations;
  apiKeysQueries: typeof apiKeysQueries;
  auth: typeof auth;
  chatMutations: typeof chatMutations;
  chatQueries: typeof chatQueries;
  contentHub: typeof contentHub;
  embeddingSystem: typeof embeddingSystem;
  feedback: typeof feedback;
  gmailMutations: typeof gmailMutations;
  gmailQueries: typeof gmailQueries;
  http: typeof http;
  instagramMutations: typeof instagramMutations;
  instagramQueries: typeof instagramQueries;
  internal: typeof internal_;
  noteMutations: typeof noteMutations;
  noteQueries: typeof noteQueries;
  notes: typeof notes;
  personaQueries: typeof personaQueries;
  personas: typeof personas;
  platformRouter: typeof platformRouter;
  priceConfig: typeof priceConfig;
  projectsMutations: typeof projectsMutations;
  projectsQueries: typeof projectsQueries;
  rateLimiting: typeof rateLimiting;
  referrals: typeof referrals;
  setAdminRole: typeof setAdminRole;
  subscriptionActions: typeof subscriptionActions;
  subscriptionQueries: typeof subscriptionQueries;
  timelineQueries: typeof timelineQueries;
  usageEvents: typeof usageEvents;
  userActions: typeof userActions;
  userMutations: typeof userMutations;
  userQueries: typeof userQueries;
  vectorSearch: typeof vectorSearch;
  waitlist: typeof waitlist;
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
