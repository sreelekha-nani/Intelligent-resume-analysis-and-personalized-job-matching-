import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import AdminHeader from '../components/AdminHeader';
import { 
  Briefcase, CheckCircle2, XCircle, Users, FileText, Calendar, 
  ArrowRight, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load admin stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <div style={{ color: '#0891b2', fontSize: '1rem', fontWeight: '600' }}>Loading Admin Portal Analytics...</div>
      </div>
    );
  }

  return (
    <>
      <AdminHeader title="Dashboard Overview" user={user} onLogout={onLogout} />

      <div>
        {/* 6 OVERVIEW STAT CARDS - RESPONSIVE GRID */}
        <div className="admin-stats-grid">
          
          {/* Total Jobs */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Total Jobs</span>
              <Briefcase size={20} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#1f2937', fontWeight: '800' }}>{stats?.total_jobs || 0}</div>
          </div>

          {/* Active Jobs */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Active Jobs</span>
              <CheckCircle2 size={20} color="#059669" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#059669', fontWeight: '800' }}>{stats?.active_jobs || 0}</div>
          </div>

          {/* Closed Jobs */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Closed Jobs</span>
              <XCircle size={20} color="#dc2626" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#dc2626', fontWeight: '800' }}>{stats?.closed_jobs || 0}</div>
          </div>

          {/* Total Users */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Total Users</span>
              <Users size={20} color="#0891b2" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#0891b2', fontWeight: '800' }}>{stats?.total_users || 0}</div>
          </div>

          {/* Total Applications */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Total Applications</span>
              <FileText size={20} color="#06b6d4" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#06b6d4', fontWeight: '800' }}>{stats?.total_applications || 0}</div>
          </div>

          {/* Applications Today */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', fontWeight: '600' }}>Applications Today</span>
              <Calendar size={20} color="#d97706" />
            </div>
            <div style={{ fontSize: '1.8rem', color: '#d97706', fontWeight: '800' }}>{stats?.applications_today || 0}</div>
          </div>
        </div>

        {/* RECENT TABLES GRID */}
        <div className="admin-tables-grid">
          
          {/* Recent Jobs */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1f2937', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={18} color="#06b6d4" /> Recent Jobs
                </h3>
                <Link to="/admin/jobs" style={{ fontSize: '0.82rem', color: '#0891b2', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#6b7280' }}>
                      <th style={{ padding: '10px 8px' }}>Job Title</th>
                      <th style={{ padding: '10px 8px' }}>Company</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                      <th style={{ padding: '10px 8px' }}>Posted Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent_jobs || []).map(job => (
                      <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', color: '#1f2937', fontWeight: '600' }}>{job.title}</td>
                        <td style={{ padding: '12px 8px', color: '#4b5563' }}>{job.company}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                            background: job.status === 'Published' ? 'rgba(16, 185, 129, 0.15)' : (job.status === 'Draft' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                            color: job.status === 'Published' ? '#059669' : (job.status === 'Draft' ? '#d97706' : '#dc2626')
                          }}>
                            {job.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', color: '#6b7280' }}>{job.posted_date}</td>
                      </tr>
                    ))}
                    {(stats?.recent_jobs || []).length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No recent jobs posted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Applications */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#1f2937', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="#06b6d4" /> Recent Applications
                </h3>
                <Link to="/admin/applications" style={{ fontSize: '0.82rem', color: '#0891b2', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <ArrowRight size={14} />
                </Link>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#6b7280' }}>
                      <th style={{ padding: '10px 8px' }}>Candidate Name</th>
                      <th style={{ padding: '10px 8px' }}>Applied Job</th>
                      <th style={{ padding: '10px 8px' }}>Company</th>
                      <th style={{ padding: '10px 8px' }}>Date</th>
                      <th style={{ padding: '10px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recent_applications || []).map(app => (
                      <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 8px', color: '#1f2937', fontWeight: '600' }}>{app.candidate_name}</td>
                        <td style={{ padding: '12px 8px', color: '#4b5563' }}>{app.job_title}</td>
                        <td style={{ padding: '12px 8px', color: '#6b7280' }}>{app.company}</td>
                        <td style={{ padding: '12px 8px', color: '#6b7280' }}>{app.applied_date}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                            background: app.status === 'Selected' ? 'rgba(16, 185, 129, 0.15)' : (app.status === 'Rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)'),
                            color: app.status === 'Selected' ? '#059669' : (app.status === 'Rejected' ? '#dc2626' : '#0891b2')
                          }}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(stats?.recent_applications || []).length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No recent applications submitted.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
