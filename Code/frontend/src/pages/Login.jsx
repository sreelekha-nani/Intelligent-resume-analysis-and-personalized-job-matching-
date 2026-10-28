import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Sparkles, Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Login({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // 'login' | 'forgot-email' | 'forgot-otp' | 'forgot-password' | 'forgot-success'
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password Flow State
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status State
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.login(email, password);
      localStorage.setItem('token', res.data.access_token);
      onLoginSuccess(res.data);
      if (res.data.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.forgotPassword(resetEmail);
      setSuccessMsg(res.data.message || 'OTP verification code sent to your email.');
      setView('forgot-otp');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await authAPI.verifyOTP(resetEmail, otp);
      setSuccessMsg('OTP verified! Please create a new password.');
      setView('forgot-password');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authAPI.resetPassword(resetEmail, otp, newPassword);
      setSuccessMsg(res.data.message || 'Password reset successfully!');
      setView('forgot-success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const resetToLogin = () => {
    setView('login');
    setEmail(resetEmail || email);
    setError('');
    setSuccessMsg('');
    setOtp('');
    setNewPassword('');
  };

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        
        {/* VIEW 1: NORMAL SIGN IN */}
        {view === 'login' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Sparkles size={24} color="white" />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1f2937' }}>Welcome Back</h2>
              <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '6px', fontWeight: '500' }}>Sign in to access your job recommendations and ATS tools.</p>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.88rem', color: '#1f2937', fontWeight: '700' }}>Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setView('forgot-email'); setError(''); setSuccessMsg(''); setResetEmail(email); }} 
                    style={{ background: 'none', border: 'none', color: '#0891b2', fontSize: '0.82rem', cursor: 'pointer', fontWeight: '700' }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '12px' }}>
                {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
              </button>
            </form>

            {/* OR Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>

            {/* Google Sign-In */}
            <GoogleAuthButton 
              onLoginSuccess={onLoginSuccess}
              onError={(msg) => setError(msg)}
              mode="login"
            />

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#374151', fontWeight: '500' }}>
              Don't have an account? <Link to="/register" style={{ color: '#0891b2', fontWeight: '700' }}>Register here</Link>
            </div>
          </>
        )}

        {/* VIEW 2: FORGOT PASSWORD - STEP 1 (ENTER EMAIL) */}
        {view === 'forgot-email' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <KeyRound size={24} color="#0891b2" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937' }}>Reset Password</h2>
              <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '4px', fontWeight: '500' }}>Enter your registered email address to receive an OTP verification code.</p>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Registered Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }}
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
                {loading ? 'Sending OTP...' : <>Send Verification Code <ArrowRight size={18} /></>}
              </button>
            </form>

            <button 
              type="button" 
              onClick={resetToLogin} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', marginTop: '20px', background: 'none', border: 'none', color: '#374151', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}
            >
              <ArrowLeft size={16} /> Back to Sign In
            </button>
          </>
        )}

        {/* VIEW 3: FORGOT PASSWORD - STEP 2 (VERIFY OTP) */}
        {view === 'forgot-otp' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Mail size={24} color="#0891b2" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937' }}>Enter Verification Code</h2>
              <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '4px', fontWeight: '500' }}>We sent a 6-digit OTP code to <strong style={{ color: '#1f2937' }}>{resetEmail}</strong>.</p>
            </div>

            {successMsg && (
              <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: '#059669', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>6-Digit OTP Code</label>
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  className="input-field" 
                  style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '6px', fontWeight: 'bold' }}
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                  placeholder="123456"
                />
              </div>

              <button type="submit" disabled={loading || otp.length < 6} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
                {loading ? 'Verifying OTP...' : <>Verify Code <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '0.85rem' }}>
              <button 
                type="button" 
                onClick={() => { setView('forgot-email'); setError(''); setSuccessMsg(''); }} 
                style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <ArrowLeft size={16} /> Change Email
              </button>
              <button 
                type="button" 
                onClick={handleSendOTP} 
                style={{ background: 'none', border: 'none', color: '#0891b2', cursor: 'pointer', fontWeight: '700' }}
              >
                Resend OTP
              </button>
            </div>
          </>
        )}

        {/* VIEW 4: FORGOT PASSWORD - STEP 3 (NEW PASSWORD) */}
        {view === 'forgot-password' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Lock size={24} color="#059669" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937' }}>Create New Password</h2>
              <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '4px', fontWeight: '500' }}>Enter a strong new password for your account.</p>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    required 
                    minLength={4}
                    className="input-field" 
                    style={{ paddingLeft: '40px', paddingRight: '40px' }}
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#374151',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || !newPassword} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px', padding: '12px' }}>
                {loading ? 'Updating Password...' : <>Reset Password <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}

        {/* VIEW 5: FORGOT PASSWORD - STEP 4 (SUCCESS) */}
        {view === 'forgot-success' && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={32} color="#059669" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>Password Reset Done!</h2>
            <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '24px', lineHeight: '1.5', fontWeight: '500' }}>
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <button 
              onClick={resetToLogin} 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              Sign In to Account <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
