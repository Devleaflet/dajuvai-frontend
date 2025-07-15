import { API_BASE_URL } from '../config';
import axios from 'axios';

interface GoogleAuthResponse {
  success: boolean;
  data: {
    userId: number;
    email: string;
    role: string;
    token: string;
    username?: string;
  };
}

interface UserData {
  id: number;
  email: string;
  role: string;
  username: string;
  isVerified: boolean;
}

export const processGoogleAuthResponse = async (
  responseData: GoogleAuthResponse,
  login: (token: string, userData: UserData) => void,
  navigate: (path: string, options?: { replace?: boolean }) => void
) => {
  try {
    console.log('[GoogleAuthUtils] processGoogleAuthResponse called with:', responseData);
    if (responseData.success && responseData.data) {
      const { userId, email, role, token, username } = responseData.data;
      console.log('[GoogleAuthUtils] Extracted user:', { userId, email, role, token, username });

      // Create user data object
      const userData = {
        id: userId,
        email: email,
        role: role,
        username: username || email.split('@')[0], // Use provided username or email username as fallback
        isVerified: true,
      };

      // Login the user
      console.log('[GoogleAuthUtils] Calling login() with token and userData:', { token, userData });
      login(token, userData);

      // Redirect based on role
      if (role === 'admin') {
        console.log('[GoogleAuthUtils] Navigating to /admin-dashboard');
        navigate('/admin-dashboard', { replace: true });
      } else if (role === 'vendor') {
        console.log('[GoogleAuthUtils] Navigating to /dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('[GoogleAuthUtils] Navigating to /');
        navigate('/', { replace: true });
      }

      return { success: true };
    } else {
      console.error('[GoogleAuthUtils] Invalid response from server:', responseData);
      return { success: false, error: 'Authentication failed: Invalid response from server' };
    }
  } catch (error) {
    console.error('[GoogleAuthUtils] Error processing Google auth response:', error);
    return { success: false, error: 'An unexpected error occurred during authentication' };
  }
};

export const handleGoogleCallback = async (
  searchParams: string,
  login: (token: string, userData: UserData) => void,
  navigate: (path: string, options?: { replace?: boolean }) => void
) => {
  try {
    // Exchange the authorization code for user data
    const response = await axios.get<GoogleAuthResponse>(
      `${API_BASE_URL}/api/auth/google/callback?${searchParams}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return await processGoogleAuthResponse(response.data, login, navigate);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    if (axios.isAxiosError(err)) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Authentication failed';
      return { success: false, error: errorMessage };
    } else {
      return { success: false, error: 'An unexpected error occurred during authentication' };
    }
  }
}; 