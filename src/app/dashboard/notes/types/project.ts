import { Id } from "@/convex/_generated/dataModel";
import { Note } from "./index";

export interface Project {
  _id: Id<"projects">;
  _creationTime: number;
  userId: string;
  name: string;
  description?: string;
  noteIds?: string[];
  conversationIds?: string[];
  instagramPostIds?: string[];
  youtubeVideoIds?: string[];
  gmailIds?: string[];
  analysisIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWithItems extends Project {
  attachedItems: {
    notes: Note[];
    conversations: Array<{
      _id: Id<"conversations">;
      _creationTime: number;
      userId: string;
      title: string;
      messages: Array<{
        content: string;
        role: string;
        timestamp?: number;
      }>;
      createdAt: number;
      updatedAt: number;
      starred: boolean;
    }>;
    instagramPosts: Array<{
      _id: Id<"instagramPosts">;
      _creationTime: number;
      userId: string;
      instagramAccountId: string;
      postId: string;
      mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS";
      data: {
        id: string;
        caption: string;
        media_url: string;
        permalink: string;
        timestamp: number;
        username: string;
        like_count?: number;
        comments_count?: number;
        thumbnail_url?: string;
      };
      createdAt: number;
      updatedAt: number;
    }>;
    youtubeVideos: Array<{
      _id: Id<"youtubeVideos">;
      _creationTime: number;
      userId: string;
      videoId: string;
      snippet?: {
        title: string;
        description: string;
        published_at: string;
        thumbnails?: {
          high?: string;
          medium?: string;
          default?: string;
        };
      };
      statistics?: {
        views?: number;
        likes?: number;
        comments?: number;
      };
      createdAt: number;
      updatedAt: number;
    }>;
    gmailItems: Array<any>;
    analysisItems: Array<any>;
  };
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
}

export type ItemType = "note" | "conversation" | "analysis";

export interface ProjectItem {
  id: string;
  type: ItemType;
  title: string;
  preview?: string;
  date: number;
} 