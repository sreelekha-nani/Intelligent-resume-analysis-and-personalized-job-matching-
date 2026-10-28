import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, User } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function AdminHeader({ title, user, onLogout }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <>
      <header className="top-header">
        {/* Title / Breadcrumb */}
        <div>
          <span style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
            Recruitment Platform Admin
          </span>
          <h2 style={{ fontSize: '1.2rem', color: '#1f2937', fontWeight: '800', margin: 0, lineHeight: 1.2 }}>
            {title || 'Dashboard'}
          </h2>
        </div>

        {/* Admin Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* Authenticated Admin Pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '6px 14px', background: 'rgba(6, 182, 212, 0.08)',
            borderRadius: '20px', border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.78rem', fontWeight: '800', color: 'white'
            }}>
              A
            </div>
            <div style={{ fontSize: '0.82rem' }}>
              <span style={{ color: '#1f2937', fontWeight: '700', display: 'block', lineHeight: 1.1 }}>
                {user?.full_name || 'System Administrator'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600' }}>
                Admin Authenticated
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="btn-secondary" 
            style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.08)' }}
          >
            <LogOut size={15} /> Logout
          </button>

        </div>
      </header>

      {/* RED LOGOUT CONFIRMATION DIALOG MODAL FOR ADMIN */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Admin Logout"
        message="Are you sure you want to log out of the Administrator Panel? You will need to re-authenticate."
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
