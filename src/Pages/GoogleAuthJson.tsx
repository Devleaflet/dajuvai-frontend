import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { processGoogleAuthResponse } from '../utils/googleAuthUtils';
import '../Styles/GoogleAuthCallback.css';

const GoogleAuthJson: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const processJsonResponse = async () => {
      try {
        // This is the JSON response you're getting
        const responseData = {
          "success": true,
          "data": {
            "userId": 41,
            "email": "rupakheteeswapnil@gmail.com",
            "role": "user",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDEsImVtYWlsIjoicnVwYWtoZXRlZXN3YXBuaWxAZ21haWwuY29tIiwidXNlcm5hbWUiOiJTd2FwbmlsIFJ1cGFraGV0ZWUiLCJpYXQiOjE3NTIzMDM2NDgsImV4cCI6MTc1MjMxMDg0OH0.8cZI44_Hf9jfKYMRlcj9SfCgXl0FKYjypaMug1T5Sqc"
          }
        };

        // Process the response data
        const result = await processGoogleAuthResponse(responseData, login, navigate);
        
        if (!result.success) {
          setError(result.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Google OAuth JSON response error:', err);
        setError('An unexpected error occurred during authentication');
      } finally {
        setIsProcessing(false);
      }
    };

    processJsonResponse();
  }, [login, navigate]);

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

export default GoogleAuthJson; 