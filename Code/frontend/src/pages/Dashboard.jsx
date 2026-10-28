import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { Briefcase, Sparkles, FileText, CheckCircle2, TrendingUp, Bell, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading Dashboard Analytics...</div>;
  }

  return (
    <div className="app-container">
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(165, 243, 252, 0.35))', borderColor: 'rgba(6, 182, 212, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>
            Welcome back, {user?.full_name || 'Candidate'} 👋
          </h1>
          <p style={{ color: '#4b5563', fontSize: '0.95rem' }}>
            Here is your AI-Powered Job Search, ATS Compliance, and Application status overview.
          </p>
        </div>
        <Link to="/recommendations" className="btn-primary">
          <Sparkles size={18} /> View AI Recommendations
        </Link>
      </div>

      {/* Analytics Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Active Job Listings</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px', color: '#06b6d4' }}><Briefcase size={20} /></div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>{stats?.total_jobs_available || 0}</h2>
          <span style={{ fontSize: '0.78rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={14} /> Live indexing active
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>High AI Matches</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px', color: '#0891b2' }}><Sparkles size={20} /></div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>{stats?.recommended_high_matches || 0}</h2>
          <span style={{ fontSize: '0.78rem', color: '#0891b2', marginTop: '4px', display: 'block' }}>
            Match Score ≥ 75%
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Average ATS Score</span>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '10px', color: '#06b6d4' }}><FileText size={20} /></div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>{stats?.average_ats_score || 0}%</h2>
          <span style={{ fontSize: '0.78rem', color: '#0891b2', marginTop: '4px', display: 'block' }}>
            Optimized for recruiter bots
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Applications Tracked</span>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '8px', borderRadius: '10px', color: '#059669' }}><CheckCircle2 size={20} /></div>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1f2937' }}>{stats?.total_applications || 0}</h2>
          <span style={{ fontSize: '0.78rem', color: '#059669', marginTop: '4px', display: 'block' }}>
            In active tracker pipeline
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid-2">
        {/* Application Pipeline Status */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px' }}>Application Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(stats?.applications_by_status || {}).map(([statusKey, count]) => (
              <div key={statusKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>{statusKey}</span>
                <span className="badge badge-mod" style={{ fontSize: '0.85rem' }}>{count} Applications</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Recent Activity */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} color="#06b6d4" /> System Alerts & Notifications
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats?.notifications && stats.notifications.length > 0 ? (
              stats.notifications.map((n) => (
                <div key={n.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#1f2937' }}>{n.title}</div>
                  <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '2px' }}>{n.message}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.88rem' }}>
                No recent notifications yet. Submit an application or upload your resume to generate alerts!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
