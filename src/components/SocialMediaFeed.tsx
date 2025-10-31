import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Instagram, 
  ExternalLink, 
  Calendar,
  Users,
  Music,
  Heart,
  MessageCircle,
  Share2,
  RefreshCw
} from "lucide-react";
import { SocialMediaManager, SocialPost } from '@/utils/socialMediaAPI';

const SocialMediaFeed = () => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'all' | 'facebook' | 'instagram'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - fallback when API is not configured
  const mockPosts: SocialPost[] = [
      {
        id: '1',
        platform: 'facebook',
        content: '🎵 Exciting news! Our students performed beautifully at the Nakuru Music Festival. Congratulations to all participants! 🎶',
        image: '/api/placeholder/400/300',
        author: 'Damon Music Academy',
        timestamp: '2025-01-07T10:30:00Z',
        likes: 45,
        comments: 12,
        shares: 8,
        url: 'https://facebook.com/damonmusicacademy/posts/1',
        type: 'announcement'
      },
      {
        id: '2',
        platform: 'instagram',
        content: 'Behind the scenes at our recording studio! Our advanced students are working on their original compositions. 🎼✨ #MusicProduction #StudentLife',
        image: '/api/placeholder/400/400',
        author: '@damonmusicacademy',
        timestamp: '2025-01-06T15:45:00Z',
        likes: 128,
        comments: 23,
        url: 'https://instagram.com/p/example',
        type: 'post'
      },
      {
        id: '3',
        platform: 'facebook',
        content: '📅 UPCOMING EVENT: Piano Recital featuring our intermediate students\n📅 Date: February 15th, 2025\n📍 Venue: Damon Music Academy Auditorium\n🎫 Free admission for family and friends\n\nCome support our talented students!',
        author: 'Damon Music Academy',
        timestamp: '2025-01-05T09:15:00Z',
        likes: 67,
        comments: 18,
        shares: 15,
        url: 'https://facebook.com/damonmusicacademy/events/1',
        type: 'event'
      },
      {
        id: '5',
        platform: 'instagram',
        content: 'New student spotlight! Meet Sarah, our talented violinist who just completed her Grade 5 exam with distinction! 🎻🌟 #StudentSpotlight #Violin',
        image: '/api/placeholder/400/400',
        author: '@damonmusicacademy',
        timestamp: '2025-01-03T11:30:00Z',
        likes: 89,
        comments: 15,
        url: 'https://instagram.com/p/example2',
        type: 'announcement'
      },
      {
        id: '6',
        platform: 'facebook',
        content: '🎓 Congratulations to our graduating students! We\'re so proud of your musical journey and excited to see where your talents take you next. 🎵✨',
        author: 'Damon Music Academy',
        timestamp: '2025-01-02T16:00:00Z',
        likes: 156,
        comments: 42,
        shares: 28,
        url: 'https://facebook.com/damonmusicacademy/posts/2',
        type: 'announcement'
      }
    ];

  const fetchSocialMediaPosts = async () => {
    try {
      // Check if API credentials are configured
      const hasFacebookConfig = process.env.REACT_APP_FACEBOOK_ACCESS_TOKEN && process.env.REACT_APP_FACEBOOK_PAGE_ID;
      const hasInstagramConfig = process.env.REACT_APP_INSTAGRAM_ACCESS_TOKEN && process.env.REACT_APP_INSTAGRAM_USER_ID;

      if (hasFacebookConfig || hasInstagramConfig) {
        // Use real API data
        const socialMediaManager = new SocialMediaManager({
          facebook: hasFacebookConfig ? {
            accessToken: process.env.REACT_APP_FACEBOOK_ACCESS_TOKEN!,
            pageId: process.env.REACT_APP_FACEBOOK_PAGE_ID!
          } : undefined,
          instagram: hasInstagramConfig ? {
            accessToken: process.env.REACT_APP_INSTAGRAM_ACCESS_TOKEN!,
            userId: process.env.REACT_APP_INSTAGRAM_USER_ID!
          } : undefined
        });

        const apiPosts = await socialMediaManager.getAllPosts(6);
        setPosts(apiPosts);
      } else {
        // Use mock data when API is not configured
        setPosts(mockPosts);
      }
    } catch (error) {
      console.error('Error fetching social media posts:', error);
      // Fallback to mock data on error
      setPosts(mockPosts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSocialMediaPosts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSocialMediaPosts();
  };

  const filteredPosts = activePlatform === 'all' 
    ? posts 
    : posts.filter(post => post.platform === activePlatform);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'facebook': return 'bg-blue-600 text-white';
      case 'instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'event': return <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Event</Badge>;
      case 'announcement': return <Badge variant="outline" className="text-xs"><Music className="h-3 w-3 mr-1" />Announcement</Badge>;
      default: return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              DAMON MUSIC ACADEMY SOCIAL MEDIA FEED
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stay connected with our latest news, events, and student achievements
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            DAMON MUSIC ACADEMY SOCIAL MEDIA FEED
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Stay connected with our latest news, events, and student achievements
          </p>
          
          {/* Platform Filter and Refresh */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <div className="flex gap-2">
              <Button
                variant={activePlatform === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActivePlatform('all')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                All Platforms
              </Button>
            <Button
              variant={activePlatform === 'facebook' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePlatform('facebook')}
              className="flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>
            <Button
              variant={activePlatform === 'instagram' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActivePlatform('instagram')}
              className="flex items-center gap-2"
            >
              <Instagram className="h-4 w-4" />
              Instagram
            </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-all duration-300 border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${getPlatformColor(post.platform)}`}>
                      {getPlatformIcon(post.platform)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{post.author}</p>
                      <p className="text-xs text-gray-500">{formatTimestamp(post.timestamp)}</p>
                    </div>
                  </div>
                  {getTypeBadge(post.type)}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={post.image} 
                      alt="Post content" 
                      className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>
                
                {/* Engagement Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    {post.likes && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </div>
                    )}
                    {post.comments && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </div>
                    )}
                    {post.shares && (
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(post.url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Follow Us for More Updates!</h3>
              <p className="text-blue-100 mb-6">
                Stay connected with Damon Music Academy on social media for the latest news, events, and student achievements.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => window.open('https://facebook.com/damonmusicacademy', '_blank')}
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={() => window.open('https://instagram.com/damonmusicacademy', '_blank')}
                >
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaFeed;
