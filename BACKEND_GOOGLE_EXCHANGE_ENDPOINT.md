# Backend Google OAuth Exchange Endpoint

You need to add this new endpoint to your backend to support the frontend-only Google OAuth approach.

## Add to your user.routes.ts file:

```typescript
/**
 * @swagger
 * /api/auth/google/exchange:
 *   post:
 *     summary: Exchange Google OAuth authorization code for user data
 *     description: Exchanges the authorization code from Google for user data and JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - redirect_uri
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Google OAuth
 *               redirect_uri:
 *                 type: string
 *                 description: Redirect URI used in the OAuth request
 *     responses:
 *       200:
 *         description: Successfully exchanged code for user data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: number
 *                       example: 41
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid authorization code
 *       500:
 *         description: Internal server error
 */
userRouter.post('/google/exchange', async (req: Request, res: Response) => {
    try {
        const { code, redirect_uri } = req.body;

        if (!code || !redirect_uri) {
            return res.status(400).json({
                success: false,
                message: 'Authorization code and redirect URI are required'
            });
        }

        // Exchange authorization code for tokens using Google OAuth2 API
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: redirect_uri,
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
        console.error('Google OAuth exchange error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error during Google OAuth exchange'
        });
    }
});
```

## Add to your backend .env file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Required imports:

Make sure you have these imports in your user.routes.ts file:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../service/user.service';
import { UserRole } from '../entities/user.entity';
```

## How it works:

1. Frontend redirects to Google OAuth with authorization code
2. Google redirects back to frontend with authorization code
3. Frontend sends authorization code to backend `/api/auth/google/exchange`
4. Backend exchanges code for access token with Google
5. Backend gets user info from Google using access token
6. Backend creates/finds user in database
7. Backend returns user data and JWT token to frontend
8. Frontend logs user in and redirects to home page 