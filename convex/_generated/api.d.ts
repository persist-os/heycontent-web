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
import type * as backgroundJobs from "../backgroundJobs.js";
import type * as briefingRoomHelpers from "../briefingRoomHelpers.js";
import type * as briefingRoomInternal from "../briefingRoomInternal.js";
import type * as briefingRoomMutations from "../briefingRoomMutations.js";
import type * as briefingRoomQueries from "../briefingRoomQueries.js";
import type * as briefingRoomTestData from "../briefingRoomTestData.js";
import type * as chatMutations from "../chatMutations.js";
import type * as chatQueries from "../chatQueries.js";
import type * as chatgptImport from "../chatgptImport.js";
import type * as contentAccessHelpers from "../contentAccessHelpers.js";
import type * as contentSharingMutations from "../contentSharingMutations.js";
import type * as contentSharingQueries from "../contentSharingQueries.js";
import type * as contextEnrichmentBandit from "../contextEnrichmentBandit.js";
import type * as convergenceConfigMutations from "../convergenceConfigMutations.js";
import type * as convergenceConfigQueries from "../convergenceConfigQueries.js";
import type * as convergenceCurrentConfigMutations from "../convergenceCurrentConfigMutations.js";
import type * as convergenceCurrentConfigQueries from "../convergenceCurrentConfigQueries.js";
import type * as convergenceMutations from "../convergenceMutations.js";
import type * as convergencePresetMutations from "../convergencePresetMutations.js";
import type * as convergencePresetQueries from "../convergencePresetQueries.js";
import type * as convergenceQueries from "../convergenceQueries.js";
import type * as convergenceStorageMutations from "../convergenceStorageMutations.js";
import type * as convergenceStorageQueries from "../convergenceStorageQueries.js";
import type * as conversationSummariesMutations from "../conversationSummariesMutations.js";
import type * as conversationSummariesQueries from "../conversationSummariesQueries.js";
import type * as crons from "../crons.js";
import type * as crystalAtomicMutations from "../crystalAtomicMutations.js";
import type * as crystalCache from "../crystalCache.js";
import type * as crystalContextOptimized from "../crystalContextOptimized.js";
import type * as crystalMigration from "../crystalMigration.js";
import type * as crystalMutations from "../crystalMutations.js";
import type * as crystalQueries from "../crystalQueries.js";
import type * as feedback from "../feedback.js";
import type * as fingerprintSignalsMutations from "../fingerprintSignalsMutations.js";
import type * as fingerprintSignalsQueries from "../fingerprintSignalsQueries.js";
import type * as folderMutations from "../folderMutations.js";
import type * as folderQueries from "../folderQueries.js";
import type * as formationMutations from "../formationMutations.js";
import type * as formationQueries from "../formationQueries.js";
import type * as friendshipMutations from "../friendshipMutations.js";
import type * as friendshipQueries from "../friendshipQueries.js";
import type * as http from "../http.js";
import type * as intelligenceActions from "../intelligenceActions.js";
import type * as intelligenceBandit from "../intelligenceBandit.js";
import type * as intelligenceConfig from "../intelligenceConfig.js";
import type * as intelligenceMutations from "../intelligenceMutations.js";
import type * as intelligenceQueries from "../intelligenceQueries.js";
import type * as internal_ from "../internal.js";
import type * as lib_hash from "../lib/hash.js";
import type * as messagesMutations from "../messagesMutations.js";
import type * as messagesQueries from "../messagesQueries.js";
import type * as migrations_migrateConversationMessages from "../migrations/migrateConversationMessages.js";
import type * as migrations_migrateReservedShards from "../migrations/migrateReservedShards.js";
import type * as migrations_migrateToConvexWidgetIds from "../migrations/migrateToConvexWidgetIds.js";
import type * as migrations_migrateWidgetsToIndividualDocs from "../migrations/migrateWidgetsToIndividualDocs.js";
import type * as migrations_runMigration from "../migrations/runMigration.js";
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
import type * as projectContentQueries from "../projectContentQueries.js";
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
import type * as shardStatusManager from "../shardStatusManager.js";
import type * as stardustMutations from "../stardustMutations.js";
import type * as stardustQueries from "../stardustQueries.js";
import type * as subscriptionActions from "../subscriptionActions.js";
import type * as subscriptionPlansMutations from "../subscriptionPlansMutations.js";
import type * as subscriptionPlansQueries from "../subscriptionPlansQueries.js";
import type * as subscriptionQueries from "../subscriptionQueries.js";
import type * as textOperations from "../textOperations.js";
import type * as timelineQueries from "../timelineQueries.js";
import type * as translationMutations from "../translationMutations.js";
import type * as translationQueries from "../translationQueries.js";
import type * as types_backgroundJobs from "../types/backgroundJobs.js";
import type * as types_convergence from "../types/convergence.js";
import type * as types_convergenceStorage from "../types/convergenceStorage.js";
import type * as types_crystal from "../types/crystal.js";
import type * as types_index from "../types/index.js";
import type * as types_intelligenceBandit from "../types/intelligenceBandit.js";
import type * as types_stardust from "../types/stardust.js";
import type * as types_translation from "../types/translation.js";
import type * as types_user from "../types/user.js";
import type * as usageEvents from "../usageEvents.js";
import type * as userActions from "../userActions.js";
import type * as userMutations from "../userMutations.js";
import type * as userQueries from "../userQueries.js";
import type * as vectorSearch from "../vectorSearch.js";
import type * as vectorSearchBatch from "../vectorSearchBatch.js";
import type * as vectorSearchMutations from "../vectorSearchMutations.js";
import type * as vectorSearchQueries from "../vectorSearchQueries.js";
import type * as webhookEvents from "../webhookEvents.js";
import type * as widgetContentMutations from "../widgetContentMutations.js";
import type * as widgetOutputsMutations from "../widgetOutputsMutations.js";
import type * as widgetOutputsQueries from "../widgetOutputsQueries.js";
import type * as widgets from "../widgets.js";
import type * as widgetsMutations from "../widgetsMutations.js";
import type * as widgetsQueries from "../widgetsQueries.js";

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
  backgroundJobs: typeof backgroundJobs;
  briefingRoomHelpers: typeof briefingRoomHelpers;
  briefingRoomInternal: typeof briefingRoomInternal;
  briefingRoomMutations: typeof briefingRoomMutations;
  briefingRoomQueries: typeof briefingRoomQueries;
  briefingRoomTestData: typeof briefingRoomTestData;
  chatMutations: typeof chatMutations;
  chatQueries: typeof chatQueries;
  chatgptImport: typeof chatgptImport;
  contentAccessHelpers: typeof contentAccessHelpers;
  contentSharingMutations: typeof contentSharingMutations;
  contentSharingQueries: typeof contentSharingQueries;
  contextEnrichmentBandit: typeof contextEnrichmentBandit;
  convergenceConfigMutations: typeof convergenceConfigMutations;
  convergenceConfigQueries: typeof convergenceConfigQueries;
  convergenceCurrentConfigMutations: typeof convergenceCurrentConfigMutations;
  convergenceCurrentConfigQueries: typeof convergenceCurrentConfigQueries;
  convergenceMutations: typeof convergenceMutations;
  convergencePresetMutations: typeof convergencePresetMutations;
  convergencePresetQueries: typeof convergencePresetQueries;
  convergenceQueries: typeof convergenceQueries;
  convergenceStorageMutations: typeof convergenceStorageMutations;
  convergenceStorageQueries: typeof convergenceStorageQueries;
  conversationSummariesMutations: typeof conversationSummariesMutations;
  conversationSummariesQueries: typeof conversationSummariesQueries;
  crons: typeof crons;
  crystalAtomicMutations: typeof crystalAtomicMutations;
  crystalCache: typeof crystalCache;
  crystalContextOptimized: typeof crystalContextOptimized;
  crystalMigration: typeof crystalMigration;
  crystalMutations: typeof crystalMutations;
  crystalQueries: typeof crystalQueries;
  feedback: typeof feedback;
  fingerprintSignalsMutations: typeof fingerprintSignalsMutations;
  fingerprintSignalsQueries: typeof fingerprintSignalsQueries;
  folderMutations: typeof folderMutations;
  folderQueries: typeof folderQueries;
  formationMutations: typeof formationMutations;
  formationQueries: typeof formationQueries;
  friendshipMutations: typeof friendshipMutations;
  friendshipQueries: typeof friendshipQueries;
  http: typeof http;
  intelligenceActions: typeof intelligenceActions;
  intelligenceBandit: typeof intelligenceBandit;
  intelligenceConfig: typeof intelligenceConfig;
  intelligenceMutations: typeof intelligenceMutations;
  intelligenceQueries: typeof intelligenceQueries;
  internal: typeof internal_;
  "lib/hash": typeof lib_hash;
  messagesMutations: typeof messagesMutations;
  messagesQueries: typeof messagesQueries;
  "migrations/migrateConversationMessages": typeof migrations_migrateConversationMessages;
  "migrations/migrateReservedShards": typeof migrations_migrateReservedShards;
  "migrations/migrateToConvexWidgetIds": typeof migrations_migrateToConvexWidgetIds;
  "migrations/migrateWidgetsToIndividualDocs": typeof migrations_migrateWidgetsToIndividualDocs;
  "migrations/runMigration": typeof migrations_runMigration;
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
  projectContentQueries: typeof projectContentQueries;
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
  shardStatusManager: typeof shardStatusManager;
  stardustMutations: typeof stardustMutations;
  stardustQueries: typeof stardustQueries;
  subscriptionActions: typeof subscriptionActions;
  subscriptionPlansMutations: typeof subscriptionPlansMutations;
  subscriptionPlansQueries: typeof subscriptionPlansQueries;
  subscriptionQueries: typeof subscriptionQueries;
  textOperations: typeof textOperations;
  timelineQueries: typeof timelineQueries;
  translationMutations: typeof translationMutations;
  translationQueries: typeof translationQueries;
  "types/backgroundJobs": typeof types_backgroundJobs;
  "types/convergence": typeof types_convergence;
  "types/convergenceStorage": typeof types_convergenceStorage;
  "types/crystal": typeof types_crystal;
  "types/index": typeof types_index;
  "types/intelligenceBandit": typeof types_intelligenceBandit;
  "types/stardust": typeof types_stardust;
  "types/translation": typeof types_translation;
  "types/user": typeof types_user;
  usageEvents: typeof usageEvents;
  userActions: typeof userActions;
  userMutations: typeof userMutations;
  userQueries: typeof userQueries;
  vectorSearch: typeof vectorSearch;
  vectorSearchBatch: typeof vectorSearchBatch;
  vectorSearchMutations: typeof vectorSearchMutations;
  vectorSearchQueries: typeof vectorSearchQueries;
  webhookEvents: typeof webhookEvents;
  widgetContentMutations: typeof widgetContentMutations;
  widgetOutputsMutations: typeof widgetOutputsMutations;
  widgetOutputsQueries: typeof widgetOutputsQueries;
  widgets: typeof widgets;
  widgetsMutations: typeof widgetsMutations;
  widgetsQueries: typeof widgetsQueries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
