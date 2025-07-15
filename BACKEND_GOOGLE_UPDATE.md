# Backend Google OAuth Updates

You need to update your existing Google OAuth endpoints to work with the frontend. Here are the changes needed:

## 1. Update the `/api/auth/google` endpoint

In your `user.routes.ts` file, update the Google OAuth initiation endpoint:

```typescript
/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Google OAuth login
 *     description: Initiates the Google OAuth authentication flow
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
 *         description: Redirects to Google authentication page
 */
userRouter.get('/google', (req: Request, res: Response) => {
    const { redirect_uri } = req.query;
    
    if (!redirect_uri) {
        return res.status(400).json({
            success: false,
            message: 'redirect_uri is required'
        });
    }

    // Store the redirect_uri in session or pass it to the callback
    // You can use a temporary storage or pass it as state parameter
    
    // Redirect to Google OAuth with the frontend redirect_uri
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirect_uri as string)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&access_type=offline` +
        `&prompt=consent`;
    
    res.redirect(googleAuthUrl);
});
```

## 2. Update the `/api/auth/google/callback` endpoint

Update your existing callback endpoint to handle the frontend redirect:

```typescript
/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Callback endpoint for Google OAuth authentication
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       200:
 *         description: Returns user data and JWT token
 */
userRouter.get('/google/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code is required'
            });
        }

        // Exchange authorization code for tokens using Google OAuth2 API
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code as string,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${req.protocol}://${req.get('host')}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        if (!tokenResponse.ok) {
            console.error('Google token exchange failed:', await tokenResponse.text());
            return res.status(400).json({
                success: false,
                message: 'Failed to exchange authorization code'
            });
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // Get user info from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
            },
        });

        if (!userInfoResponse.ok) {
            return res.status(400).json({
                success: false,
                message: 'Failed to get user info from Google'
            });
        }

        const userInfo = await userInfoResponse.json();
        const { email, name, picture } = userInfo;

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
        console.error('Google OAuth callback error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during Google OAuth callback'
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
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## How it works now:

1. **Frontend** calls `/api/auth/google?redirect_uri=http://localhost:5173/auth/google/callback`
2. **Backend** redirects to Google OAuth with the frontend redirect_uri
3. **Google** redirects back to frontend with authorization code
4. **Frontend** calls `/api/auth/google/callback?code=...` 
5. **Backend** processes the code and returns user data + JWT
6. **Frontend** logs user in and redirects to home page

This approach uses your existing endpoints without needing the new `/api/auth/google/exchange` endpoint! 