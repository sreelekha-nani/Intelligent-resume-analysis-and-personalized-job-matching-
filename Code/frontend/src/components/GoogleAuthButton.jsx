import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Sparkles, Info, X } from 'lucide-react';

export default function GoogleAuthButton({ onLoginSuccess, onError, mode = 'login' }) {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '380519068552-ke32brqfk0btgiausg0291fnq76kggma.apps.googleusercontent.com';

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      if (onError) onError('No credential received from Google.');
      return;
    }

    setLoading(true);
    if (onError) onError('');

    try {
      const res = await authAPI.googleLogin(response.credential);
      localStorage.setItem('token', res.data.access_token);
      
      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      }

      if (res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('[GoogleAuthButton] Google login error:', err);
      let errorMsg = 'Google sign-in failed. Please try again.';
      if (typeof err.response?.data?.detail === 'string') {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message === 'Network Error') {
        errorMsg = 'Cannot connect to backend server. Make sure it is running on http://127.0.0.1:8000.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setShowConfigModal(false);
    if (onError) onError('');

    try {
      const res = await authAPI.googleLogin('demo_google_token');
      localStorage.setItem('token', res.data.access_token);
      
      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      }

      if (res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Demo Google sign-in failed.';
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkGoogleScript = () => {
      if (window.google?.accounts?.id) {
        setScriptLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkGoogleScript()) {
      const interval = setInterval(() => {
        if (checkGoogleScript()) {
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded && clientId && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        googleBtnRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 368,
        });
      } catch (e) {
        console.error('Failed to initialize Google Sign-In:', e);
      }
    }
  }, [scriptLoaded, clientId, mode]);

  const handleButtonClick = () => {
    if (!clientId) {
      setShowConfigModal(true);
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '8px' }}>
      {loading && (
        <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.88rem', color: '#0891b2', fontWeight: '600' }}>
          Authenticating with Google...
        </div>
      )}

      {/* When Client ID is configured, GIS renders the official button */}
      {clientId ? (
        <div 
          ref={googleBtnRef} 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            width: '100%',
            minHeight: '44px'
          }} 
        />
      ) : (
        /* Styled button when Client ID is pending setup */
        <button
          type="button"
          onClick={handleButtonClick}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '11px 16px',
            backgroundColor: '#ffffff',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '0.92rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        >
          {/* Official Google Multicolor 'G' Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>
      )}

      {/* Modal / Options Dialog when Client ID is pending */}
      {showConfigModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            border: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={() => setShowConfigModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <div style={{
                background: 'rgba(6, 182, 212, 0.1)',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <Sparkles size={24} color="#0891b2" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>
                Google Sign-In Options
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: '6px' }}>
                You can test Google authentication immediately using a simulated Google account, or configure your live Google Cloud credentials.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Demo Login */}
              <button
                type="button"
                onClick={handleDemoLogin}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '0.94rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)',
                  transition: 'transform 0.1s ease'
                }}
              >
                <span>⚡ Sign In with Demo Google User</span>
              </button>

              {/* Option 2: Live Setup Instructions */}
              <div style={{
                marginTop: '12px',
                padding: '14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: '#475569'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  <Info size={16} color="#0891b2" />
                  <span>To Use Real Google Accounts:</span>
                </div>
                <ol style={{ margin: '0', paddingLeft: '18px', lineHeight: '1.5' }}>
                  <li>In <strong>Google Cloud Console</strong> &gt; Credentials &gt; OAuth 2.0 Client ID.</li>
                  <li>Under <strong>Authorized JavaScript origins</strong>, add:</li>
                  <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
                    <li><code>http://localhost:3000</code></li>
                    <li><code>http://127.0.0.1:3000</code></li>
                  </ul>
                  <li>Save and verify <code>frontend/.env</code> has matching client ID.</li>
                </ol>
                <div style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  overflowX: 'auto'
                }}>
                  VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
