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
import type * as analyses from "../analyses.js";
import type * as apiKeys from "../apiKeys.js";
import type * as apiKeysMutations from "../apiKeysMutations.js";
import type * as apiKeysQueries from "../apiKeysQueries.js";
import type * as backfillInstagramTokenUsernames from "../backfillInstagramTokenUsernames.js";
import type * as chatMutations from "../chatMutations.js";
import type * as chatQueries from "../chatQueries.js";
import type * as gmailMutations from "../gmailMutations.js";
import type * as gmailQueries from "../gmailQueries.js";
import type * as http from "../http.js";
import type * as http_actions_addMessageToConversation from "../http_actions/addMessageToConversation.js";
import type * as http_actions_addRateLimitRequest from "../http_actions/addRateLimitRequest.js";
import type * as http_actions_createAnalysis from "../http_actions/createAnalysis.js";
import type * as http_actions_createConversations from "../http_actions/createConversations.js";
import type * as http_actions_createNote from "../http_actions/createNote.js";
import type * as http_actions_createOrUpdateStripeCustomer from "../http_actions/createOrUpdateStripeCustomer.js";
import type * as http_actions_createPersona from "../http_actions/createPersona.js";
import type * as http_actions_createUser from "../http_actions/createUser.js";
import type * as http_actions_deleteApiKey from "../http_actions/deleteApiKey.js";
import type * as http_actions_deleteNote from "../http_actions/deleteNote.js";
import type * as http_actions_disconnectInstagram from "../http_actions/disconnectInstagram.js";
import type * as http_actions_getAnalysesByNote from "../http_actions/getAnalysesByNote.js";
import type * as http_actions_getAnalysesByUser from "../http_actions/getAnalysesByUser.js";
import type * as http_actions_getAnalysesByUserPlatform from "../http_actions/getAnalysesByUserPlatform.js";
import type * as http_actions_getGmailTokens from "../http_actions/getGmailTokens.js";
import type * as http_actions_getInstagramPost from "../http_actions/getInstagramPost.js";
import type * as http_actions_getInstagramPostComments from "../http_actions/getInstagramPostComments.js";
import type * as http_actions_getInstagramPostInsights from "../http_actions/getInstagramPostInsights.js";
import type * as http_actions_getInstagramTokens from "../http_actions/getInstagramTokens.js";
import type * as http_actions_getNote from "../http_actions/getNote.js";
import type * as http_actions_getNotesByUser from "../http_actions/getNotesByUser.js";
import type * as http_actions_getRateLimitData from "../http_actions/getRateLimitData.js";
import type * as http_actions_getStripeCustomer from "../http_actions/getStripeCustomer.js";
import type * as http_actions_getSubscriptionItem from "../http_actions/getSubscriptionItem.js";
import type * as http_actions_getUsageSummary from "../http_actions/getUsageSummary.js";
import type * as http_actions_getUserApiKeys from "../http_actions/getUserApiKeys.js";
import type * as http_actions_getUserByEmail from "../http_actions/getUserByEmail.js";
import type * as http_actions_getUserById from "../http_actions/getUserById.js";
import type * as http_actions_getUserPersona from "../http_actions/getUserPersona.js";
import type * as http_actions_getUserSubscription from "../http_actions/getUserSubscription.js";
import type * as http_actions_getYouTubeTokens from "../http_actions/getYouTubeTokens.js";
import type * as http_actions_getYouTubeVideoData from "../http_actions/getYouTubeVideoData.js";
import type * as http_actions_insertApiKey from "../http_actions/insertApiKey.js";
import type * as http_actions_linkAnalysisToNote from "../http_actions/linkAnalysisToNote.js";
import type * as http_actions_listUsers from "../http_actions/listUsers.js";
import type * as http_actions_logUsageEvent from "../http_actions/logUsageEvent.js";
import type * as http_actions_resetUsageForPeriod from "../http_actions/resetUsageForPeriod.js";
import type * as http_actions_saveGmailAccount from "../http_actions/saveGmailAccount.js";
import type * as http_actions_saveInstagramToken from "../http_actions/saveInstagramToken.js";
import type * as http_actions_saveSubscription from "../http_actions/saveSubscription.js";
import type * as http_actions_storeGmailFullProfile from "../http_actions/storeGmailFullProfile.js";
import type * as http_actions_storeInstagramPostsBulk from "../http_actions/storeInstagramPostsBulk.js";
import type * as http_actions_storeInstagramProfile from "../http_actions/storeInstagramProfile.js";
import type * as http_actions_storeYouTubeChannelData from "../http_actions/storeYouTubeChannelData.js";
import type * as http_actions_storeYouTubeFullProfile from "../http_actions/storeYouTubeFullProfile.js";
import type * as http_actions_storeYouTubeVideoAnalysis from "../http_actions/storeYouTubeVideoAnalysis.js";
import type * as http_actions_updateGmailToken from "../http_actions/updateGmailToken.js";
import type * as http_actions_updateInstagramToken from "../http_actions/updateInstagramToken.js";
import type * as http_actions_updateNote from "../http_actions/updateNote.js";
import type * as http_actions_updateStripeCustomer from "../http_actions/updateStripeCustomer.js";
import type * as http_actions_updateSubscriptionFromStripe from "../http_actions/updateSubscriptionFromStripe.js";
import type * as http_actions_updateUser from "../http_actions/updateUser.js";
import type * as http_actions_updateYouTubeToken from "../http_actions/updateYouTubeToken.js";
import type * as http_actions_validateApiKey from "../http_actions/validateApiKey.js";
import type * as instagramMutations from "../instagramMutations.js";
import type * as instagramQueries from "../instagramQueries.js";
import type * as internal_ from "../internal.js";
import type * as notes from "../notes.js";
import type * as personaQueries from "../personaQueries.js";
import type * as personas from "../personas.js";
import type * as rateLimiting from "../rateLimiting.js";
import type * as subscriptionActions from "../subscriptionActions.js";
import type * as subscriptionQueries from "../subscriptionQueries.js";
import type * as usageEvents from "../usageEvents.js";
import type * as userMutations from "../userMutations.js";
import type * as userQueries from "../userQueries.js";
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
  analyses: typeof analyses;
  apiKeys: typeof apiKeys;
  apiKeysMutations: typeof apiKeysMutations;
  apiKeysQueries: typeof apiKeysQueries;
  backfillInstagramTokenUsernames: typeof backfillInstagramTokenUsernames;
  chatMutations: typeof chatMutations;
  chatQueries: typeof chatQueries;
  gmailMutations: typeof gmailMutations;
  gmailQueries: typeof gmailQueries;
  http: typeof http;
  "http_actions/addMessageToConversation": typeof http_actions_addMessageToConversation;
  "http_actions/addRateLimitRequest": typeof http_actions_addRateLimitRequest;
  "http_actions/createAnalysis": typeof http_actions_createAnalysis;
  "http_actions/createConversations": typeof http_actions_createConversations;
  "http_actions/createNote": typeof http_actions_createNote;
  "http_actions/createOrUpdateStripeCustomer": typeof http_actions_createOrUpdateStripeCustomer;
  "http_actions/createPersona": typeof http_actions_createPersona;
  "http_actions/createUser": typeof http_actions_createUser;
  "http_actions/deleteApiKey": typeof http_actions_deleteApiKey;
  "http_actions/deleteNote": typeof http_actions_deleteNote;
  "http_actions/disconnectInstagram": typeof http_actions_disconnectInstagram;
  "http_actions/getAnalysesByNote": typeof http_actions_getAnalysesByNote;
  "http_actions/getAnalysesByUser": typeof http_actions_getAnalysesByUser;
  "http_actions/getAnalysesByUserPlatform": typeof http_actions_getAnalysesByUserPlatform;
  "http_actions/getGmailTokens": typeof http_actions_getGmailTokens;
  "http_actions/getInstagramPost": typeof http_actions_getInstagramPost;
  "http_actions/getInstagramPostComments": typeof http_actions_getInstagramPostComments;
  "http_actions/getInstagramPostInsights": typeof http_actions_getInstagramPostInsights;
  "http_actions/getInstagramTokens": typeof http_actions_getInstagramTokens;
  "http_actions/getNote": typeof http_actions_getNote;
  "http_actions/getNotesByUser": typeof http_actions_getNotesByUser;
  "http_actions/getRateLimitData": typeof http_actions_getRateLimitData;
  "http_actions/getStripeCustomer": typeof http_actions_getStripeCustomer;
  "http_actions/getSubscriptionItem": typeof http_actions_getSubscriptionItem;
  "http_actions/getUsageSummary": typeof http_actions_getUsageSummary;
  "http_actions/getUserApiKeys": typeof http_actions_getUserApiKeys;
  "http_actions/getUserByEmail": typeof http_actions_getUserByEmail;
  "http_actions/getUserById": typeof http_actions_getUserById;
  "http_actions/getUserPersona": typeof http_actions_getUserPersona;
  "http_actions/getUserSubscription": typeof http_actions_getUserSubscription;
  "http_actions/getYouTubeTokens": typeof http_actions_getYouTubeTokens;
  "http_actions/getYouTubeVideoData": typeof http_actions_getYouTubeVideoData;
  "http_actions/insertApiKey": typeof http_actions_insertApiKey;
  "http_actions/linkAnalysisToNote": typeof http_actions_linkAnalysisToNote;
  "http_actions/listUsers": typeof http_actions_listUsers;
  "http_actions/logUsageEvent": typeof http_actions_logUsageEvent;
  "http_actions/resetUsageForPeriod": typeof http_actions_resetUsageForPeriod;
  "http_actions/saveGmailAccount": typeof http_actions_saveGmailAccount;
  "http_actions/saveInstagramToken": typeof http_actions_saveInstagramToken;
  "http_actions/saveSubscription": typeof http_actions_saveSubscription;
  "http_actions/storeGmailFullProfile": typeof http_actions_storeGmailFullProfile;
  "http_actions/storeInstagramPostsBulk": typeof http_actions_storeInstagramPostsBulk;
  "http_actions/storeInstagramProfile": typeof http_actions_storeInstagramProfile;
  "http_actions/storeYouTubeChannelData": typeof http_actions_storeYouTubeChannelData;
  "http_actions/storeYouTubeFullProfile": typeof http_actions_storeYouTubeFullProfile;
  "http_actions/storeYouTubeVideoAnalysis": typeof http_actions_storeYouTubeVideoAnalysis;
  "http_actions/updateGmailToken": typeof http_actions_updateGmailToken;
  "http_actions/updateInstagramToken": typeof http_actions_updateInstagramToken;
  "http_actions/updateNote": typeof http_actions_updateNote;
  "http_actions/updateStripeCustomer": typeof http_actions_updateStripeCustomer;
  "http_actions/updateSubscriptionFromStripe": typeof http_actions_updateSubscriptionFromStripe;
  "http_actions/updateUser": typeof http_actions_updateUser;
  "http_actions/updateYouTubeToken": typeof http_actions_updateYouTubeToken;
  "http_actions/validateApiKey": typeof http_actions_validateApiKey;
  instagramMutations: typeof instagramMutations;
  instagramQueries: typeof instagramQueries;
  internal: typeof internal_;
  notes: typeof notes;
  personaQueries: typeof personaQueries;
  personas: typeof personas;
  rateLimiting: typeof rateLimiting;
  subscriptionActions: typeof subscriptionActions;
  subscriptionQueries: typeof subscriptionQueries;
  usageEvents: typeof usageEvents;
  userMutations: typeof userMutations;
  userQueries: typeof userQueries;
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
