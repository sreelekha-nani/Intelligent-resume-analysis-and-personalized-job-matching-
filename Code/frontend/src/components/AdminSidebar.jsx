import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileText, LogOut, ShieldCheck } from 'lucide-react';

export default function AdminSidebar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogoutClick = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldCheck size={22} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1f2937', margin: 0, lineHeight: 1.2 }}>
            Recruit<span style={{ color: '#06b6d4' }}>Admin</span>
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
            Portal Control
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="sidebar-menu" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
        <Link to="/admin/dashboard" className={`sidebar-link ${isActive('/admin/dashboard') ? 'active-nav' : ''}`}>
          <LayoutDashboard size={20} color="#06b6d4" />
          <span className="sidebar-link-text">Dashboard</span>
        </Link>

        <Link to="/admin/jobs" className={`sidebar-link ${isActive('/admin/jobs') ? 'active-nav' : ''}`}>
          <Briefcase size={20} color="#06b6d4" />
          <span className="sidebar-link-text">Jobs</span>
        </Link>

        <Link to="/admin/users" className={`sidebar-link ${isActive('/admin/users') ? 'active-nav' : ''}`}>
          <Users size={20} color="#06b6d4" />
          <span className="sidebar-link-text">Users</span>
        </Link>

        <Link to="/admin/applications" className={`sidebar-link ${isActive('/admin/applications') ? 'active-nav' : ''}`}>
          <FileText size={20} color="#06b6d4" />
          <span className="sidebar-link-text">Applications</span>
        </Link>
      </div>

      {/* Footer / User Profile & Logout */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '10px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', fontSize: '0.85rem' }}>
            A
          </div>
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: '0.84rem', color: '#1f2937', fontWeight: '700', display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {user?.full_name || 'System Admin'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block' }}>
              {user?.email || 'admin@gmail.com'}
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogoutClick}
          className="sidebar-link" 
          style={{ width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626', justifyContent: 'flex-start' }}
        >
          <LogOut size={20} color="#dc2626" />
          <span className="sidebar-link-text" style={{ color: '#dc2626', fontWeight: '600' }}>Logout</span>
        </button>
      </div>
    </aside>
  );
}
