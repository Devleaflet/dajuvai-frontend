import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { processGoogleAuthResponse } from '../utils/googleAuthUtils';
import { API_BASE_URL } from '../config';
import '../Styles/GoogleAuthCallback.css';

const FacebookAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        //('Facebook OAuth callback - Full URL:', window.location.href);
        //('Facebook OAuth callback - Search params:', location.search);
        
        // Get URL parameters
        const urlParams = new URLSearchParams(location.search);
        const error = urlParams.get('error');
        const code = urlParams.get('code');

        if (error) {
          setError(`Facebook authentication failed: ${error}`);
          setIsProcessing(false);
          return;
        }

        if (!code) {
          //('No authorization code found');
          setError('No authorization code received from Facebook. Please try again.');
          setIsProcessing(false);
          return;
        }

        //('Received authorization code from Facebook, calling backend callback...');

        // Call your existing backend callback endpoint
        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/facebook/callback?${location.search}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const responseData = await response.json();
          //('Backend callback response:', responseData);

          if (responseData.success && responseData.data) {
            const result = await processGoogleAuthResponse(responseData, login, navigate);
            
            if (!result.success) {
              setError(result.error || 'Authentication failed');
            }
          } else {
            setError(responseData.message || 'Authentication failed');
          }
        } catch (callbackError) {
          console.error('Error calling backend callback:', callbackError);
          setError('Failed to complete authentication. Please try again.');
        }

      } catch (err) {
        console.error('Facebook OAuth callback error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [location, login, navigate]);

  if (isProcessing) {
    return (
      <div className="google-auth-callback">
        <div className="google-auth-callback__container">
          <div className="google-auth-callback__loading">
            <div className="google-auth-callback__spinner"></div>
            <p className="google-auth-callback__message">Processing Facebook authentication...</p>
            <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
              <p>Debug Info:</p>
              <p>URL: {window.location.href}</p>
              <p>Search: {location.search}</p>
            </div>
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
            
            {/* Manual test section for debugging */}
            <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
              <p style={{ fontSize: '12px', marginBottom: '10px' }}>Debug: Manual Test</p>
              <button
                onClick={async () => {
                  // Test with the specific data format from the user's example
                  const testData = {
                    "success": true,
                    "data": {
                      "userId": 41,
                      "email": "rupakheteeswapnil@gmail.com",
                      "role": "user",
                      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDEsImVtYWlsIjoicnVwYWtoZXRlZXN3YXBuaWxAZ21haWwuY29tIiwidXNlcm5hbWUiOiJTd2FwbmlsIFJ1cGFraGV0ZWUiLCJpYXQiOjE3NTIzMDM2NDgsImV4cCI6MTc1MjMxMDg0OH0.8cZI44_Hf9jfKYMRlcj9SfCgXl0FKYjypaMug1T5Sqc"
                    }
                  };
                  
                  //('Testing with manual data:', testData);
                  const result = await processGoogleAuthResponse(testData, login, navigate);
                  
                  if (!result.success) {
                    setError(result.error || 'Manual test failed');
                  }
                }}
                style={{ fontSize: '10px', padding: '5px 10px', marginRight: '10px' }}
              >
                Test with Sample Data
              </button>
            </div>
            
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

export default FacebookAuthCallback; 