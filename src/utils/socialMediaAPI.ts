// Social Media API Integration Utilities
// This file contains examples of how to integrate with real social media APIs

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram';
  content: string;
  image?: string;
  author: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
  url: string;
  type: 'post' | 'event' | 'announcement';
}

// Facebook Graph API Integration
export class FacebookAPI {
  private accessToken: string;
  private pageId: string;

  constructor(accessToken: string, pageId: string) {
    this.accessToken = accessToken;
    this.pageId = pageId;
  }

  async getPosts(limit: number = 10): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.pageId}/posts?fields=id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares&limit=${limit}&access_token=${this.accessToken}`
      );
      
      const data = await response.json();
      
      return data.data.map((post: any) => ({
        id: post.id,
        platform: 'facebook' as const,
        content: post.message || '',
        image: post.full_picture,
        author: 'Damon Music Academy',
        timestamp: post.created_time,
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0,
        url: post.permalink_url,
        type: 'post' as const
      }));
    } catch (error) {
      console.error('Facebook API Error:', error);
      return [];
    }
  }
}

// Instagram Basic Display API Integration
export class InstagramAPI {
  private accessToken: string;
  private userId: string;

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
  }

  async getPosts(limit: number = 10): Promise<SocialPost[]> {
    try {
      const response = await fetch(
        `https://graph.instagram.com/${this.userId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=${limit}&access_token=${this.accessToken}`
      );
      
      const data = await response.json();
      
      return data.data.map((post: any) => ({
        id: post.id,
        platform: 'instagram' as const,
        content: post.caption || '',
        image: post.media_type === 'IMAGE' ? post.media_url : undefined,
        author: '@damonmusicacademy',
        timestamp: post.timestamp,
        url: post.permalink,
        type: 'post' as const
      }));
    } catch (error) {
      console.error('Instagram API Error:', error);
      return [];
    }
  }
}

// Combined Social Media Manager
export class SocialMediaManager {
  private facebookAPI?: FacebookAPI;
  private instagramAPI?: InstagramAPI;

  constructor(config: {
    facebook?: { accessToken: string; pageId: string };
    instagram?: { accessToken: string; userId: string };
  }) {
    if (config.facebook) {
      this.facebookAPI = new FacebookAPI(config.facebook.accessToken, config.facebook.pageId);
    }
    if (config.instagram) {
      this.instagramAPI = new InstagramAPI(config.instagram.accessToken, config.instagram.userId);
    }
  }

  async getAllPosts(limitPerPlatform: number = 5): Promise<SocialPost[]> {
    const allPosts: SocialPost[] = [];

    try {
      if (this.facebookAPI) {
        const facebookPosts = await this.facebookAPI.getPosts(limitPerPlatform);
        allPosts.push(...facebookPosts);
      }
    } catch (error) {
      console.error('Error fetching Facebook posts:', error);
    }

    try {
      if (this.instagramAPI) {
        const instagramPosts = await this.instagramAPI.getPosts(limitPerPlatform);
        allPosts.push(...instagramPosts);
      }
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
    }

    // Sort by timestamp (newest first)
    return allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

// Environment variables example:
/*
// Add these to your .env file:
REACT_APP_FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
REACT_APP_FACEBOOK_PAGE_ID=your_facebook_page_id
REACT_APP_INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
REACT_APP_INSTAGRAM_USER_ID=your_instagram_user_id
*/

// Usage example in your component:
/*
import { SocialMediaManager } from '@/utils/socialMediaAPI';

const socialMediaManager = new SocialMediaManager({
  facebook: {
    accessToken: process.env.REACT_APP_FACEBOOK_ACCESS_TOKEN!,
    pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID!
  },
  instagram: {
    accessToken: process.env.REACT_APP_INSTAGRAM_ACCESS_TOKEN!,
    userId: process.env.REACT_APP_INSTAGRAM_USER_ID!
  }
});

const posts = await socialMediaManager.getAllPosts(5);
*/
