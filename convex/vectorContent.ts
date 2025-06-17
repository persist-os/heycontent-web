import { query } from "./_generated/server";
import { v } from "convex/values";

// Extract text from Instagram post for embedding
export const extractInstagramText = query({
  args: { userId: v.string(), postId: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!post) return null;
    
    const caption = post.data.caption || "";
    const comments = post.data.comments || [];
    const commentText = Array.isArray(comments) 
      ? comments.map((c: any) => c.text || "").join(" ")
      : "";
    
    return {
      contentId: post.postId,
      contentType: "instagram_post" as const,
      text: `${caption} ${commentText}`.trim(),
      metadata: {
        title: caption.substring(0, 100) || "Instagram Post",
        platform: "instagram",
        createdAt: post.data.timestamp || post.createdAt,
        tags: [], // You could extract hashtags here
        snippet: caption.substring(0, 150),
        url: post.data.permalink,
      }
    };
  },
});

// Extract text from YouTube video for embedding
export const extractYouTubeText = query({
  args: { userId: v.string(), videoId: v.string() },
  handler: async (ctx, args) => {
    const video = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_videoId", (q) => q.eq("videoId", args.videoId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!video) return null;
    
    const title = video.snippet?.title || "";
    const description = video.snippet?.description || "";
    const captions = video.captions?.caption_track?.text || "";
    const comments = video.comments?.comments || [];
    const commentText = Array.isArray(comments)
      ? comments.map((c: any) => c.text || "").join(" ")
      : "";
    
    return {
      contentId: video.videoId,
      contentType: "youtube_video" as const,
      text: `${title} ${description} ${captions} ${commentText}`.trim(),
      metadata: {
        title: title || "YouTube Video",
        platform: "youtube",
        createdAt: video.snippet?.published_at 
          ? new Date(video.snippet.published_at).getTime() 
          : video.createdAt || Date.now(),
        tags: video.snippet?.tags || [],
        snippet: description.substring(0, 150),
        url: video.url,
      }
    };
  },
});

// Extract text from Gmail message for embedding
export const extractGmailText = query({
  args: { userId: v.string(), messageId: v.string() },
  handler: async (ctx, args) => {
    const message = await ctx.db
      .query("gmailMessages")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!message) return null;
    
    const subject = message.subject || "";
    const snippet = message.snippet || "";
    const from = message.from || "";
    
    return {
      contentId: message.messageId,
      contentType: "gmail_message" as const,
      text: `${subject} ${snippet}`.trim(),
      metadata: {
        title: subject || "Email Message",
        platform: "gmail",
        createdAt: message.internalDate ? parseInt(message.internalDate) : message.createdAt,
        tags: [],
        snippet: snippet.substring(0, 150),
        from: from,
        subject: subject,
      }
    };
  },
});

// Extract text from Gmail thread for embedding
export const extractGmailThreadText = query({
  args: { userId: v.string(), threadId: v.string() },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("gmailThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    
    if (!thread) return null;
    
    const subject = thread.subject || "";
    const snippet = thread.snippet || "";
    const from = thread.from || "";
    const messages = thread.messages || [];
    const messageText = Array.isArray(messages)
      ? messages.map((m: any) => m.snippet || "").join(" ")
      : "";
    
    return {
      contentId: thread.threadId,
      contentType: "gmail_thread" as const,
      text: `${subject} ${snippet} ${messageText}`.trim(),
      metadata: {
        title: subject || "Email Thread",
        platform: "gmail",
        createdAt: thread.createdAt,
        tags: [],
        snippet: snippet.substring(0, 150),
        from: from,
        subject: subject,
      }
    };
  },
});

// Extract text from persona for embedding
export const extractPersonaText = query({
  args: { userId: v.string(), personaId: v.id("personas") },
  handler: async (ctx, args) => {
    const persona = await ctx.db.get(args.personaId);
    
    if (!persona || persona.userId !== args.userId) return null;
    
    const text = [
      persona.current_name,
      persona.current_description,
      persona.future_name,
      persona.future_description,
      persona.unique_value,
      persona.desired_impact,
      ...persona.goals,
      ...persona.content_pillars,
      ...persona.primary_topics,
      ...persona.secondary_topics,
      ...persona.tone_descriptors,
      ...persona.style_descriptors,
    ].join(" ");
    
    return {
      contentId: args.personaId,
      contentType: "persona" as const,
      text: text.trim(),
      metadata: {
        title: persona.current_name,
        platform: "heycontent",
        createdAt: persona.createdAt,
        tags: [...persona.content_pillars, ...persona.primary_topics],
        snippet: persona.current_description.substring(0, 150),
      }
    };
  },
});

// Extract text from note for embedding
export const extractNoteText = query({
  args: { userId: v.string(), noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    
    if (!note || note.userId !== args.userId) return null;
    
    const text = [
      note.title,
      note.content || "",
      note.analysis || "",
      ...note.tags,
    ].join(" ");
    
    return {
      contentId: args.noteId,
      contentType: "note" as const,
      text: text.trim(),
      metadata: {
        title: note.title,
        platform: note.platform || "heycontent",
        createdAt: note.createdAt,
        tags: note.tags,
        snippet: (note.content || "").substring(0, 150),
      }
    };
  },
});

// Extract text from conversation for embedding
export const extractConversationText = query({
  args: { userId: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || conversation.userId !== args.userId) return null;
    
    const messageText = conversation.messages
      .map((msg: any) => msg.content)
      .join(" ");
    
    return {
      contentId: args.conversationId,
      contentType: "conversation" as const,
      text: `${conversation.title} ${messageText}`.trim(),
      metadata: {
        title: conversation.title,
        platform: "heycontent",
        createdAt: conversation.createdAt,
        tags: [],
        snippet: messageText.substring(0, 150),
      }
    };
  },
});

// Extract text from ambient insights for embedding
export const extractAmbientInsightText = query({
  args: { userId: v.string(), insightId: v.id("ambientInsights") },
  handler: async (ctx, args) => {
    const insight = await ctx.db.get(args.insightId);
    
    if (!insight || insight.userId !== args.userId) return null;
    
    const text = insight.data
      .map((item: any) => `${item.title} ${item.content} ${item.recommendation}`)
      .join(" ");
    
    return {
      contentId: args.insightId,
      contentType: "ambient_insight" as const,
      text: text.trim(),
      metadata: {
        title: "Ambient Insights",
        platform: "heycontent",
        createdAt: insight.createdAt,
        tags: insight.data.map((item: any) => item.category),
        snippet: text.substring(0, 150),
      }
    };
  },
}); 