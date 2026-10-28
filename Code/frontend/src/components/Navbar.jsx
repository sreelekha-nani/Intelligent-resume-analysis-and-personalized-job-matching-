import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, Sparkles, FileText, CheckCircle2, LogOut, User } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <>
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="app-sidebar">
        <div>
          {/* Logo & Branding */}
          <Link to="/dashboard" className="sidebar-logo">
            <div style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={20} color="white" />
            </div>
            <div className="sidebar-logo-text">
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#0891b2', lineHeight: '1.2' }}>
                AI Job Navigator
              </h2>
              <span style={{ fontSize: '0.68rem', color: '#4b5563', display: 'block', fontWeight: '500' }}>Smart Recommendation Platform</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active-nav' : ''}`}>
              <LayoutDashboard size={20} color={isActive('/dashboard') ? '#0891b2' : '#1f2937'} />
              <span className="sidebar-link-text">Dashboard</span>
            </Link>

            <Link to="/jobs" className={`sidebar-link ${isActive('/jobs') ? 'active-nav' : ''}`}>
              <Search size={20} color={isActive('/jobs') ? '#0891b2' : '#1f2937'} />
              <span className="sidebar-link-text">Jobs</span>
            </Link>

            <Link to="/recommendations" className={`sidebar-link ${isActive('/recommendations') ? 'active-nav' : ''}`}>
              <Sparkles size={20} color={isActive('/recommendations') ? '#0891b2' : '#1f2937'} />
              <span className="sidebar-link-text">Recommended Jobs</span>
            </Link>

            <Link to="/ats-engine" className={`sidebar-link ${isActive('/ats-engine') || isActive('/ats-engine/results') || isActive('/ats-analysis') ? 'active-nav' : ''}`}>
              <FileText size={20} color={isActive('/ats-engine') || isActive('/ats-engine/results') || isActive('/ats-analysis') ? '#0891b2' : '#1f2937'} />
              <span className="sidebar-link-text">ATS Engine</span>
            </Link>

            <Link to="/applications" className={`sidebar-link ${isActive('/applications') ? 'active-nav' : ''}`}>
              <CheckCircle2 size={20} color={isActive('/applications') ? '#0891b2' : '#1f2937'} />
              <span className="sidebar-link-text">Tracker</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Helper Info */}
        <div className="sidebar-link-text" style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <span style={{ fontSize: '0.75rem', color: '#374151', display: 'block', fontWeight: '600' }}>AI Recommendation Engine</span>
          <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#059669', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Active & Synced
          </span>
        </div>
      </aside>

      {/* TOP HEADER */}
      <header className="top-header">
        <div style={{ fontSize: '0.9rem', color: '#374151', fontWeight: '600' }}>
          Welcome, <span style={{ color: '#111827', fontWeight: '800' }}>{user.full_name}</span>
        </div>

        {/* Right side top controls: Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link 
            to="/profile" 
            className={`btn-secondary ${isActive('/profile') ? 'active-nav' : ''}`}
            style={{ padding: '8px 16px', fontSize: '0.88rem', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.3)' }}
          >
            <User size={18} color="#0891b2" />
            <span style={{ fontWeight: '700', color: '#0891b2' }}>Profile</span>
          </Link>

          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.88rem', borderRadius: '12px', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#dc2626', background: 'rgba(239, 68, 68, 0.08)' }}
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* RED LOGOUT CONFIRMATION DIALOG MODAL */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Logout"
        message="Are you sure you want to log out of your session? You will need to log back in to access your candidate dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={() => {
          setShowLogoutModal(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
