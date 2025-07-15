# Backend Facebook OAuth Updates

You need to update your existing Facebook OAuth endpoints to work with the frontend. Here are the changes needed:

## 1. Update the `/api/auth/facebook` endpoint

In your `user.routes.ts` file, update the Facebook OAuth initiation endpoint:

```typescript
/**
 * @swagger
 * /api/auth/facebook:
 *   get:
 *     summary: Facebook OAuth login
 *     description: Initiates the Facebook OAuth authentication flow
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: redirect_uri
 *         required: true
 *         schema:
 *           type: string
 *         description: Frontend callback URL
 *     responses:
 *       302:
 *         description: Redirects to Facebook authentication page
 */
userRouter.get('/facebook', (req: Request, res: Response) => {
    const { redirect_uri } = req.query;
    
    if (!redirect_uri) {
        return res.status(400).json({
            success: false,
            message: 'redirect_uri is required'
        });
    }

    // Redirect to Facebook OAuth with the frontend redirect_uri
    const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri as string)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('email public_profile')}` +
        `&state=${encodeURIComponent(JSON.stringify({ redirect_uri }))}`;
    
    res.redirect(facebookAuthUrl);
});
```

## 2. Update the `/api/auth/facebook/callback` endpoint

Update your existing callback endpoint to handle the frontend redirect:

```typescript
/**
 * @swagger
 * /api/auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     description: Callback endpoint for Facebook OAuth authentication
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Facebook
 *       - in: query
 *         name: state
 *         required: false
 *         schema:
 *           type: string
 *         description: State parameter containing redirect_uri
 *     responses:
 *       200:
 *         description: Returns user data and JWT token
 */
userRouter.get('/facebook/callback', async (req: Request, res: Response) => {
    try {
        const { code, state } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Parse state to get redirect_uri
        let redirect_uri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
        if (state) {
            try {
                const stateData = JSON.parse(decodeURIComponent(state as string));
                redirect_uri = stateData.redirect_uri || redirect_uri;
            } catch (e) {
                console.log('Failed to parse state parameter');
            }
        }

        // Exchange authorization code for access token using Facebook OAuth2 API
        const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code as string,
                client_id: process.env.FACEBOOK_APP_ID!,
                client_secret: process.env.FACEBOOK_APP_SECRET!,
                redirect_uri: redirect_uri,
            }),
        });

        if (!tokenResponse.ok) {
            console.error('Facebook token exchange failed:', await tokenResponse.text());
            return res.status(400).json({
                success: false,
                message: 'Failed to exchange authorization code'
            });
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // Get user info from Facebook
        const userInfoResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${access_token}`);

        if (!userInfoResponse.ok) {
            return res.status(400).json({
                success: false,
                message: 'Failed to get user info from Facebook'
            });
        }

        const userInfo = await userInfoResponse.json();
        const { id, name, email } = userInfo;

        // Find or create user in your database
        let user = await findUserByEmail(email);
        
        if (!user) {
            // Create new user
            const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
            user = await createUser({
                username: name || email.split('@')[0],
                email: email,
                password: hashedPassword,
                verificationCode: null,
                isVerified: true,
                verificationCodeExpire: null,
                role: UserRole.USER,
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '2h' }
        );

        // Return user data and token
        res.status(200).json({
            success: true,
            data: {
                userId: user.id,
                email: user.email,
                role: user.role,
                token: token,
                username: user.username
            }
        });

    } catch (error) {
        console.error('Facebook OAuth callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during Facebook OAuth callback'
        });
    }
});
```

## 3. Required imports

Make sure you have these imports in your `user.routes.ts` file:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../service/user.service';
import { UserRole } from '../entities/user.entity';
```

## 4. Environment variables

Add to your backend `.env` file:

```env
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
```

## 5. Facebook App Setup

To get Facebook OAuth credentials:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing one
3. Add Facebook Login product
4. Configure OAuth settings:
   - Valid OAuth Redirect URIs: `http://localhost:5173/auth/facebook/callback`
   - App Domains: `localhost` (for development)
5. Copy App ID and App Secret

## How it works now:

1. **Frontend** calls `/api/auth/facebook?redirect_uri=http://localhost:5173/auth/facebook/callback`
2. **Backend** redirects to Facebook OAuth with the frontend redirect_uri
3. **Facebook** redirects back to frontend with authorization code
4. **Frontend** calls `/api/auth/facebook/callback?code=...` 
5. **Backend** processes the code and returns user data + JWT
6. **Frontend** logs user in and redirects to home page

This approach uses your existing Facebook endpoints without needing any new ones! 