// Social Media API Integration Utilities
// This file contains examples of how to integrate with real social media APIs

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter';
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

// Twitter API v2 Integration
export class TwitterAPI {
  private bearerToken: string;
  private username: string;

  constructor(bearerToken: string, username: string) {
    this.bearerToken = bearerToken;
    this.username = username;
  }

  async getPosts(limit: number = 10): Promise<SocialPost[]> {
    try {
      // First, get user ID
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${this.username}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          }
        }
      );
      
      const userData = await userResponse.json();
      const userId = userData.data.id;

      // Then get tweets
      const tweetsResponse = await fetch(
        `https://api.twitter.com/2/users/${userId}/tweets?tweet.fields=created_at,public_metrics&max_results=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          }
        }
      );
      
      const tweetsData = await tweetsResponse.json();
      
      return tweetsData.data.map((tweet: any) => ({
        id: tweet.id,
        platform: 'twitter' as const,
        content: tweet.text,
        author: '@DamonMusicAcademy',
        timestamp: tweet.created_at,
        likes: tweet.public_metrics?.like_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        shares: tweet.public_metrics?.retweet_count || 0,
        url: `https://twitter.com/${this.username}/status/${tweet.id}`,
        type: 'post' as const
      }));
    } catch (error) {
      console.error('Twitter API Error:', error);
      return [];
    }
  }
}

// Combined Social Media Manager
export class SocialMediaManager {
  private facebookAPI?: FacebookAPI;
  private instagramAPI?: InstagramAPI;
  private twitterAPI?: TwitterAPI;

  constructor(config: {
    facebook?: { accessToken: string; pageId: string };
    instagram?: { accessToken: string; userId: string };
    twitter?: { bearerToken: string; username: string };
  }) {
    if (config.facebook) {
      this.facebookAPI = new FacebookAPI(config.facebook.accessToken, config.facebook.pageId);
    }
    if (config.instagram) {
      this.instagramAPI = new InstagramAPI(config.instagram.accessToken, config.instagram.userId);
    }
    if (config.twitter) {
      this.twitterAPI = new TwitterAPI(config.twitter.bearerToken, config.twitter.username);
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

    try {
      if (this.twitterAPI) {
        const twitterPosts = await this.twitterAPI.getPosts(limitPerPlatform);
        allPosts.push(...twitterPosts);
      }
    } catch (error) {
      console.error('Error fetching Twitter posts:', error);
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
REACT_APP_TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REACT_APP_TWITTER_USERNAME=your_twitter_username
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
  },
  twitter: {
    bearerToken: process.env.REACT_APP_TWITTER_BEARER_TOKEN!,
    username: process.env.REACT_APP_TWITTER_USERNAME!
  }
});

const posts = await socialMediaManager.getAllPosts(5);
*/
