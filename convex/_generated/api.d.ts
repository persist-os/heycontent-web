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
import type * as contentAccessHelpers from "../contentAccessHelpers.js";
import type * as contentSharingMutations from "../contentSharingMutations.js";
import type * as contentSharingQueries from "../contentSharingQueries.js";
import type * as conversationSummariesMutations from "../conversationSummariesMutations.js";
import type * as conversationSummariesQueries from "../conversationSummariesQueries.js";
import type * as crons from "../crons.js";
import type * as crystalCache from "../crystalCache.js";
import type * as crystalContextOptimized from "../crystalContextOptimized.js";
import type * as crystalMutations from "../crystalMutations.js";
import type * as crystalQueries from "../crystalQueries.js";
import type * as embeddingSystem from "../embeddingSystem.js";
import type * as feedback from "../feedback.js";
import type * as fingerprintEvolutionMutations from "../fingerprintEvolutionMutations.js";
import type * as fingerprintEvolutionQueries from "../fingerprintEvolutionQueries.js";
import type * as fingerprintMutations from "../fingerprintMutations.js";
import type * as fingerprintQueries from "../fingerprintQueries.js";
import type * as folderMutations from "../folderMutations.js";
import type * as folderQueries from "../folderQueries.js";
import type * as formationMutations from "../formationMutations.js";
import type * as formationQueries from "../formationQueries.js";
import type * as friendshipMutations from "../friendshipMutations.js";
import type * as friendshipQueries from "../friendshipQueries.js";
import type * as http from "../http.js";
import type * as internal_ from "../internal.js";
import type * as migrations from "../migrations.js";
import type * as noteMutations from "../noteMutations.js";
import type * as noteQueries from "../noteQueries.js";
import type * as noteSharing from "../noteSharing.js";
import type * as notes from "../notes.js";
import type * as operationalTransform from "../operationalTransform.js";
import type * as paginatedQueries from "../paginatedQueries.js";
import type * as platformRouter from "../platformRouter.js";
import type * as presence from "../presence.js";
import type * as priceConfig from "../priceConfig.js";
import type * as projectFingerprintMutations from "../projectFingerprintMutations.js";
import type * as projectFingerprintQueries from "../projectFingerprintQueries.js";
import type * as projectWidgetsMutations from "../projectWidgetsMutations.js";
import type * as projectWidgetsQueries from "../projectWidgetsQueries.js";
import type * as projectsMutations from "../projectsMutations.js";
import type * as projectsQueries from "../projectsQueries.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as referrals from "../referrals.js";
import type * as setAdminRole from "../setAdminRole.js";
import type * as shardLifecycleMutations from "../shardLifecycleMutations.js";
import type * as shardLifecycleQueries from "../shardLifecycleQueries.js";
import type * as subscriptionActions from "../subscriptionActions.js";
import type * as subscriptionQueries from "../subscriptionQueries.js";
import type * as textOperations from "../textOperations.js";
import type * as timelineQueries from "../timelineQueries.js";
import type * as usageEvents from "../usageEvents.js";
import type * as userActions from "../userActions.js";
import type * as userMutations from "../userMutations.js";
import type * as userQueries from "../userQueries.js";
import type * as utils_idValidation from "../utils/idValidation.js";
import type * as utils_types from "../utils/types.js";
import type * as vectorSearch from "../vectorSearch.js";
import type * as vectorSearchBatch from "../vectorSearchBatch.js";
import type * as vectorSearchEmbeddings from "../vectorSearchEmbeddings.js";
import type * as vectorSearchHelpers from "../vectorSearchHelpers.js";
import type * as vectorSearchMutations from "../vectorSearchMutations.js";
import type * as vectorSearchQueries from "../vectorSearchQueries.js";

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
  contentAccessHelpers: typeof contentAccessHelpers;
  contentSharingMutations: typeof contentSharingMutations;
  contentSharingQueries: typeof contentSharingQueries;
  conversationSummariesMutations: typeof conversationSummariesMutations;
  conversationSummariesQueries: typeof conversationSummariesQueries;
  crons: typeof crons;
  crystalCache: typeof crystalCache;
  crystalContextOptimized: typeof crystalContextOptimized;
  crystalMutations: typeof crystalMutations;
  crystalQueries: typeof crystalQueries;
  embeddingSystem: typeof embeddingSystem;
  feedback: typeof feedback;
  fingerprintEvolutionMutations: typeof fingerprintEvolutionMutations;
  fingerprintEvolutionQueries: typeof fingerprintEvolutionQueries;
  fingerprintMutations: typeof fingerprintMutations;
  fingerprintQueries: typeof fingerprintQueries;
  folderMutations: typeof folderMutations;
  folderQueries: typeof folderQueries;
  formationMutations: typeof formationMutations;
  formationQueries: typeof formationQueries;
  friendshipMutations: typeof friendshipMutations;
  friendshipQueries: typeof friendshipQueries;
  http: typeof http;
  internal: typeof internal_;
  migrations: typeof migrations;
  noteMutations: typeof noteMutations;
  noteQueries: typeof noteQueries;
  noteSharing: typeof noteSharing;
  notes: typeof notes;
  operationalTransform: typeof operationalTransform;
  paginatedQueries: typeof paginatedQueries;
  platformRouter: typeof platformRouter;
  presence: typeof presence;
  priceConfig: typeof priceConfig;
  projectFingerprintMutations: typeof projectFingerprintMutations;
  projectFingerprintQueries: typeof projectFingerprintQueries;
  projectWidgetsMutations: typeof projectWidgetsMutations;
  projectWidgetsQueries: typeof projectWidgetsQueries;
  projectsMutations: typeof projectsMutations;
  projectsQueries: typeof projectsQueries;
  rateLimiting: typeof rateLimiting;
  referrals: typeof referrals;
  setAdminRole: typeof setAdminRole;
  shardLifecycleMutations: typeof shardLifecycleMutations;
  shardLifecycleQueries: typeof shardLifecycleQueries;
  subscriptionActions: typeof subscriptionActions;
  subscriptionQueries: typeof subscriptionQueries;
  textOperations: typeof textOperations;
  timelineQueries: typeof timelineQueries;
  usageEvents: typeof usageEvents;
  userActions: typeof userActions;
  userMutations: typeof userMutations;
  userQueries: typeof userQueries;
  "utils/idValidation": typeof utils_idValidation;
  "utils/types": typeof utils_types;
  vectorSearch: typeof vectorSearch;
  vectorSearchBatch: typeof vectorSearchBatch;
  vectorSearchEmbeddings: typeof vectorSearchEmbeddings;
  vectorSearchHelpers: typeof vectorSearchHelpers;
  vectorSearchMutations: typeof vectorSearchMutations;
  vectorSearchQueries: typeof vectorSearchQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
