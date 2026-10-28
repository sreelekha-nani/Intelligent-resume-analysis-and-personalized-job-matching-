import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to perform this action?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger", // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel
}) {
  if (!isOpen) return null;

  let buttonBg = 'linear-gradient(135deg, #ef4444, #dc2626)';
  let iconColor = '#dc2626';
  let iconBg = 'rgba(239, 68, 68, 0.12)';

  if (confirmVariant === 'primary') {
    buttonBg = 'linear-gradient(135deg, #06b6d4, #0891b2)';
    iconColor = '#0891b2';
    iconBg = 'rgba(6, 182, 212, 0.12)';
  } else if (confirmVariant === 'warning') {
    buttonBg = 'linear-gradient(135deg, #f59e0b, #d97706)';
    iconColor = '#d97706';
    iconBg = 'rgba(245, 158, 11, 0.12)';
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '28px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          position: 'relative',
          textAlign: 'center'
        }}
      >
        {/* Close Icon Button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'transparent',
            border: 'none',
            color: '#6b7280',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        {/* Warning Icon Badge */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <AlertTriangle size={28} color={iconColor} />
        </div>

        {/* Title & Message */}
        <h3 style={{ fontSize: '1.25rem', color: '#1f2937', fontWeight: '800', margin: '0 0 8px 0' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#4b5563', lineHeight: '1.5', margin: '0 0 24px 0', fontWeight: '500' }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            onClick={onCancel}
            className="btn-secondary"
            style={{ padding: '10px 22px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700' }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="btn-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '10px',
              background: buttonBg,
              fontSize: '0.88rem',
              fontWeight: '700',
              color: '#ffffff'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
