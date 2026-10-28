import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'warning', title = null) => {
    let msgString = 'An unexpected notification occurred.';
    if (typeof message === 'string') {
      msgString = message;
    } else if (message && typeof message === 'object') {
      msgString = message.detail || message.message || JSON.stringify(message);
    }

    // Auto detect success or error type if message explicitly contains keywords
    let detectedType = type;
    const lower = msgString.toLowerCase();
    if (lower.includes('success') || lower.includes('submitted successfully') || lower.includes('activated')) {
      detectedType = 'success';
    } else if (lower.includes('failed') || lower.includes('error') || lower.includes('already applied')) {
      detectedType = 'error';
    }

    const id = Date.now() + Math.random().toString();
    const newToast = { id, message: msgString, type: detectedType, title };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Safely override window.alert so all browser alerts trigger right-side dialog toast!
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      addToast(msg, 'warning', null);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast }}>
      {children}
      
      {/* RIGHT SIDE FLOATING DIALOG NOTIFICATION CONTAINER */}
      <div 
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '410px',
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          
          let cardBg = '#ffffff';
          let cardBorder = '#e2e8f0';
          let borderLeftColor = '#0891b2';
          let iconBg = '#0891b2';
          let iconColor = '#ffffff';
          let titleColor = '#1f2937';
          let textColor = '#374151';
          let IconComponent = Info;
          let defaultTitle = 'Notice';

          if (isSuccess) {
            cardBg = '#ecfdf5';
            cardBorder = '#a7f3d0';
            borderLeftColor = '#10b981';
            iconBg = '#10b981';
            iconColor = '#ffffff';
            titleColor = '#065f46';
            textColor = '#047857';
            IconComponent = CheckCircle2;
            defaultTitle = 'Application Success';
          } else if (isError) {
            cardBg = '#fef2f2';
            cardBorder = '#fecaca';
            borderLeftColor = '#ef4444';
            iconBg = '#ef4444';
            iconColor = '#ffffff';
            titleColor = '#991b1b';
            textColor = '#b91c1c';
            IconComponent = XCircle;
            defaultTitle = 'Action Failed';
          } else {
            cardBg = '#fffbe6';
            cardBorder = '#fde68a';
            borderLeftColor = '#f59e0b';
            iconBg = '#f59e0b';
            iconColor = '#ffffff';
            titleColor = '#92400e';
            textColor = '#b45309';
            IconComponent = AlertTriangle;
            defaultTitle = 'Notice';
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: 'auto',
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderLeft: `6px solid ${borderLeftColor}`,
                borderRadius: '12px',
                padding: '16px 18px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                animation: 'slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                position: 'relative'
              }}
            >
              <div 
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <IconComponent size={22} color={iconColor} />
              </div>

              <div style={{ flex: 1, paddingRight: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '800', color: titleColor, lineHeight: '1.3' }}>
                  {toast.title || defaultTitle}
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: textColor, lineHeight: '1.4', fontWeight: '600' }}>
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: titleColor,
                  opacity: 0.7,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
