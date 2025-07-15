// API Configuration in file named config.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://leafletdv.onrender.com";

// Frontend URL - update this based on your environment
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here';
export const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

 