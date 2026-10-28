import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import AdminHeader from '../components/AdminHeader';
import { 
  Users as UsersIcon, Search, Eye, X, FileText, Award, 
  Briefcase, GraduationCap, MapPin, CheckCircle2, XCircle
} from 'lucide-react';

export default function AdminUsers({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected Profile Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = () => {
    setLoading(true);
    adminAPI.getUsers({ search })
      .then(res => setUsers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleViewProfile = (userItem) => {
    setSelectedUser(userItem);
    setProfileLoading(true);
    adminAPI.getUserProfile(userItem.id)
      .then(res => setProfileData(res.data))
      .catch(err => console.error(err))
      .finally(() => setProfileLoading(false));
  };

  return (
    <>
      <AdminHeader title="Registered Candidates" user={user} onLogout={onLogout} />

      <div>
        {/* SEARCH BAR */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '450px' }}>
            <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search candidate name or email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
        </div>

        {/* CANDIDATES TABLE */}
        <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '12px 10px' }}>Photo</th>
                <th style={{ padding: '12px 10px' }}>Full Name</th>
                <th style={{ padding: '12px 10px' }}>Email</th>
                <th style={{ padding: '12px 10px' }}>Phone</th>
                <th style={{ padding: '12px 10px' }}>Highest Qualification</th>
                <th style={{ padding: '12px 10px' }}>Experience</th>
                <th style={{ padding: '12px 10px' }}>Skills</th>
                <th style={{ padding: '12px 10px' }}>Resume</th>
                <th style={{ padding: '12px 10px' }}>Registered</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'white', fontSize: '0.85rem'
                    }}>
                      {u.full_name.charAt(0).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#1f2937', fontWeight: '700' }}>{u.full_name}</td>
                  <td style={{ padding: '12px 10px', color: '#4b5563' }}>{u.email}</td>
                  <td style={{ padding: '12px 10px', color: '#6b7280' }}>{u.phone || 'N/A'}</td>
                  <td style={{ padding: '12px 10px', color: '#0891b2', fontWeight: '600' }}>{u.highest_qualification}</td>
                  <td style={{ padding: '12px 10px', color: '#6b7280' }}>{u.experience_years} yrs</td>
                  <td style={{ padding: '12px 10px', color: '#06b6d4', fontWeight: '600' }}>{u.skills_count} skills</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                      background: u.resume_uploaded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: u.resume_uploaded ? '#059669' : '#dc2626'
                    }}>
                      {u.resume_uploaded ? 'Uploaded' : 'Missing'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#6b7280' }}>{u.registration_date}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleViewProfile(u)} 
                      className="btn-secondary" 
                      style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} /> View Profile
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>No candidates found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {selectedUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800', color: 'white' }}>
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', color: '#1f2937', margin: 0, fontWeight: '800' }}>{selectedUser.full_name}</h2>
                    <span style={{ fontSize: '0.85rem', color: '#0891b2', fontWeight: '600' }}>{profileData?.profile?.title || 'Candidate Profile'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#0891b2' }}>Loading Candidate Profile...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '0.88rem' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '10px', fontWeight: '700' }}>Basic Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', color: '#374151' }}>
                      <div><b>Email:</b> {selectedUser.email}</div>
                      <div><b>Phone:</b> {profileData?.profile?.phone || selectedUser.phone || 'N/A'}</div>
                      <div><b>Location:</b> {[profileData?.profile?.current_city, profileData?.profile?.state, profileData?.profile?.country].filter(Boolean).join(', ') || 'N/A'}</div>
                      <div><b>Registered:</b> {selectedUser.registration_date}</div>
                      <div><b>Latest ATS Score:</b> <span style={{ color: '#059669', fontWeight: '700' }}>{profileData?.latest_ats_score ? `${Math.round(profileData.latest_ats_score)}/100` : 'N/A'}</span></div>
                    </div>
                  </div>

                  {profileData?.profile?.bio && (
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '8px', fontWeight: '700' }}>Professional Summary</h4>
                      <p style={{ color: '#4b5563', margin: 0, lineHeight: '1.5' }}>{profileData.profile.bio}</p>
                    </div>
                  )}

                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '10px', fontWeight: '700' }}>Skills ({profileData?.profile?.skills?.length || 0})</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(profileData?.profile?.skills || []).map((sk, i) => (
                        <span key={i} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '4px 10px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {sk}
                        </span>
                      ))}
                      {(profileData?.profile?.skills || []).length === 0 && <span style={{ color: '#6b7280' }}>No skills listed.</span>}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button onClick={() => setSelectedUser(null)} className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px' }}>
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
}
