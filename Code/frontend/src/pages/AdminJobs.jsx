import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import AdminHeader from '../components/AdminHeader';
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, X, Check, AlertTriangle, 
  Briefcase, DollarSign, MapPin, Building, Calendar, Layers
} from 'lucide-react';

export default function AdminJobs({ user, onLogout }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [editingJobId, setEditingJobId] = useState(null);

  // Delete Confirmation state
  const [deletingJobId, setDeletingJobId] = useState(null);

  // Form State
  const initialForm = {
    title: '',
    company: '',
    category: 'Engineering',
    job_type: 'Full-time',
    workplace_type: 'Onsite',
    location: '',
    country: 'India',
    state: '',
    city: '',
    min_experience: 0,
    max_experience: 0,
    min_salary: 0,
    max_salary: 0,
    currency: 'INR',
    hide_salary: false,
    min_qualification: "Bachelor's Degree",
    skills: [],
    skillInput: '',
    description: '',
    responsibilities: [],
    respInput: '',
    requirements: [],
    reqInput: '',
    openings_count: 1,
    deadline: '',
    status: 'Published'
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [search, statusFilter]);

  const fetchJobs = () => {
    setLoading(true);
    adminAPI.getJobs({ search, status_filter: statusFilter })
      .then(res => setJobs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOpenCreate = () => {
    setForm(initialForm);
    setEditingJobId(null);
    setModalMode('create');
    setShowModal(true);
  };

  const handleOpenEdit = (job) => {
    setEditingJobId(job.id);
    setForm({
      title: job.title || '',
      company: job.company || '',
      category: job.category || 'Engineering',
      job_type: job.employment_type || 'Full-time',
      workplace_type: job.workplace_type || 'Onsite',
      location: job.location || '',
      country: job.country || 'India',
      state: job.state || '',
      city: job.city || '',
      min_experience: job.min_experience || 0,
      max_experience: job.max_experience || 0,
      min_salary: job.min_salary || 0,
      max_salary: job.max_salary || 0,
      currency: job.currency || 'INR',
      hide_salary: Boolean(job.hide_salary),
      min_qualification: job.min_qualification || "Bachelor's Degree",
      skills: job.skills_required ? job.skills_required.split(',').map(s => s.trim()) : [],
      skillInput: '',
      description: job.description || '',
      responsibilities: job.responsibilities ? (job.responsibilities.startsWith('[') ? JSON.parse(job.responsibilities) : job.responsibilities.split('\n')) : [],
      respInput: '',
      requirements: job.requirements ? (job.requirements.startsWith('[') ? JSON.parse(job.requirements) : job.requirements.split('\n')) : [],
      reqInput: '',
      openings_count: job.openings_count || 1,
      deadline: job.deadline || '',
      status: job.status || 'Published'
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleOpenView = (job) => {
    handleOpenEdit(job);
    setModalMode('view');
  };

  const handleAddSkill = () => {
    if (form.skillInput.trim()) {
      setForm({ ...form, skills: [...form.skills, form.skillInput.trim()], skillInput: '' });
    }
  };
  const handleRemoveSkill = (idx) => {
    setForm({ ...form, skills: form.skills.filter((_, i) => i !== idx) });
  };

  const handleAddResp = () => {
    if (form.respInput.trim()) {
      setForm({ ...form, responsibilities: [...form.responsibilities, form.respInput.trim()], respInput: '' });
    }
  };
  const handleRemoveResp = (idx) => {
    setForm({ ...form, responsibilities: form.responsibilities.filter((_, i) => i !== idx) });
  };

  const handleAddReq = () => {
    if (form.reqInput.trim()) {
      setForm({ ...form, requirements: [...form.requirements, form.reqInput.trim()], reqInput: '' });
    }
  };
  const handleRemoveReq = (idx) => {
    setForm({ ...form, requirements: form.requirements.filter((_, i) => i !== idx) });
  };

  const handleSaveJob = async (statusOverride) => {
    if (!form.title.trim() || !form.company.trim() || !form.location.trim()) {
      alert('Please fill in required fields: Job Title, Company, and Location.');
      return;
    }

    setSaving(true);
    const targetStatus = statusOverride || form.status;

    const payload = {
      title: form.title.trim(),
      company: form.company.trim(),
      category: form.category.trim(),
      job_type: form.job_type,
      workplace_type: form.workplace_type,
      location: form.location.trim(),
      country: form.country,
      state: form.state,
      city: form.city,
      min_experience: parseInt(form.min_experience) || 0,
      max_experience: parseInt(form.max_experience) || 0,
      min_salary: parseInt(form.min_salary) || 0,
      max_salary: parseInt(form.max_salary) || 0,
      currency: form.currency,
      hide_salary: form.hide_salary,
      min_qualification: form.min_qualification,
      skills_required: form.skills.join(', '),
      description: form.description.trim(),
      responsibilities: JSON.stringify(form.responsibilities),
      requirements: JSON.stringify(form.requirements),
      openings_count: parseInt(form.openings_count) || 1,
      deadline: form.deadline || null,
      status: targetStatus
    };

    try {
      if (editingJobId) {
        await adminAPI.updateJob(editingJobId, payload);
      } else {
        await adminAPI.createJob(payload);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      alert('Failed to save job details.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingJobId) return;
    try {
      await adminAPI.deleteJob(deletingJobId);
      setDeletingJobId(null);
      fetchJobs();
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  return (
    <>
      <AdminHeader title="Jobs Management" user={user} onLogout={onLogout} />

      <div>
        {/* Top Header & Actions */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              Job Postings Directory
            </span>
            <h1 style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: '800', margin: 0 }}>
              Jobs Module
            </h1>
          </div>

          <button 
            onClick={handleOpenCreate} 
            className="btn-primary" 
            style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
          >
            <Plus size={18} /> Create Job
          </button>
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search job title, company, or location..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#6b7280" />
            <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '160px', color: '#1f2937', fontWeight: '600' }}>
              <option value="All">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* JOBS TABLE */}
        <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', color: '#1f2937' }}>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Job Title</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Company</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Location</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Type</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Experience</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Salary</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Apps</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Status</th>
                <th style={{ padding: '12px 10px', fontWeight: '800' }}>Posted</th>
                <th style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => (
                <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 10px', color: '#1f2937', fontWeight: '700' }}>{j.title}</td>
                  <td style={{ padding: '12px 10px', color: '#374151', fontWeight: '600' }}>{j.company}</td>
                  <td style={{ padding: '12px 10px', color: '#4b5563', fontWeight: '500' }}>{j.location}</td>
                  <td style={{ padding: '12px 10px', color: '#0891b2', fontWeight: '600' }}>{j.employment_type}</td>
                  <td style={{ padding: '12px 10px', color: '#4b5563' }}>{j.experience_display}</td>
                  <td style={{ padding: '12px 10px', color: '#059669', fontWeight: '700' }}>{j.salary_display}</td>
                  <td style={{ padding: '12px 10px', fontWeight: '800', color: '#1f2937' }}>{j.applications_count}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700',
                      background: j.status === 'Published' ? 'rgba(16, 185, 129, 0.15)' : (j.status === 'Draft' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                      color: j.status === 'Published' ? '#059669' : (j.status === 'Draft' ? '#d97706' : '#dc2626')
                    }}>
                      {j.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#4b5563', fontWeight: '500' }}>{j.posted_date}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button onClick={() => handleOpenView(j)} title="View Job" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleOpenEdit(j)} title="Edit Job" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeletingJobId(j.id)} title="Delete Job" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} style={{ padding: '30px', textAlign: 'center', color: '#6b7280' }}>No job postings found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.3rem', color: '#1f2937', margin: 0, fontWeight: '800' }}>
                  {modalMode === 'create' ? 'Create New Job Posting' : (modalMode === 'edit' ? 'Edit Job Posting' : 'View Job Posting')}
                </h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>

              <fieldset disabled={modalMode === 'view'} style={{ border: 'none', padding: 0, margin: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Job Title *</label>
                    <input type="text" className="input-field" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Backend Engineer" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Company Name *</label>
                    <input type="text" className="input-field" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. CloudScale Tech" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Job Category</label>
                    <input type="text" className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Software Engineering" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Employment Type</label>
                    <select className="input-field" value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Workplace Type</label>
                    <select className="input-field" value={form.workplace_type} onChange={e => setForm({ ...form, workplace_type: e.target.value })}>
                      <option value="Onsite">Onsite</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Location *</label>
                    <input type="text" className="input-field" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Hyderabad / Remote" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Min Experience (Yrs)</label>
                    <input type="number" className="input-field" value={form.min_experience} onChange={e => setForm({ ...form, min_experience: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Max Experience (Yrs)</label>
                    <input type="number" className="input-field" value={form.max_experience} onChange={e => setForm({ ...form, max_experience: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Min Salary</label>
                    <input type="number" className="input-field" value={form.min_salary} onChange={e => setForm({ ...form, min_salary: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Max Salary</label>
                    <input type="number" className="input-field" value={form.max_salary} onChange={e => setForm({ ...form, max_salary: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Required Skills (Dynamic Chips)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {form.skills.map((sk, idx) => (
                      <span key={idx} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '4px 10px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {sk}
                        {modalMode !== 'view' && (
                          <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkill(idx)} />
                        )}
                      </span>
                    ))}
                  </div>
                  {modalMode !== 'view' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder="Type a skill & click Add (e.g. React, Docker)" 
                        value={form.skillInput}
                        onChange={e => setForm({ ...form, skillInput: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                      />
                      <button type="button" onClick={handleAddSkill} className="btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px' }}>
                        Add Skill
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Job Description</label>
                  <textarea rows={5} className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Enter comprehensive job overview..." />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Job Status</label>
                    <select className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Openings Count</label>
                    <input type="number" className="input-field" value={form.openings_count} onChange={e => setForm({ ...form, openings_count: e.target.value })} />
                  </div>
                </div>
              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px' }}>
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  modalMode === 'edit' ? (
                    <button onClick={() => handleSaveJob()} disabled={saving} className="btn-primary" style={{ padding: '8px 22px', borderRadius: '8px' }}>
                      {saving ? 'Updating...' : 'Update Job'}
                    </button>
                  ) : (
                    <>
                      <button onClick={() => handleSaveJob('Draft')} disabled={saving} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px', color: '#d97706' }}>
                        Save Draft
                      </button>
                      <button onClick={() => handleSaveJob('Published')} disabled={saving} className="btn-primary" style={{ padding: '8px 22px', borderRadius: '8px' }}>
                        Publish Job
                      </button>
                    </>
                  )
                )}
              </div>

            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION DIALOG */}
        {deletingJobId && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '24px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.4)', background: '#ffffff' }}>
              <AlertTriangle size={42} color="#dc2626" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#1f2937', fontWeight: '800', marginBottom: '8px' }}>Delete Job Posting</h3>
              <p style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '20px' }}>
                Are you sure you want to delete this job posting? This action will prevent future applications to this role.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button onClick={() => setDeletingJobId(null)} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px' }}>
                  Cancel
                </button>
                <button onClick={handleDeleteConfirm} className="btn-primary" style={{ background: '#dc2626', padding: '8px 22px', borderRadius: '8px' }}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
