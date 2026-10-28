import React, { useEffect, useState } from 'react';
import { applicationAPI } from '../services/api';
import { CheckCircle2, Building, Calendar, Edit3, Sparkles, Trash2, Clock, Users } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { formatTimeAgo, parseUTCDate } from '../utils/formatters';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Withdraw Confirmation State
  const [withdrawApp, setWithdrawApp] = useState(null); // { id, jobTitle }

  const fetchApps = () => {
    setLoading(true);
    applicationAPI.getMyApplications()
      .then(res => setApplications(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationAPI.updateStatus(appId, { status: newStatus });
      fetchApps();
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  const openWithdrawModal = (appId, jobTitle) => {
    setWithdrawApp({ id: appId, jobTitle });
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawApp) return;

    try {
      await applicationAPI.withdrawApplication(withdrawApp.id);
      setApplications(prev => prev.filter(a => a.id !== withdrawApp.id));
      setWithdrawApp(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to withdraw application.');
      setWithdrawApp(null);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 color="#06b6d4" size={28} /> Application Tracker
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
          Monitor applied positions, update status pipeline stages, and keep notes on recruiter responses.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading application history...</div>
      ) : applications.length > 0 ? (
        <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: '#1f2937', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#6b7280', fontSize: '0.82rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Job Position & Company</th>
                <th style={{ padding: '12px 16px' }}>Date Applied</th>
                <th style={{ padding: '12px 16px' }}>Status Pipeline</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1f2937' }}>{app.job?.title}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span><Building size={12} style={{ display: 'inline', marginRight: '3px' }} />{app.job?.company}</span>
                      <span>•</span>
                      <span>{app.job?.location}</span>
                      <span>•</span>
                      <span style={{ color: '#166534', fontWeight: '700', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                        {app.job?.openings_count || 1} {(app.job?.openings_count || 1) === 1 ? 'Opening' : 'Openings'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#4b5563', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} color="#0891b2" />
                      {formatTimeAgo(app.applied_at, 'Applied')}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>
                      {parseUTCDate(app.applied_at)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <select
                      className="input-field"
                      style={{ padding: '6px 12px', width: 'auto', fontSize: '0.85rem', background: '#ffffff', color: '#1f2937' }}
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interview">Interviewing</option>
                      <option value="Offered">Offered</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => openWithdrawModal(app.id, app.job?.title)} 
                      title="Withdraw Application" 
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        color: '#dc2626', 
                        border: '1px solid rgba(239, 68, 68, 0.25)', 
                        padding: '6px 14px', 
                        borderRadius: '8px', 
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 size={14} /> Withdraw
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          <p style={{ fontSize: '1rem', marginBottom: '12px' }}>You haven't submitted any job applications yet.</p>
        </div>
      )}

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      <ConfirmModal
        isOpen={Boolean(withdrawApp)}
        title="Withdraw Application"
        message={`Are you sure you want to withdraw your application for "${withdrawApp?.jobTitle || 'this job'}"? It will be removed from your Application Tracker.`}
        confirmText="Withdraw Application"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmWithdraw}
        onCancel={() => setWithdrawApp(null)}
      />
    </div>
  );
}
