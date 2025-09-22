# Social Media Integration Guide

This guide explains how to integrate real social media feeds into the Damon Music Academy website.

## Overview

The website now includes a beautiful social media feed section that displays posts from Facebook, Instagram, and Twitter. The system is designed to work with both real API data and mock data for demonstration purposes.

## Features

- **Multi-platform Support**: Facebook, Instagram, and Twitter
- **Real-time Updates**: Refresh button to fetch latest posts
- **Platform Filtering**: Filter posts by specific social media platform
- **Responsive Design**: Works perfectly on mobile and desktop
- **Fallback System**: Uses mock data when APIs are not configured
- **Error Handling**: Graceful fallback to mock data on API errors

## Setup Instructions

### 1. Facebook Integration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app and get your App ID and App Secret
3. Generate a Page Access Token for your Facebook page
4. Get your Page ID from your Facebook page settings

Add to your `.env` file:
```
REACT_APP_FACEBOOK_ACCESS_TOKEN=your_page_access_token
REACT_APP_FACEBOOK_PAGE_ID=your_page_id
```

### 2. Instagram Integration

1. Set up Facebook app (Instagram uses Facebook's API)
2. Add Instagram Basic Display product to your Facebook app
3. Get Instagram User ID and Access Token

Add to your `.env` file:
```
REACT_APP_INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
REACT_APP_INSTAGRAM_USER_ID=your_instagram_user_id
```

### 3. Twitter Integration

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app and get your Bearer Token
3. Get your Twitter username

Add to your `.env` file:
```
REACT_APP_TWITTER_BEARER_TOKEN=your_bearer_token
REACT_APP_TWITTER_USERNAME=your_twitter_username
```

## File Structure

```
src/
├── components/
│   └── SocialMediaFeed.tsx          # Main social media feed component
├── pages/
│   └── SocialMediaPage.tsx          # Dedicated social media page
├── utils/
│   └── socialMediaAPI.ts            # API integration utilities
└── App.tsx                          # Routes configuration
```

## Usage

### On Homepage
The social media feed is automatically displayed on the homepage between the News section and Registration section.

### On About Page
The social media feed is also integrated into the About page, appearing after the main about content. This provides visitors learning about your academy with immediate access to your social media presence and community engagement.

### Navigation Integration
The social media feed is accessible from:
- Homepage: Automatically displayed in the main content flow
- About page: Integrated into the about section

## Customization

### Adding New Platforms
To add support for new social media platforms:

1. Create a new API class in `src/utils/socialMediaAPI.ts`
2. Add the platform to the `SocialPost` interface
3. Update the `SocialMediaManager` class
4. Add platform filtering in `SocialMediaFeed.tsx`

### Styling
The component uses Tailwind CSS classes and can be easily customized by modifying the classes in `SocialMediaFeed.tsx`.

### Mock Data
Mock data is defined in `SocialMediaFeed.tsx` and includes sample posts for all platforms. You can modify this data to match your content.

## API Rate Limits

Be aware of API rate limits:
- **Facebook**: 200 calls per hour per user
- **Instagram**: 200 calls per hour per user  
- **Twitter**: 300 requests per 15-minute window

The component fetches 6 posts per platform by default, which should be well within limits.

## Security Notes

- Never commit API tokens to version control
- Use environment variables for all sensitive data
- Consider implementing token refresh mechanisms for production
- Monitor API usage to avoid rate limit violations

## Troubleshooting

### No Posts Showing
1. Check that environment variables are set correctly
2. Verify API tokens are valid and have proper permissions
3. Check browser console for error messages
4. Ensure your social media accounts have public posts

### API Errors
1. Verify API credentials are correct
2. Check if tokens have expired
3. Ensure your app has the required permissions
4. Check API documentation for any changes

### Mock Data Fallback
If APIs are not configured or fail, the system automatically falls back to mock data to ensure the feed always displays content.

## Support

For technical support or questions about the social media integration, please contact the development team.
