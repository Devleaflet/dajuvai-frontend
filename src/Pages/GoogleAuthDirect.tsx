import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { processGoogleAuthResponse } from '../utils/googleAuthUtils';
import '../Styles/GoogleAuthCallback.css';

const GoogleAuthDirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processDirectResponse = async () => {
      try {
        // Check if we have a JSON response in the URL hash or search params
        let responseData = null;
        
        // Try to parse from URL hash (if the response is in the hash)
        if (location.hash) {
          try {
            const hashData = decodeURIComponent(location.hash.substring(1));
            responseData = JSON.parse(hashData);
          } catch {
            console.log('No valid JSON in hash');
          }
        }
        
        // Try to parse from search params (if the response is in the URL)
        if (!responseData && location.search) {
          const urlParams = new URLSearchParams(location.search);
          const responseParam = urlParams.get('response');
          if (responseParam) {
            try {
              responseData = JSON.parse(decodeURIComponent(responseParam));
            } catch {
              console.log('No valid JSON in response param');
            }
          }
        }

        // If we still don't have response data, try to parse the entire search string as JSON
        if (!responseData && location.search) {
          try {
            // Remove the leading '?' and try to parse as JSON
            const searchString = location.search.substring(1);
            responseData = JSON.parse(decodeURIComponent(searchString));
          } catch {
            console.log('Search string is not valid JSON');
          }
        }

        if (!responseData) {
          setError('No valid response data found');
          setIsProcessing(false);
          return;
        }

        // Process the response data
        const result = await processGoogleAuthResponse(responseData, login, navigate);
        
        if (!result.success) {
          setError(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Google OAuth direct response error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    processDirectResponse();
  }, [location, login, navigate]);

  if (isProcessing) {
    return (
      <div className="google-auth-callback">
        <div className="google-auth-callback__container">
          <div className="google-auth-callback__loading">
            <div className="google-auth-callback__spinner"></div>
            <p className="google-auth-callback__message">Processing Google authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="google-auth-callback">
        <div className="google-auth-callback__container">
          <div className="google-auth-callback__error">
            <div className="google-auth-callback__error-icon">⚠️</div>
            <h2 className="google-auth-callback__title">Authentication Failed</h2>
            <p className="google-auth-callback__message">{error}</p>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="google-auth-callback__button"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GoogleAuthDirect; 