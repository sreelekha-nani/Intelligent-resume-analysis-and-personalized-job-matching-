import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import AdminHeader from '../components/AdminHeader';
import { 
  Building, Filter, Search, Eye, FileText, CheckCircle2, 
  X, Download, Calendar, Award, User, Sparkles
} from 'lucide-react';

export default function AdminApplications({ user, onLogout }) {
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [companyFilter, setCompanyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Application Details Modal
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [appDetails, setAppDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [companyFilter, statusFilter, search]);

  const fetchApplications = () => {
    setLoading(true);
    adminAPI.getApplications({
      company_filter: companyFilter,
      status_filter: statusFilter,
      search: search
    })
      .then(res => setGroupedApplications(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await adminAPI.updateApplicationStatus(appId, { status: newStatus });
      fetchApplications();
      if (appDetails && appDetails.id === appId) {
        setAppDetails({ ...appDetails, status: newStatus });
      }
    } catch (err) {
      alert('Failed to update application status.');
    }
  };

  const handleOpenDetails = (appId) => {
    setSelectedAppId(appId);
    setDetailsLoading(true);
    adminAPI.getApplicationDetails(appId)
      .then(res => setAppDetails(res.data))
      .catch(err => console.error(err))
      .finally(() => setDetailsLoading(false));
  };

  const statusList = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"];

  return (
    <>
      <AdminHeader title="Candidate Applications" user={user} onLogout={onLogout} />

      <div>
        {/* FILTERS & SEARCH BAR */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search candidate name, email, or job title..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} color="#6b7280" />
            <select className="input-field" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ width: '160px', color: '#1f2937', fontWeight: '700', background: '#ffffff' }}>
              <option value="All">All Companies</option>
              {groupedApplications.map(g => (
                <option key={g.company} value={g.company} style={{ background: '#ffffff', color: '#1f2937' }}>{g.company}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#6b7280" />
            <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '170px', color: '#1f2937', fontWeight: '700', background: '#ffffff' }}>
              <option value="All">All Statuses</option>
              {statusList.map(st => (
                <option key={st} value={st} style={{ background: '#ffffff', color: '#1f2937' }}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* APPLICATIONS GROUPED BY COMPANY */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#0891b2' }}>Loading Applications...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {groupedApplications.map(group => (
              <div key={group.company} className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#1f2937', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building size={20} color="#06b6d4" /> Company: {group.company || 'Direct Hiring'}
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#0891b2', background: 'rgba(6, 182, 212, 0.12)', padding: '4px 12px', borderRadius: '12px', fontWeight: '700' }}>
                    {group.applications.length} {group.applications.length === 1 ? 'Application' : 'Applications'}
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: '#1f2937' }}>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Candidate Name</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Email</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Applied Job</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Applied Date</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>ATS Score</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Resume</th>
                        <th style={{ padding: '10px', color: '#1f2937', fontWeight: '800' }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'center', color: '#1f2937', fontWeight: '800' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.applications.map(app => (
                        <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 10px', color: '#1f2937', fontWeight: '700' }}>{app.candidate_name}</td>
                          <td style={{ padding: '12px 10px', color: '#374151', fontWeight: '600' }}>{app.candidate_email}</td>
                          <td style={{ padding: '12px 10px', color: '#0891b2', fontWeight: '700' }}>{app.job_title}</td>
                          <td style={{ padding: '12px 10px', color: '#374151', fontWeight: '600' }}>{app.applied_date}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              fontSize: '0.88rem', fontWeight: '800',
                              color: app.ats_score >= 75 ? '#059669' : (app.ats_score >= 50 ? '#d97706' : '#dc2626')
                            }}>
                              {app.ats_score}/100
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {app.resume_filename ? (
                              <a href={`http://127.0.0.1:8000/uploads/resumes/${app.resume_filename}`} target="_blank" rel="noreferrer" style={{ color: '#0891b2', fontSize: '0.82rem', textDecoration: 'none', fontWeight: '700' }}>
                                View PDF
                              </a>
                            ) : (
                              <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>N/A</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              className="input-field"
                              style={{ padding: '6px 10px', fontSize: '0.82rem', width: 'auto', color: '#1f2937', fontWeight: '700', background: '#ffffff', border: '1px solid #cbd5e1' }}
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            >
                              {statusList.map(st => (
                                <option key={st} value={st} style={{ background: '#ffffff', color: '#1f2937' }}>{st}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                            <button 
                              onClick={() => handleOpenDetails(app.id)} 
                              className="btn-secondary" 
                              style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                            >
                              <Eye size={14} /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {groupedApplications.length === 0 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                No candidate applications found.
              </div>
            )}
          </div>
        )}

        {/* APPLICATION DETAILS MODAL */}
        {selectedAppId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', color: '#1f2937', margin: 0, fontWeight: '800' }}>
                  Application Details
                </h2>
                <button onClick={() => setSelectedAppId(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              {detailsLoading || !appDetails ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#0891b2' }}>Loading Details...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.88rem' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', color: '#374151' }}>
                      <div><b>Candidate:</b> {appDetails.candidate_name}</div>
                      <div><b>Email:</b> {appDetails.candidate_email}</div>
                      <div><b>Applied Job:</b> {appDetails.job_title}</div>
                      <div><b>Company:</b> {appDetails.company}</div>
                      <div><b>Applied Date:</b> {appDetails.applied_date}</div>
                      <div><b>Status:</b> <span style={{ color: '#0891b2', fontWeight: '700' }}>{appDetails.status}</span></div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '8px', fontWeight: '700' }}>ATS Breakdown Score</h4>
                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: appDetails.ats_score >= 75 ? '#059669' : '#d97706', marginBottom: '8px' }}>
                      {appDetails.ats_score}/100
                    </div>
                    {appDetails.matched_keywords && appDetails.matched_keywords.length > 0 && (
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Matched Keywords:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {appDetails.matched_keywords.map((kw, idx) => (
                            <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '600' }}>
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right', marginTop: '12px' }}>
                    <button onClick={() => setSelectedAppId(null)} className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px' }}>
                      Close Details
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </>
  );
}
