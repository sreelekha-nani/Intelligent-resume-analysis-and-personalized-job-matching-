import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught UI Component Error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#0b0f19',
          color: '#f3f4f6',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '36px',
            textAlign: 'center',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={32} color="#f87171" />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
              Something Went Wrong
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#9ca3af', lineHeight: 1.5, marginBottom: '20px' }}>
              An unexpected error occurred while rendering this view. You can reload the page or return to the dashboard safely.
            </p>

            {this.state.error?.message && (
              <div style={{
                padding: '12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: '#f87171',
                fontFamily: 'monospace',
                marginBottom: '24px',
                textAlign: 'left',
                overflowX: 'auto'
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={this.handleGoDashboard}
                className="btn-secondary" 
                style={{ padding: '10px 18px', fontSize: '0.88rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Home size={16} /> Go to Dashboard
              </button>
              <button 
                onClick={this.handleReload}
                className="btn-primary" 
                style={{ padding: '10px 20px', fontSize: '0.88rem', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
