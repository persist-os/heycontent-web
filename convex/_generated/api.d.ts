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
import type * as backfillInstagramTokenUsernames from "../backfillInstagramTokenUsernames.js";
import type * as chatMutations from "../chatMutations.js";
import type * as chatQueries from "../chatQueries.js";
import type * as debug from "../debug.js";
import type * as gmailMutations from "../gmailMutations.js";
import type * as gmailQueries from "../gmailQueries.js";
import type * as http from "../http.js";
import type * as instagramMutations from "../instagramMutations.js";
import type * as instagramQueries from "../instagramQueries.js";
import type * as intelligentContextQueries from "../intelligentContextQueries.js";
import type * as internal_ from "../internal.js";
import type * as notes from "../notes.js";
import type * as personaQueries from "../personaQueries.js";
import type * as personas from "../personas.js";
import type * as priceConfig from "../priceConfig.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as subscriptionActions from "../subscriptionActions.js";
import type * as subscriptionQueries from "../subscriptionQueries.js";
import type * as usageEvents from "../usageEvents.js";
import type * as userMutations from "../userMutations.js";
import type * as userQueries from "../userQueries.js";
import type * as usersFilesMutations from "../usersFilesMutations.js";
import type * as usersFilesQueries from "../usersFilesQueries.js";
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
  backfillInstagramTokenUsernames: typeof backfillInstagramTokenUsernames;
  chatMutations: typeof chatMutations;
  chatQueries: typeof chatQueries;
  debug: typeof debug;
  gmailMutations: typeof gmailMutations;
  gmailQueries: typeof gmailQueries;
  http: typeof http;
  instagramMutations: typeof instagramMutations;
  instagramQueries: typeof instagramQueries;
  intelligentContextQueries: typeof intelligentContextQueries;
  internal: typeof internal_;
  notes: typeof notes;
  personaQueries: typeof personaQueries;
  personas: typeof personas;
  priceConfig: typeof priceConfig;
  rateLimiting: typeof rateLimiting;
  subscriptionActions: typeof subscriptionActions;
  subscriptionQueries: typeof subscriptionQueries;
  usageEvents: typeof usageEvents;
  userMutations: typeof userMutations;
  userQueries: typeof userQueries;
  usersFilesMutations: typeof usersFilesMutations;
  usersFilesQueries: typeof usersFilesQueries;
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
