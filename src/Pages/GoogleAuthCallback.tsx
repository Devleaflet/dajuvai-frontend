import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('[GoogleAuthCallback] Attempting to fetch user data, attempt:', retryCount + 1);
        
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include', // Important: send cookies!
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        console.log('[GoogleAuthCallback] Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('[GoogleAuthCallback] Response data:', data);
        
        if (data.success && data.data) {
          const userData = {
            id: data.data.userId,
            email: data.data.email,
            role: data.data.role,
            username: data.data.email.split('@')[0],
            isVerified: true,
          };
          // If backend provides a token, use it. Otherwise fallback to null.
          const token = data.data.token || null;
          console.log('[GoogleAuthCallback] Calling login with:', userData, 'token:', token);
          login(token, userData);
          navigate('/', { replace: true });
        } else {
          throw new Error(data.message || 'Invalid response from server');
        }
      } catch (err) {
        console.error('[GoogleAuthCallback] Error fetching user:', err);
        
        // Retry logic for network issues
        if (retryCount < 2) {
          console.log('[GoogleAuthCallback] Retrying in 1 second...');
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
          return;
        }
        
        // If all retries failed, show error but still try to redirect
        setError(`Failed to fetch user info: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Fallback: redirect to home anyway after a delay
        setTimeout(() => {
          console.log('[GoogleAuthCallback] Fallback redirect to home');
          navigate('/', { replace: true });
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    fetchUser();
  }, [login, navigate, retryCount]);

  if (isProcessing) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Processing Google authentication...</p>
          {retryCount > 0 && <p style={{ fontSize: '14px', color: '#666' }}>Retry attempt: {retryCount}</p>}
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#e74c3c', marginBottom: '10px' }}>⚠️ Authentication Issue</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>{error}</p>
          <p style={{ fontSize: '14px', color: '#888' }}>
            Redirecting to home page in a few seconds...
          </p>
        </div>
        <button 
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Home Now
        </button>
      </div>
    );
  }
  
  return null;
};

export default GoogleAuthCallback; 