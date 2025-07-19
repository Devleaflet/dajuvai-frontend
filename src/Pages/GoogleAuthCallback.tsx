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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Helper function to add debug logs
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setDebugInfo(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    // --- URL PARAMETER METHOD ---
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('authToken', token);
      addDebugLog('Token found in URL parameter and saved to localStorage.authToken');
      // Fetch user info with the token
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            addDebugLog('Fetched user info successfully with token from URL');
            login(token, data.data);
            addDebugLog('Login called with token and user data from /api/auth/me');
            navigate('/', { replace: true });
          } else {
            addDebugLog('Failed to fetch user info with token from URL');
            setError('Failed to fetch user info after Google login.');
          }
        })
        .catch(err => {
          addDebugLog('Error fetching user info with token from URL: ' + err.message);
          setError('Error fetching user info after Google login.');
        });
      return;
    }

    const fetchUser = async () => {
      try {
        addDebugLog(`[GoogleAuthCallback] Starting attempt ${retryCount + 1}`);
        
        // Debug: Log current URL and search params
        const currentUrl = window.location.href;
        const urlParams = new URLSearchParams(window.location.search);
        addDebugLog(`Current URL: ${currentUrl}`);
        addDebugLog(`URL search params: ${urlParams.toString()}`);
        
        // Check for OAuth error parameters
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        if (error) {
          addDebugLog(`OAuth error in URL: ${error} - ${errorDescription}`);
        }

        // Debug: Check cookies in detail
        const cookies = document.cookie;
        addDebugLog(`All cookies: "${cookies}"`);
        addDebugLog(`Cookie count: ${cookies.split(';').filter(c => c.trim()).length}`);
        
        // Parse and log individual cookies
        if (cookies) {
          cookies.split(';').forEach((cookie, index) => {
            const [name, value] = cookie.trim().split('=');
            addDebugLog(`Cookie ${index + 1}: ${name} = ${value ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : 'empty'}`);
          });
        } else {
          addDebugLog('NO COOKIES FOUND - This is likely the main issue!');
        }

        // Debug: Log browser/environment info
        addDebugLog(`User Agent: ${navigator.userAgent}`);
        addDebugLog(`Current origin: ${window.location.origin}`);
        addDebugLog(`API_BASE_URL: ${API_BASE_URL}`);
        addDebugLog(`Is HTTPS: ${window.location.protocol === 'https:'}`);
        addDebugLog(`Document domain: ${document.domain}`);
        // Debug: Show localStorage token
        addDebugLog(`localStorage.authToken: ${localStorage.getItem('authToken') || 'null'}`);

        // Debug: Check if this is coming from Google
        const referrer = document.referrer;
        addDebugLog(`Document referrer: ${referrer}`);
        addDebugLog(`Is from Google: ${referrer.includes('google.com') || referrer.includes('accounts.google.com')}`);

        // CRITICAL: Test the backend cookie test endpoint first
        addDebugLog('Testing backend cookie setting capability...');
        try {
          const testResponse = await fetch(`${API_BASE_URL}/api/auth/test-cookie`, {
            credentials: 'include',
            method: 'GET'
          });
          addDebugLog(`Test cookie response status: ${testResponse.status}`);
          const testData = await testResponse.json();
          addDebugLog(`Test cookie response: ${JSON.stringify(testData)}`);
          
          // Check if test cookie was set
          const cookiesAfterTest = document.cookie;
          addDebugLog(`Cookies after test: "${cookiesAfterTest}"`);
          
        } catch (testError) {
          addDebugLog(`Test cookie failed: ${testError}`);
        }

        // Debug: Log request details before making it
        const requestUrl = `${API_BASE_URL}/api/auth/me`;
        addDebugLog(`Making request to: ${requestUrl}`);
        addDebugLog(`Request credentials: include`);

        const response = await fetch(requestUrl, {
          credentials: 'include', // Important: send cookies!
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            // Fallback: Attach token if present
            ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
          },
        });

        addDebugLog(`Response status: ${response.status} ${response.statusText}`);
        
        // Debug: Log response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });
        addDebugLog(`Response headers: ${JSON.stringify(responseHeaders, null, 2)}`);

        // Check for specific authentication-related headers
        const setCookieHeader = response.headers.get('set-cookie');
        if (setCookieHeader) {
          addDebugLog(`Set-Cookie header from response: ${setCookieHeader}`);
        } else {
          addDebugLog('No Set-Cookie header in response');
        }

        if (!response.ok) {
          // Try to get error details from response body
          let errorBody = '';
          try {
            const errorText = await response.text();
            errorBody = errorText;
            addDebugLog(`Error response body: ${errorText}`);
          } catch (bodyError) {
            addDebugLog(`Could not read error response body: ${bodyError}`);
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`);
        }

        const data = await response.json();
        addDebugLog(`Response data: ${JSON.stringify(data, null, 2)}`);
        // Fallback: If token is present in response, store in localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          addDebugLog('Token found in response body and saved to localStorage.authToken');
        }
        if (data.success && data.data) {
          const userData = {
            id: data.data.userId,
            email: data.data.email,
            role: data.data.role,
            username: data.data.email.split('@')[0],
            isVerified: true,
          };
          // If backend provides a token, use it. Otherwise fallback to null.
          const token = data.data.token || data.token || null;
          addDebugLog(`Extracted user data: ${JSON.stringify(userData, null, 2)}`);
          addDebugLog(`Token present: ${token ? 'yes' : 'no'}`);
          login(token, userData);
          addDebugLog('Login successful, staying on callback page');
          // navigate('/', { replace: true }); // REMOVE AUTO-REDIRECT
        } else {
          addDebugLog(`Invalid response structure: success=${data.success}, data present=${!!data.data}`);
          throw new Error(data.message || 'Invalid response from server');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        addDebugLog(`ERROR: ${errorMessage}`);
        console.error('[GoogleAuthCallback] Error fetching user:', err);
        
        // Retry logic for network issues
        if (retryCount < 2) {
          addDebugLog(`Will retry in 1 second... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000);
          return;
        }
        
        // If all retries failed, show error but still try to redirect
        addDebugLog('All retries exhausted, showing error and will NOT auto-redirect');
        setError(`Failed to fetch user info: ${errorMessage}`);
        // Fallback: do NOT redirect to home automatically
        // setTimeout(() => {
        //   addDebugLog('Fallback redirect to home');
        //   navigate('/', { replace: true });
        // }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    // Add initial debug info
    addDebugLog('GoogleAuthCallback component mounted');
    fetchUser();
  }, [login, navigate, retryCount]);

  // Debug panel for cookies, localStorage, and network info
  const DebugPanel = () => (
    <details style={{ marginTop: '20px', maxWidth: '800px', textAlign: 'left' }}>
      <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Show Debug Info (Frontend)</summary>
      <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto', fontSize: '12px', fontFamily: 'monospace' }}>
        <div><b>Cookies:</b> {document.cookie || 'None'}</div>
        <div><b>localStorage.authToken:</b> {localStorage.getItem('authToken') || 'None'}</div>
        <div><b>Current URL:</b> {window.location.href}</div>
        <div><b>User Agent:</b> {navigator.userAgent}</div>
        <div><b>API_BASE_URL:</b> {API_BASE_URL}</div>
        <div><b>Origin:</b> {window.location.origin}</div>
        <div><b>Referrer:</b> {document.referrer}</div>
      </div>
    </details>
  );

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
        {/* Debug logs display */}
        <details style={{ marginTop: '20px', maxWidth: '800px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Show Debug Logs</summary>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px', 
            maxHeight: '300px', 
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>{log}</div>
            ))}
          </div>
        </details>
        <DebugPanel />
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
        {/* Debug logs display for error case */}
        <details style={{ marginTop: '20px', maxWidth: '800px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>Show Debug Logs</summary>
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px', 
            maxHeight: '300px', 
            overflowY: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ marginBottom: '5px' }}>{log}</div>
            ))}
          </div>
        </details>
        <DebugPanel />
        <button 
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
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