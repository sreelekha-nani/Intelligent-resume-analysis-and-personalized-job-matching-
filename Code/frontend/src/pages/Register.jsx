import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Sparkles, Lock, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Register({ onLoginSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authAPI.register(email, password, fullName);
      localStorage.setItem('token', res.data.access_token);
      onLoginSuccess(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Sparkles size={24} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1f2937' }}>Create Account</h2>
          <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '6px', fontWeight: '500' }}>Build your smart AI job matching & application profile.</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="#374151" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                required 
                className="input-field" 
                style={{ paddingLeft: '40px' }}
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                placeholder="John Doe"
              />
            </div>
          </div>

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
            <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Password</label>
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
            {loading ? 'Creating Account...' : <>Get Started <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* OR Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0 16px', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
          <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
        </div>

        {/* Google Sign-In / Sign-Up */}
        <GoogleAuthButton 
          onLoginSuccess={onLoginSuccess}
          onError={(msg) => setError(msg)}
          mode="signup"
        />

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: '#374151', fontWeight: '500' }}>
          Already registered? <Link to="/login" style={{ color: '#0891b2', fontWeight: '700' }}>Log in here</Link>
        </div>
      </div>
    </div>
  );
}
