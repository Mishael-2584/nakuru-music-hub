# Social Media Integration Setup Guide
## Facebook & Instagram API Configuration

## ✅ What's Been Done

- ✅ Removed Twitter integration
- ✅ Updated components to focus on Facebook & Instagram only
- ✅ API integration code ready to use
- ✅ Fallback to mock data when API not configured

## 🚀 Setup Instructions

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Business" as app type
4. Fill in:
   - App Name: "Damon Music Academy Social Feed"
   - App Contact Email: your email
5. Click "Create App"

### Step 2: Get Facebook Page Access Token

1. In your Facebook App dashboard, go to "Tools" → "Graph API Explorer"
2. Select your app from dropdown
3. Click "Generate Access Token"
4. Grant permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_read_user_content`
5. Copy the **User Access Token**
6. Convert to **Long-Lived Token**:
   - Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
   - Paste your token
   - Click "Extend Access Token"
   - Copy the new long-lived token (lasts 60 days)

7. Get your **Page ID**:
   - Go to your Facebook Page
   - Click "About"
   - Scroll down to find "Page ID"
   - Or use Graph API Explorer: `me/accounts` to list your pages

### Step 3: Connect Instagram Business Account

1. Make sure your Instagram account is a **Business** or **Creator** account
2. Connect it to your Facebook Page:
   - Go to Instagram Settings → Account → Linked Accounts
   - Link to your Facebook Page
3. In Facebook App dashboard:
   - Go to "Products" → Add "Instagram"
   - Complete Instagram Basic Display setup
4. Get Instagram Business Account ID:
   - In Graph API Explorer, query: `me/accounts?fields=instagram_business_account`
   - Copy the Instagram Business Account ID

### Step 4: Add Environment Variables

Create or update `.env` file in your project root:

```env
# Facebook Configuration
REACT_APP_FACEBOOK_ACCESS_TOKEN=your_long_lived_access_token_here
REACT_APP_FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Instagram Configuration  
REACT_APP_INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
REACT_APP_INSTAGRAM_USER_ID=your_instagram_business_account_id_here
```

**Note:** For Instagram, you can use the same access token as Facebook since they're connected.

### Step 5: Test the Integration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the About page
3. Scroll to "Social Media Feed" section
4. You should see real posts from your Facebook and Instagram!

## 🔧 Troubleshooting

### Issue: "Invalid OAuth access token"
**Solution:** Your token may have expired. Generate a new long-lived token.

### Issue: "No posts showing"
**Solution:** 
- Check that your Facebook Page has public posts
- Verify Instagram account is Business/Creator type
- Check browser console for error messages

### Issue: "Permission denied"
**Solution:** Make sure you granted all required permissions when generating the token.

## 📝 Important Notes

### Token Expiration
- User Access Tokens expire after 1-2 hours
- Long-Lived Tokens expire after 60 days
- You'll need to refresh tokens periodically

### Production Considerations
For production, consider:
1. **Server-side token storage** - Don't expose tokens in frontend
2. **Automatic token refresh** - Set up a backend service to refresh tokens
3. **Caching** - Store posts in database, refresh every 30-60 minutes
4. **Rate limits** - Facebook allows 200 calls per hour per user

## 🎯 Next Steps (Optional Enhancements)

1. **Add Supabase Caching**
   - Store posts in database
   - Refresh every 30 minutes
   - Faster load times

2. **Backend API**
   - Move API calls to backend
   - Hide access tokens
   - Better security

3. **Automatic Refresh**
   - Set up cron job to fetch posts
   - Keep cache updated

## 📞 Need Help?

If you encounter issues:
1. Check Facebook App dashboard for errors
2. Use Graph API Explorer to test queries
3. Check browser console for error messages
4. Verify all permissions are granted

## 🔗 Useful Links

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)

---

**Status:** Ready to configure! Follow the steps above to connect your real Facebook and Instagram accounts.
