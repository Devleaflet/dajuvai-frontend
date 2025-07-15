# Google OAuth Setup Guide

## Frontend-Only Google OAuth Implementation

This guide will help you set up Google OAuth to work directly from the frontend, which is the recommended approach for better user experience and security.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Choose "Web application" as the application type
7. Add your authorized redirect URIs:
   - `http://localhost:5173/auth/google/callback` (for development)
   - `https://yourdomain.com/auth/google/callback` (for production)
8. Copy the Client ID

## Step 2: Configure Environment Variables

Create a `.env` file in the root of your frontend project:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here

# API Configuration
VITE_API_BASE_URL=https://leafletdv.onrender.com

# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173
```

Replace `your-actual-google-client-id-here` with the Client ID you copied from Google Cloud Console.

## Step 3: Backend API Endpoint

Make sure your backend has an endpoint to exchange the authorization code for user data:

**Endpoint:** `POST /api/auth/google/exchange`

**Request Body:**
```json
{
  "code": "authorization_code_from_google",
  "redirect_uri": "http://localhost:5173/auth/google/callback"
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "userId": 41,
    "email": "user@example.com",
    "role": "user",
    "token": "jwt_token_here",
    "username": "username_here"
  }
}
```

## Step 4: How It Works

1. **User clicks "Continue with Google"** → Redirects to Google OAuth
2. **User authorizes on Google** → Google redirects back to `/auth/google/callback` with authorization code
3. **Frontend receives code** → Makes API call to backend to exchange code for user data
4. **Backend processes code** → Returns user data and JWT token
5. **Frontend logs user in** → Redirects to home page

## Step 5: Testing

1. Start your development server
2. Click "Continue with Google" in the login modal
3. Complete Google OAuth flow
4. You should be redirected back to your app and logged in

## Troubleshooting

### "Google OAuth is not configured" error
- Make sure you've set the `VITE_GOOGLE_CLIENT_ID` environment variable
- Restart your development server after adding the environment variable

### "No authorization code received" error
- Check that your redirect URI in Google Cloud Console matches exactly
- Make sure the `/auth/google/callback` route is properly configured

### Backend exchange fails
- Verify your backend endpoint `/api/auth/google/exchange` is working
- Check that your backend has the correct Google Client Secret configured

## Security Notes

- Never expose your Google Client Secret in the frontend
- Always use HTTPS in production
- The authorization code can only be used once
- Store sensitive configuration in environment variables 