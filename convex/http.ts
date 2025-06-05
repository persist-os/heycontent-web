import { httpRouter } from "convex/server";
import { ActionCtx } from "./_generated/server";
import * as usageEventsApi from "./usageEvents";
import getUserById from "./http_actions/getUserById";
import createUser from "./http_actions/createUser";
import updateUser from "./http_actions/updateUser";
import getUserByEmail from "./http_actions/getUserByEmail";
import getUserPersona from "./http_actions/getUserPersona";
import insertApiKey from "./http_actions/insertApiKey";
import validateApiKey from "./http_actions/validateApiKey";
import getUserApiKeys from "./http_actions/getUserApiKeys";
import deleteApiKey from "./http_actions/deleteApiKey";
import createNote from "./http_actions/createNote";
import getNote from "./http_actions/getNote";
import getNotesByUser from "./http_actions/getNotesByUser";
import updateNote from "./http_actions/updateNote";
import deleteNote from "./http_actions/deleteNote";
import getAnalysesByNote from "./http_actions/getAnalysesByNote";
import linkAnalysisToNote from "./http_actions/linkAnalysisToNote";
import createAnalysis from "./http_actions/createAnalysis";
import getAnalysesByUser from "./http_actions/getAnalysesByUser";
import getAnalysesByUserPlatform from "./http_actions/getAnalysesByUserPlatform";
import getGmailTokens from "./http_actions/getGmailTokens";
import updateGmailToken from "./http_actions/updateGmailToken";
import saveGmailAccount from "./http_actions/saveGmailAccount";
import storeGmailFullProfile from "./http_actions/storeGmailFullProfile";
import getYouTubeTokens from "./http_actions/getYouTubeTokens";
import storeYouTubeVideoAnalysis from "./http_actions/storeYouTubeVideoAnalysis";
import updateYouTubeToken from "./http_actions/updateYouTubeToken";
import storeYouTubeFullProfile from "./http_actions/storeYouTubeFullProfile";
import storeYouTubeChannelData from "./http_actions/storeYouTubeChannelData";
import createConversation from "./http_actions/createConversations";
import addMessageToConversation from "./http_actions/addMessageToConversation";
import disconnectInstagram from "./http_actions/disconnectInstagram";
import getInstagramTokens from "./http_actions/getInstagramTokens";
import updateInstagramToken from "./http_actions/updateInstagramToken";
import storeInstagramPostsBulk from "./http_actions/storeInstagramPostsBulk";
import storeInstagramProfile from "./http_actions/storeInstagramProfile";
import getInstagramPost from "./http_actions/getInstagramPost";
import getInstagramPostInsights from "./http_actions/getInstagramPostInsights";
import getInstagramPostComments from "./http_actions/getInstagramPostComments";
import getUserSubscription from "./http_actions/getUserSubscription";
import createOrUpdateStripeCustomer from "./http_actions/createOrUpdateStripeCustomer";
import getStripeCustomer from "./http_actions/getStripeCustomer";
import updateStripeCustomer from "./http_actions/updateStripeCustomer";
import saveSubscription from "./http_actions/saveSubscription";
import updateSubscriptionFromStripe from "./http_actions/updateSubscriptionFromStripe";
import getSubscriptionItem from "./http_actions/getSubscriptionItem";
import getRateLimitData from "./http_actions/getRateLimitData";
import addRateLimitRequest from "./http_actions/addRateLimitRequest";
import logUsageEvent from "./http_actions/logUsageEvent";
import getUsageSummary from "./http_actions/getUsageSummary";
import resetUsageForPeriod from "./http_actions/resetUsageForPeriod";
import getYouTubeVideoData from "./http_actions/getYouTubeVideoData";
import listUsers from "./http_actions/listUsers";
import saveInstagramToken from "./http_actions/saveInstagramToken";
import createPersona from "./http_actions/createPersona";

const http = httpRouter();

// USER ROUTES
http.route({ path: "/api/http/createPersona", method: "POST", handler: createPersona });
http.route({ path: "/api/http/getUserById", method: "GET", handler: getUserById });
http.route({ path: "/api/http/createUser", method: "POST", handler: createUser });
http.route({ path: "/api/http/updateUser", method: "PATCH", handler: updateUser });
http.route({ path: "/api/http/getUserByEmail", method: "GET", handler: getUserByEmail });
http.route({ path: "/api/http/getUserPersona", method: "GET", handler: getUserPersona });

// API KEY ROUTES
http.route({ path: "/insertApiKey", method: "POST", handler: insertApiKey });
http.route({ path: "/validateApiKey", method: "POST", handler: validateApiKey });
http.route({ path: "/getUserApiKeys", method: "GET", handler: getUserApiKeys });
http.route({ path: "/deleteApiKey", method: "DELETE", handler: deleteApiKey });

// NOTES ROUTES
http.route({ path: "/createNote", method: "POST", handler: createNote });
http.route({ path: "/getNote", method: "GET", handler: getNote });
http.route({ path: "/getNotesByUser", method: "GET", handler: getNotesByUser });
http.route({ path: "/updateNote", method: "PATCH", handler: updateNote });
http.route({ path: "/deleteNote", method: "DELETE", handler: deleteNote });
http.route({ path: "/getAnalysesByNote", method: "GET", handler: getAnalysesByNote });
http.route({ path: "/linkAnalysisToNote", method: "POST", handler: linkAnalysisToNote });
http.route({ path: "/createAnalysis", method: "POST", handler: createAnalysis });
http.route({ path: "/getAnalysesByUser", method: "GET", handler: getAnalysesByUser });
http.route({ path: "/getAnalysesByUserPlatform", method: "GET", handler: getAnalysesByUserPlatform });

// GMAIL ROUTES
http.route({ path: "/getGmailTokens", method: "GET", handler: getGmailTokens });
http.route({ path: "/updateGmailToken", method: "POST", handler: updateGmailToken });
http.route({ path: "/saveGmailAccount", method: "POST", handler: saveGmailAccount });
http.route({ path: "/storeGmailFullProfile", method: "POST", handler: storeGmailFullProfile });

// YOUTUBE ROUTES
http.route({ path: "/api/users/:id/youtube/tokens", method: "GET", handler: getYouTubeTokens });
http.route({ path: "/api/users/:userId/youtube/videos/:videoId/analysis", method: "POST", handler: storeYouTubeVideoAnalysis });
http.route({ path: "/api/users/:id/youtube/token", method: "POST", handler: updateYouTubeToken });
http.route({ path: "/api/users/:id/youtube/full_profile", method: "POST", handler: storeYouTubeFullProfile });
http.route({ path: "/api/users/:id/youtube/channel", method: "POST", handler: storeYouTubeChannelData });
http.route({ path: "/api/users/:userId/youtube/video-data", method: "GET", handler: getYouTubeVideoData as any });

// CONVERSATION ROUTES
http.route({ path: "/createConversation", method: "POST", handler: createConversation });
http.route({ path: "/addMessageToConversation", method: "POST", handler: addMessageToConversation });

// INSTAGRAM ROUTES
http.route({ path: "/instagram/:id/delete", method: "POST", handler: disconnectInstagram });
http.route({ path: "/api/users/:id/instagram/tokens", method: "GET", handler: getInstagramTokens });
http.route({ path: "/api/users/:id/instagram/token", method: "POST", handler: updateInstagramToken });
http.route({ path: "/api/users/:id/instagram/posts/bulk", method: "POST", handler: storeInstagramPostsBulk });
http.route({ path: "/api/users/:id/instagram/profile", method: "POST", handler: storeInstagramProfile });
http.route({ path: "/api/users/:id/instagram/post/:postId", method: "GET", handler: getInstagramPost });
http.route({ path: "/api/users/:id/instagram/post/:postId/insights", method: "GET", handler: getInstagramPostInsights });
http.route({ path: "/api/users/:id/instagram/post/:postId/comments", method: "GET", handler: getInstagramPostComments });
http.route({ path: "/api/saveInstagramToken", method: "POST", handler: saveInstagramToken });

// STRIPE/SUBSCRIPTION ROUTES
http.route({ path: "/api/users/:id/stripe/subscription", method: "GET", handler: getUserSubscription as any });
http.route({ path: "/api/users/:id/stripe/customer", method: "POST", handler: createOrUpdateStripeCustomer as any });
http.route({ path: "/api/users/:id/stripe/customer", method: "GET", handler: getStripeCustomer as any });
http.route({ path: "/api/users/:id/stripe/customer/update", method: "POST", handler: updateStripeCustomer as any });
http.route({ path: "/api/users/:id/stripe/subscription", method: "POST", handler: saveSubscription as any });
http.route({ path: "/api/stripe/subscriptions/:id", method: "PATCH", handler: updateSubscriptionFromStripe as any });
http.route({ path: "/api/users/:id/stripe/subscription/item", method: "GET", handler: getSubscriptionItem as any });

// RATE LIMITING ROUTES
http.route({ path: "/getRateLimitData", method: "POST", handler: getRateLimitData as any });
http.route({ path: "/addRateLimitRequest", method: "POST", handler: addRateLimitRequest as any });

// USAGE EVENTS ROUTES
http.route({ path: "/api/users/:id/usage/log", method: "POST", handler: logUsageEvent as any });
http.route({ path: "/api/users/:id/usage/summary", method: "GET", handler: getUsageSummary as any });
http.route({ path: "/api/users/:id/usage/reset", method: "POST", handler: resetUsageForPeriod as any });

// LIST USERS ROUTE
http.route({ path: "/api/users", method: "GET", handler: listUsers });

// NEW ROUTE

export default http;
