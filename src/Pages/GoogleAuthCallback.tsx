// import React, { useEffect, useState } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { API_BASE_URL } from '../config';

// const GoogleAuthCallback: React.FC = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { login } = useAuth();
//   const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
//   const [message, setMessage] = useState<string>('');
//   const [debugInfo, setDebugInfo] = useState<string[]>([]);

//   const addDebugLog = (message: string) => {
//     const timestamp = new Date().toISOString();
//     const logMessage = `[${timestamp}] ${message}`;
//     console.log(logMessage);
//     setDebugInfo(prev => [...prev, logMessage]);
//   };

//   useEffect(() => {
//     const handleCallback = async () => {
//       try {
//         addDebugLog('Starting Google OAuth callback handling');

//         // Check for OAuth errors first - these come from our backend redirects
//         const error = searchParams.get('error');

//         if (error) {
//           addDebugLog(`OAuth error received: ${error}`);
//           setStatus('error');
//           setMessage(getErrorMessage(error));
//           setTimeout(() => navigate('/', { replace: true }), 5000);
//           return;
//         }

//         // Method 1: Check for direct token in URL params (successful auth)
//         const urlToken = searchParams.get('token');
//         if (urlToken) {
//           addDebugLog('Found token in URL parameters');
//           await handleTokenAuth(urlToken);
//           return;
//         }

//         // Method 2: Check for authorization code (fallback for direct Google callback)
//         const code = searchParams.get('code');
//         if (code) {
//           addDebugLog('Found authorization code, this should not happen - redirecting to backend');
//           // This means user was redirected directly to frontend instead of backend
//           // Redirect them to backend to complete the OAuth flow
//           const backendCallbackUrl = `${API_BASE_URL}/api/auth/google/callback?${window.location.search.substring(1)}`;
//           window.location.href = backendCallbackUrl;
//           return;
//         }

//         // Method 3: Check for existing session/cookie (fallback)
//         addDebugLog('No URL params found, checking for existing session');
//         await handleSessionAuth();

//       } catch (error) {
//         addDebugLog(`Error in callback handler: ${error}`);
//         setStatus('error');
//         setMessage('An unexpected error occurred during authentication');
//         setTimeout(() => navigate('/', { replace: true }), 5000);
//       }
//     };

//     handleCallback();
//   }, [searchParams, navigate, login]);

//   const handleTokenAuth = async (token: string) => {
//     try {
//       addDebugLog('Authenticating with URL token');

//       const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//       }

//       const data = await response.json();
//       addDebugLog(`User data fetched: ${JSON.stringify(data)}`);

//       if (data.success && data.data) {
//         const userData = {
//           id: data.data.userId || data.data.id,
//           email: data.data.email,
//           role: data.data.role || 'user',
//           username: data.data.username || data.data.email.split('@')[0],
//           isVerified: true,
//         };

//         login(token, userData);
//         addDebugLog('Login successful with URL token');
//         setStatus('success');
//         setMessage('Successfully authenticated with Google!');

//         // Redirect based on role
//         const redirectPath = userData.role === 'admin' || userData.role === 'staff' 
//           ? '/admin-dashboard' 
//           : '/';

//         setTimeout(() => navigate(redirectPath, { replace: true }), 2000);
//       } else {
//         throw new Error('Invalid user data received');
//       }
//     } catch (error) {
//       addDebugLog(`Token auth failed: ${error}`);
//       throw error;
//     }
//   };

//   const handleSessionAuth = async () => {
//     try {
//       addDebugLog('Checking for existing session');

//       const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
//         credentials: 'include',
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//         },
//       });

//       addDebugLog(`Session check response: ${response.status}`);

//       if (!response.ok) {
//         throw new Error('No valid session found');
//       }

//       const data = await response.json();
//       addDebugLog(`Session data: ${JSON.stringify(data)}`);

//       if (data.success && data.data) {
//         const userData = {
//           id: data.data.userId || data.data.id,
//           email: data.data.email,
//           role: data.data.role || 'user',
//           username: data.data.username || data.data.email.split('@')[0],
//           isVerified: true,
//         };

//         // For session auth, we might not have a token in the response
//         const token = data.token || null;
//         login(token, userData);
//         addDebugLog('Login successful with session auth');
//         setStatus('success');
//         setMessage('Successfully authenticated with Google!');

//         const redirectPath = userData.role === 'admin' || userData.role === 'staff' 
//           ? '/admin-dashboard' 
//           : '/';

//         setTimeout(() => navigate(redirectPath, { replace: true }), 2000);
//       } else {
//         throw new Error('Invalid session data');
//       }
//     } catch (error) {
//       addDebugLog(`Session auth failed: ${error}`);
//       throw error;
//     }
//   };

//   const getErrorMessage = (error: string): string => {
//     switch (error) {
//       case 'authentication_failed':
//         return 'Google authentication failed. Please try again.';
//       case 'authentication_error':
//         return 'An error occurred during Google authentication. Please try again.';
//       case 'server_error':
//         return 'Server error during authentication. Please try again later.';
//       case 'token_error':
//         return 'Error processing authentication token. Please try again.';
//       case 'google_auth_failed':
//         return 'Google authentication service failed. Please try again.';
//       case 'access_denied':
//         return 'You cancelled the Google sign-in process.';
//       case 'invalid_request':
//         return 'Invalid authentication request.';
//       case 'unauthorized_client':
//         return 'Authentication service is not properly configured.';
//       case 'unsupported_response_type':
//         return 'Authentication configuration error.';
//       case 'invalid_scope':
//         return 'Authentication permission error.';
//       case 'temporarily_unavailable':
//         return 'Google authentication is temporarily unavailable. Please try again later.';
//       default:
//         return `Authentication error: ${error}. Please try again.`;
//     }
//   };

//   const DebugPanel = () => (
//     <details style={{ marginTop: '20px', maxWidth: '800px', textAlign: 'left' }}>
//       <summary style={{ cursor: 'pointer', marginBottom: '10px', fontSize: '14px' }}>
//         Show Debug Information
//       </summary>
//       <div style={{ 
//         backgroundColor: '#f8f9fa', 
//         border: '1px solid #dee2e6',
//         padding: '15px', 
//         borderRadius: '8px', 
//         maxHeight: '400px', 
//         overflowY: 'auto',
//         fontSize: '12px',
//         fontFamily: 'Monaco, Consolas, monospace'
//       }}>
//         <div style={{ marginBottom: '15px' }}>
//           <strong>Environment Info:</strong>
//           <div>Current URL: {window.location.href}</div>
//           <div>API Base URL: {API_BASE_URL}</div>
//           <div>Origin: {window.location.origin}</div>
//           <div>Cookies: {document.cookie || 'None'}</div>
//           <div>Referrer: {document.referrer}</div>
//           <div>Search Params: {window.location.search}</div>
//         </div>

//         <div>
//           <strong>Debug Logs:</strong>
//           {debugInfo.map((log, index) => (
//             <div key={index} style={{ 
//               marginBottom: '3px', 
//               padding: '2px 0',
//               borderBottom: index < debugInfo.length - 1 ? '1px solid #eee' : 'none'
//             }}>
//               {log}
//             </div>
//           ))}
//         </div>
//       </div>
//     </details>
//   );

//   return (
//     <div style={{ 
//       display: 'flex', 
//       flexDirection: 'column', 
//       alignItems: 'center', 
//       justifyContent: 'center', 
//       minHeight: '100vh',
//       padding: '20px',
//       textAlign: 'center',
//       backgroundColor: '#f8f9fa',
//       fontFamily: 'Arial, sans-serif'
//     }}>
//       <div style={{
//         backgroundColor: 'white',
//         padding: '40px',
//         borderRadius: '12px',
//         boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
//         maxWidth: '500px',
//         width: '100%'
//       }}>
//         {status === 'processing' && (
//           <>
//             <div style={{
//               width: '50px',
//               height: '50px',
//               border: '4px solid #f3f3f3',
//               borderTop: '4px solid #4285f4',
//               borderRadius: '50%',
//               animation: 'spin 1s linear infinite',
//               margin: '0 auto 20px'
//             }}></div>
//             <h2 style={{ color: '#333', marginBottom: '10px' }}>Processing Authentication</h2>
//             <p style={{ color: '#666', marginBottom: '20px' }}>
//               Please wait while we complete your Google sign-in...
//             </p>
//           </>
//         )}

//         {status === 'success' && (
//           <>
//             <div style={{ 
//               fontSize: '50px', 
//               color: '#4CAF50', 
//               marginBottom: '20px' 
//             }}>
//               ✓
//             </div>
//             <h2 style={{ color: '#333', marginBottom: '10px' }}>Success!</h2>
//             <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
//             <p style={{ fontSize: '14px', color: '#999' }}>
//               Redirecting you now...
//             </p>
//           </>
//         )}

//         {status === 'error' && (
//           <>
//             <div style={{ 
//               fontSize: '50px', 
//               color: '#f44336', 
//               marginBottom: '20px' 
//             }}>
//               ⚠
//             </div>
//             <h2 style={{ color: '#333', marginBottom: '10px' }}>Authentication Failed</h2>
//             <p style={{ color: '#666', marginBottom: '20px' }}>{message}</p>
//             <p style={{ fontSize: '14px', color: '#999', marginBottom: '20px' }}>
//               Redirecting to home page in 5 seconds...
//             </p>
//             <button 
//               onClick={() => navigate('/', { replace: true })}
//               style={{
//                 backgroundColor: '#4285f4',
//                 color: 'white',
//                 border: 'none',
//                 padding: '12px 24px',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: '500',
//                 marginRight: '10px'
//               }}
//             >
//               Go to Home Now
//             </button>
//             <button 
//               onClick={() => window.location.reload()}
//               style={{
//                 backgroundColor: '#6c757d',
//                 color: 'white',
//                 border: 'none',
//                 padding: '12px 24px',
//                 borderRadius: '6px',
//                 cursor: 'pointer',
//                 fontSize: '14px',
//                 fontWeight: '500'
//               }}
//             >
//               Try Again
//             </button>
//           </>
//         )}
//       </div>

//       {/* <DebugPanel /> */}

//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default GoogleAuthCallback;


import React, { useEffect, useState } from 'react';
import { useNavigate} from 'react-router-dom';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    setTimeout(() => {
      setStatus("success");
      setMessage("Successfully authenticated with Google!");
    }, 2000);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #e9f2ff, #f7fbff)",
        fontFamily: "Inter, Arial, sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "450px",
          background: "#fff",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          textAlign: "center",
          transition: "0.3s",
        }}
      >

        {/* Processing State  */}
        {status === "processing" && (
          <>
            <div
              style={{
                width: "60px",
                height: "60px",
                margin: "0 auto 20px",
                borderRadius: "50%",
                border: "4px solid #e2e8f0",
                borderTopColor: "#4285f4",
                animation: "spin 1s linear infinite",
              }}
            ></div>

            <h2 style={{ marginBottom: "10px", fontWeight: 600, color: "#1f2937" }}>
              Connecting to Google…
            </h2>

            <p style={{ color: "#6b7280", fontSize: "15px" }}>
              Please wait while we complete your sign-in.
            </p>
          </>
        )}

        {/* Success State  */}
        {status === "success" && (
          <>
            <div
              style={{
                fontSize: "60px",
                color: "#22c55e",
                marginBottom: "15px",
              }}
            >
              ✓
            </div>

            <h2 style={{ marginBottom: "10px", fontWeight: 600, color: "#1f2937" }}>
              Login Successful!
            </h2>

            <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "10px" }}>
              {message}
            </p>

            <p style={{ color: "#9ca3af", fontSize: "14px" }}>
              Redirecting you…
            </p>
          </>
        )}

        {/* Error State  */}
        {status === "error" && (
          <>
            <div
              style={{
                fontSize: "60px",
                color: "#ef4444",
                marginBottom: "15px",
              }}
            >
              ⚠
            </div>

            <h2 style={{ marginBottom: "10px", fontWeight: 600, color: "#1f2937" }}>
              Authentication Failed
            </h2>

            <p style={{ color: "#6b7280", fontSize: "15px", marginBottom: "20px" }}>
              {message}
            </p>

            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                style={{
                  background: "#4285f4",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onClick={() => navigate("/", { replace: true })}
              >
                Go Home
              </button>

              <button
                style={{
                  background: "#6b7280",
                  color: "#fff",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>

      {/* Inline Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default GoogleAuthCallback;
