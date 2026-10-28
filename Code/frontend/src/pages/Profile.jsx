import React, { useEffect, useState } from 'react';
import { userAPI, resumeAPI } from '../services/api';
import ResumeUpload from '../components/ResumeUpload';
import PhoneInput from '../components/PhoneInput';
import ConfirmModal from '../components/ConfirmModal';
import { 
  UserCheck, Save, Sparkles, CheckCircle2, Briefcase, GraduationCap, 
  FolderGit2, Award, Globe, Link2, Sliders, FileText, Plus, Trash2, Camera, Phone, Mail, MapPin, Calendar, Info,
  Edit3, ExternalLink, Eye
} from 'lucide-react';

const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
};

import { parseUTCDate } from '../utils/formatters';

export default function Profile() {
  const [profile, setProfile] = useState({});
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeMessage, setActiveMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  
  // Custom Resume Delete Confirmation State
  const [deletingResume, setDeletingResume] = useState(null);

  // VIEW MODE vs EDIT MODE Toggle State (Default = View Mode)
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = () => {
    setLoading(true);
    userAPI.getProfile()
      .then(res => {
        const data = res.data || {};
        if (typeof data.job_preferences === 'string') {
          try { data.job_preferences = JSON.parse(data.job_preferences); } catch (e) {}
        }
        setProfile(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    resumeAPI.getMyResumes()
      .then(res => {
        if (res.data) setResumes(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error(err));
  };

  const handleResumeParsed = (parsedData) => {
    if (!parsedData) return;

    setProfile(prev => {
      const p = { ...prev };
      
      if (parsedData.first_name) p.first_name = parsedData.first_name;
      if (parsedData.middle_name) p.middle_name = parsedData.middle_name;
      if (parsedData.last_name) p.last_name = parsedData.last_name;
      if (parsedData.email) p.email = parsedData.email;
      if (parsedData.phone) p.phone = parsedData.phone;
      if (parsedData.alternate_phone) p.alternate_phone = parsedData.alternate_phone;
      if (parsedData.date_of_birth) p.date_of_birth = parsedData.date_of_birth;
      if (parsedData.gender) p.gender = parsedData.gender;
      if (parsedData.current_city) p.current_city = parsedData.current_city;
      if (parsedData.state) p.state = parsedData.state;
      if (parsedData.country) p.country = parsedData.country;
      if (parsedData.postal_code) p.postal_code = parsedData.postal_code;
      
      if (parsedData.title) p.title = parsedData.title;
      if (parsedData.bio) p.bio = parsedData.bio;
      if (parsedData.experience_years !== undefined) p.experience_years = parsedData.experience_years;

      if (parsedData.skills && parsedData.skills.length > 0) p.skills = parsedData.skills;
      if (parsedData.work_experiences && parsedData.work_experiences.length > 0) p.work_experiences = parsedData.work_experiences;
      const parsedEdu = parsedData.educations || parsedData.education;
      if (parsedEdu && parsedEdu.length > 0) p.educations = parsedEdu;
      if (parsedData.projects && parsedData.projects.length > 0) {
        p.projects = parsedData.projects.map(proj => ({
          title: typeof proj === 'string' ? proj : (proj.title || ''),
          tech_stack: proj.tech_stack || '',
          project_url: proj.project_url || '',
          description: '' // Never auto fetch project description; user manually enters information
        }));
      }
      if (parsedData.certifications && parsedData.certifications.length > 0) p.certifications = parsedData.certifications;
      if (parsedData.languages && parsedData.languages.length > 0) p.languages = parsedData.languages;
      if (parsedData.links && parsedData.links.length > 0) p.links = parsedData.links;

      if (parsedData.job_preferences) {
        p.job_preferences = {
          preferred_roles: parsedData.job_preferences.preferred_roles || '',
          preferred_locations: parsedData.job_preferences.preferred_locations || '',
          job_type: parsedData.job_preferences.job_type || 'Full-time',
          desired_salary: parsedData.job_preferences.desired_salary || ''
        };
      }

      return p;
    });

    resumeAPI.getMyResumes()
      .then(res => {
        if (res.data) setResumes(Array.isArray(res.data) ? res.data : []);
      });

    setActiveMessage('Resume parsed & synced to candidate profile successfully!');
    setTimeout(() => setActiveMessage(''), 5000);
  };

  const handleFieldChange = (field, val) => {
    setProfile(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      let prefObj = profile.job_preferences;
      if (typeof prefObj === 'string') {
        try { prefObj = JSON.parse(prefObj); } catch (e) { prefObj = {}; }
      }

      const payload = {
        ...profile,
        job_preferences: prefObj && typeof prefObj === 'object' ? prefObj : null
      };

      await userAPI.updateProfile(payload);
      setSavedSuccess(true);
      alert('Complete candidate profile saved successfully!');
      setTimeout(() => {
        setSavedSuccess(false);
        setActiveMessage('');
      }, 4000);
      
      setIsEditing(false); // Return to View Mode on successful save
      fetchProfileData();
    } catch (err) {
      const errorMsg = typeof err.response?.data?.detail === 'string' 
        ? err.response.data.detail 
        : (err.response?.data?.detail?.[0]?.msg || err.message || 'Failed to update user profile.');
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleSetActiveResume = async (resumeId, targetFilename) => {
    try {
      await resumeAPI.setActiveResume(resumeId);
      const res = await resumeAPI.getMyResumes();
      const list = Array.isArray(res?.data) ? res.data : [];
      setResumes(list);

      const targetRes = list.find(r => r.id === resumeId);
      if (targetRes && targetRes.parsed_info) {
        handleResumeParsed(targetRes.parsed_info);
      } else {
        fetchProfileData();
      }

      const name = targetFilename || targetRes?.filename || 'Resume';
      setActiveMessage(`Resume "${name}" activated successfully!`);
      setTimeout(() => setActiveMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to set active resume.');
    }
  };

  const handleDeleteResume = (resumeId, filename) => {
    setDeletingResume({ id: resumeId, filename });
  };

  const handleConfirmDeleteResume = async () => {
    if (!deletingResume) return;
    try {
      await resumeAPI.deleteResume(deletingResume.id);
      const res = await resumeAPI.getMyResumes();
      if (res?.data) setResumes(Array.isArray(res.data) ? res.data : []);
      const deletedName = deletingResume.filename;
      setDeletingResume(null);
      setActiveMessage(`Deleted "${deletedName}" successfully.`);
      setTimeout(() => setActiveMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to delete resume record.');
      setDeletingResume(null);
    }
  };

  const addItem = (field, emptyItem) => {
    setProfile(prev => ({ ...prev, [field]: [...(prev[field] || []), emptyItem] }));
  };

  const removeItem = (field, index) => {
    setProfile(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
  };

  const updateItemField = (field, index, subField, val) => {
    setProfile(prev => {
      const list = [...(prev[field] || [])];
      list[index] = { ...list[index], [subField]: val };
      return { ...prev, [field]: list };
    });
  };

  const handleAddSkillChip = (skillStr) => {
    if (!skillStr || !skillStr.trim()) return;
    const current = safeArray(profile.skills);
    if (!current.includes(skillStr.trim())) {
      setProfile(prev => ({ ...prev, skills: [...current, skillStr.trim()] }));
    }
  };

  const handleRemoveSkillChip = (skillToRemove) => {
    const current = safeArray(profile.skills);
    setProfile(prev => ({ ...prev, skills: current.filter(s => s !== skillToRemove) }));
  };

  const handleAddLocationChip = (locStr) => {
    if (!locStr || !locStr.trim()) return;
    const current = (profile.job_preferences?.preferred_locations || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(locStr.trim())) {
      const updated = [...current, locStr.trim()].join(', ');
      setProfile(prev => ({
        ...prev,
        job_preferences: { ...(prev.job_preferences || {}), preferred_locations: updated }
      }));
    }
  };

  const handleRemoveLocationChip = (locToRemove) => {
    const current = (profile.job_preferences?.preferred_locations || '').split(',').map(s => s.trim()).filter(Boolean);
    const updated = current.filter(l => l !== locToRemove).join(', ');
    setProfile(prev => ({
      ...prev,
      job_preferences: { ...(prev.job_preferences || {}), preferred_locations: updated }
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Loading Candidate Profile Structure...
      </div>
    );
  }

  const skillsList = safeArray(profile.skills);
  const workList = safeArray(profile.work_experiences);
  const eduList = safeArray(profile.educations);
  const projList = safeArray(profile.projects);
  const certList = safeArray(profile.certifications);
  const langList = safeArray(profile.languages);
  const linkList = safeArray(profile.links);

  // ==========================================
  // READ-ONLY CANDIDATE PROFILE VIEW MODE
  // ==========================================
  if (!isEditing) {
    const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || 'Candidate Name';

    return (
      <div className="app-container">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={28} color="#06b6d4" /> Candidate Profile
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '2px', fontWeight: '600' }}>
              Comprehensive Candidate Overview & Synced Portfolio
            </p>
          </div>

          <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={18} /> Edit Profile
          </button>
        </div>

        {activeMessage && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#10b981',
            color: '#ffffff',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.95rem',
            fontWeight: '700',
            maxWidth: '450px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <CheckCircle2 size={22} color="#ffffff" />
            <span>{activeMessage}</span>
          </div>
        )}

        {savedSuccess && (
          <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#059669', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <CheckCircle2 size={18} /> Profile saved successfully!
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* CANDIDATE HEADER HERO CARD */}
          <div className="glass-panel" style={{ padding: '32px', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)', borderRadius: '50%' }}></div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px' }}>
              {/* Profile Photo */}
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '2rem', flexShrink: 0, overflow: 'hidden', boxShadow: '0 8px 24px rgba(6, 182, 212, 0.25)' }}>
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile.first_name?.[0] || 'C') + (profile.last_name?.[0] || '')
                )}
              </div>

              {/* Identity Info */}
              <div style={{ flex: 1, minWidth: '260px' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1f2937', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                  {fullName}
                </h2>
                <div style={{ fontSize: '1rem', color: '#0891b2', fontWeight: '700', marginBottom: '12px' }}>
                  {profile.title || 'Candidate Professional'}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.88rem', color: '#374151', fontWeight: '600' }}>
                  {profile.email && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={16} color="#0891b2" /> {profile.email}
                    </span>
                  )}
                  {profile.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Phone size={16} color="#059669" /> {profile.phone}
                    </span>
                  )}
                  {(profile.current_city || profile.country) && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={16} color="#0891b2" /> {[profile.current_city, profile.state, profile.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {profile.experience_years > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Briefcase size={16} color="#d97706" /> {profile.experience_years} Yrs Experience
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 1. PROFESSIONAL SUMMARY */}
          {profile.bio && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <FileText size={18} color="#0891b2" /> Professional Summary
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-line', fontWeight: '500' }}>
                {profile.bio}
              </p>
            </div>
          )}

          {/* 2. SKILLS */}
          {skillsList.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <Sparkles size={18} color="#0891b2" /> Key Skills ({skillsList.length})
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {skillsList.map((skill, idx) => (
                  <span key={idx} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '700' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 3. WORK EXPERIENCES */}
          {workList.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <Briefcase size={18} color="#0891b2" /> Work Experience ({workList.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {workList.map((exp, idx) => (
                  <div key={idx} style={{ padding: '18px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '1.05rem', color: '#1f2937', fontWeight: '800' }}>{exp.role || 'Role'}</h4>
                      <span style={{ fontSize: '0.82rem', color: '#0891b2', background: 'rgba(6, 182, 212, 0.12)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
                        {exp.start_date || 'Dates N/A'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#0891b2', fontWeight: '700', marginBottom: '10px' }}>
                      {exp.company} {exp.location ? `• ${exp.location}` : ''}
                    </div>
                    {exp.description && (
                      <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-line', fontWeight: '500' }}>
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. EDUCATIONS */}
          {eduList.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <GraduationCap size={18} color="#0891b2" /> Education ({eduList.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {eduList.map((edu, idx) => (
                  <div key={idx} style={{ padding: '18px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.05rem', color: '#1f2937', fontWeight: '800', marginBottom: '4px' }}>
                      {edu.degree || 'Degree'} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#0891b2', fontWeight: '700', marginBottom: '8px' }}>
                      {edu.institution}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem', color: '#4b5563', fontWeight: '600' }}>
                      {(edu.start_year || edu.end_year) && (
                        <span>Year: {[edu.start_year, edu.end_year].filter(Boolean).join(' - ')}</span>
                      )}
                      {edu.cgpa && (
                        <span style={{ color: '#059669', fontWeight: '800' }}>CGPA: {edu.cgpa}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. PROJECTS */}
          {projList.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <FolderGit2 size={18} color="#059669" /> Projects ({projList.length})
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {projList.map((proj, idx) => (
                  <div key={idx} style={{ padding: '18px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '800' }}>{proj.title}</h4>
                      {proj.project_url && (
                        <a href={proj.project_url} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: '700' }}>
                          View <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                    {proj.tech_stack && (
                      <div style={{ fontSize: '0.82rem', color: '#0891b2', marginBottom: '8px', fontWeight: '700' }}>
                        Tech: {proj.tech_stack}
                      </div>
                    )}
                    {proj.description && (
                      <p style={{ fontSize: '0.88rem', color: '#374151', lineHeight: '1.5', fontWeight: '500' }}>
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. CERTIFICATIONS & 7. LANGUAGES */}
          {(certList.length > 0 || langList.length > 0) && (
            <div className="grid-2">
              {certList.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                    <Award size={18} color="#d97706" /> Certifications ({certList.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {certList.map((cert, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '800', color: '#1f2937', fontSize: '0.92rem' }}>{cert.name}</div>
                        <div style={{ fontSize: '0.82rem', color: '#d97706', fontWeight: '600' }}>{cert.issuer} {cert.issue_date ? `• ${cert.issue_date}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {langList.length > 0 && (
                <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                    <Globe size={18} color="#059669" /> Languages ({langList.length})
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {langList.map((lang, idx) => (
                      <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.88rem', fontWeight: '700' }}>
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 8. LINKS & PORTFOLIO */}
          {linkList.length > 0 && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <Link2 size={18} color="#0891b2" /> Links & Portfolio
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {linkList.map((link, idx) => (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={15} color="#0891b2" />
                    <span>{link.platform || 'Link'}: <span style={{ color: '#0891b2', textDecoration: 'underline', fontWeight: '700' }}>{link.url}</span></span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 9. JOB PREFERENCES */}
          {(profile.job_preferences?.preferred_roles || profile.job_preferences?.preferred_locations || profile.job_preferences?.desired_salary) && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <Sliders size={18} color="#0891b2" /> Job Preferences
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                {profile.job_preferences?.preferred_roles && (
                  <div>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', fontWeight: '600' }}>Preferred Roles</span>
                    <span style={{ fontSize: '0.95rem', color: '#0891b2', fontWeight: '800' }}>{profile.job_preferences.preferred_roles}</span>
                  </div>
                )}
                {profile.job_preferences?.preferred_locations && (
                  <div>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', fontWeight: '600' }}>Preferred Locations</span>
                    <span style={{ fontSize: '0.95rem', color: '#0891b2', fontWeight: '800' }}>{profile.job_preferences.preferred_locations}</span>
                  </div>
                )}
                {profile.job_preferences?.job_type && (
                  <div>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', fontWeight: '600' }}>Job Type</span>
                    <span style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '800' }}>{profile.job_preferences.job_type}</span>
                  </div>
                )}
                {profile.job_preferences?.desired_salary && (
                  <div>
                    <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', fontWeight: '600' }}>Desired Salary</span>
                    <span style={{ fontSize: '0.95rem', color: '#059669', fontWeight: '800' }}>{profile.job_preferences.desired_salary}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 10. RESUME RECORDS & HISTORY */}
          <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
                <FileText size={18} color="#059669" /> Resume History ({resumes.length})
              </h3>
              <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                <Plus size={14} /> Upload New Resume
              </button>
            </div>

            {resumes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {resumes.map((res) => {
                  const isActive = Boolean(res.is_active);
                  return (
                    <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ color: '#1f2937', fontWeight: '800', fontSize: '0.92rem' }}>{res.filename}</div>
                        <div style={{ fontSize: '0.78rem', color: '#4b5563', fontWeight: '500' }}>Uploaded: {parseUTCDate(res.uploaded_at)?.toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isActive ? (
                          <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.78rem', fontWeight: '700' }}>
                            ✓ Active Resume
                          </span>
                        ) : (
                          <button onClick={() => handleSetActiveResume(res.id, res.filename)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                            Set Active
                          </button>
                        )}
                        <button onClick={() => handleDeleteResume(res.id, res.filename)} style={{ background: 'transparent', color: '#dc2626', border: 'none', cursor: 'pointer', padding: '6px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>No resume files uploaded yet.</div>
            )}
          </div>

        </div>

        {/* CUSTOM RESUME DELETE CONFIRMATION MODAL */}
        <ConfirmModal
          isOpen={Boolean(deletingResume)}
          title="Delete Resume Document"
          message={`Are you sure you want to delete "${deletingResume?.filename || 'this resume'}"? This action cannot be undone.`}
          confirmText="Delete Resume"
          cancelText="Cancel"
          confirmVariant="danger"
          onConfirm={handleConfirmDeleteResume}
          onCancel={() => setDeletingResume(null)}
        />
      </div>
    );
  }

  // ==========================================
  // EDITABLE CANDIDATE PROFILE FORM MODE
  // ==========================================
  return (
    <div className="app-container">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={28} color="#06b6d4" /> Candidate Profile & Resume Settings
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#4b5563', marginTop: '2px', fontWeight: '600' }}>
            Modify candidate details below. Clicking "Save All Changes" saves to database and returns to Profile View.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={18} /> View Profile
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={18} /> {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {activeMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#10b981',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.95rem',
          fontWeight: '700',
          maxWidth: '450px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <CheckCircle2 size={22} color="#ffffff" />
          <span>{activeMessage}</span>
        </div>
      )}

      {/* STEP 1: RESUME UPLOAD (STRICT PARSER) */}
      <div style={{ marginBottom: '28px' }}>
        <ResumeUpload onParsed={handleResumeParsed} />
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* 1. BASIC INFORMATION */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '800' }}>
              <UserCheck size={20} color="#06b6d4" /> 1. Basic Information
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
              <Info size={14} color="#0891b2" /> Strict extraction mode: Unfound fields remain empty
            </span>
          </div>

          {/* Profile Photo Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.5rem', overflow: 'hidden' }}>
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile.first_name?.[0] || 'U') + (profile.last_name?.[0] || '')
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Profile Photo URL</label>
              <div style={{ position: 'relative' }}>
                <Camera size={18} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '40px' }}
                  value={profile.profile_photo || ''} 
                  onChange={e => handleFieldChange('profile_photo', e.target.value)} 
                  placeholder="https://example.com/photo.jpg" 
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Name Fields */}
            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>First Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input 
                type="text" 
                required
                className="input-field" 
                value={profile.first_name || ''} 
                onChange={e => handleFieldChange('first_name', e.target.value)} 
                placeholder="First Name" 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Middle Name</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.middle_name || ''} 
                onChange={e => handleFieldChange('middle_name', e.target.value)} 
                placeholder="Middle Name" 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Last Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input 
                type="text" 
                required
                className="input-field" 
                value={profile.last_name || ''} 
                onChange={e => handleFieldChange('last_name', e.target.value)} 
                placeholder="Last Name" 
              />
            </div>

            {/* Contact Fields */}
            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  required
                  className="input-field" 
                  style={{ paddingLeft: '36px' }}
                  value={profile.email || ''} 
                  onChange={e => handleFieldChange('email', e.target.value)} 
                  placeholder="name@example.com" 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Phone Number <span style={{ color: '#dc2626' }}>*</span></label>
              <PhoneInput 
                required
                value={profile.phone || ''} 
                onChange={val => handleFieldChange('phone', val)} 
              />
            </div>

            {/* Personal Attributes */}
            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Date of Birth</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '36px' }}
                  value={profile.date_of_birth || ''} 
                  onChange={e => handleFieldChange('date_of_birth', e.target.value)} 
                  placeholder="DD/MM/YYYY" 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Gender</label>
              <select 
                className="input-field" 
                value={profile.gender || ''} 
                onChange={e => handleFieldChange('gender', e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Location Fields */}
            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Current City <span style={{ color: '#dc2626' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="#6b7280" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required
                  className="input-field" 
                  style={{ paddingLeft: '36px' }}
                  value={profile.current_city || ''} 
                  onChange={e => handleFieldChange('current_city', e.target.value)} 
                  placeholder="City" 
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>State</label>
              <input 
                type="text" 
                className="input-field" 
                value={profile.state || ''} 
                onChange={e => handleFieldChange('state', e.target.value)} 
                placeholder="State / Province" 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Country <span style={{ color: '#dc2626' }}>*</span></label>
              <input 
                type="text" 
                required
                className="input-field" 
                value={profile.country || 'India'} 
                onChange={e => handleFieldChange('country', e.target.value)} 
                placeholder="Country" 
              />
            </div>
          </div>
        </div>

        {/* 2. PROFESSIONAL SUMMARY */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            <FileText size={20} color="#06b6d4" /> 2. Professional Summary
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Target Job Title / Headline</label>
            <input 
              type="text" 
              className="input-field" 
              value={profile.title || ''} 
              onChange={e => handleFieldChange('title', e.target.value)} 
              placeholder="e.g. Senior Full Stack Engineer / AI Specialist" 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>Summary Bio</label>
            <textarea 
              rows={4} 
              className="input-field" 
              value={profile.bio || ''} 
              onChange={e => handleFieldChange('bio', e.target.value)} 
              placeholder="Write a concise overview of your background, core strengths, and career highlights..." 
            />
          </div>
        </div>

        {/* 3. KEY SKILLS */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.15rem', color: '#1f2937', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
            <Sparkles size={20} color="#06b6d4" /> 3. Key Technical Skills
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {skillsList.map((skill, idx) => (
              <span key={idx} style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {skill}
                <Trash2 size={14} style={{ cursor: 'pointer' }} onClick={() => handleRemoveSkillChip(skill)} />
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              id="newSkillInput"
              className="input-field" 
              placeholder="Type a skill (e.g. Python, Docker, React) and press Add" 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkillChip(e.target.value);
                  e.target.value = '';
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => {
                const el = document.getElementById('newSkillInput');
                if (el) { handleAddSkillChip(el.value); el.value = ''; }
              }}
              className="btn-secondary" 
              style={{ padding: '10px 18px' }}
            >
              Add Skill
            </button>
          </div>
        </div>

        {/* 4. WORK EXPERIENCE */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '800' }}>
              <Briefcase size={20} color="#06b6d4" /> 4. Work Experience
            </h3>
            <button type="button" onClick={() => addItem('work_experiences', { role: '', company: '', location: '', start_date: '', description: '' })} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              <Plus size={14} /> Add Experience
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {workList.map((exp, idx) => (
              <div key={idx} style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <button type="button" onClick={() => removeItem('work_experiences', idx)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Role / Job Title</label>
                    <input type="text" className="input-field" value={exp.role || ''} onChange={e => updateItemField('work_experiences', idx, 'role', e.target.value)} placeholder="e.g. Senior Software Engineer" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Company Name</label>
                    <input type="text" className="input-field" value={exp.company || ''} onChange={e => updateItemField('work_experiences', idx, 'company', e.target.value)} placeholder="e.g. Google / TechVision" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Location</label>
                    <input type="text" className="input-field" value={exp.location || ''} onChange={e => updateItemField('work_experiences', idx, 'location', e.target.value)} placeholder="e.g. Bangalore / Remote" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Dates / Duration</label>
                    <input type="text" className="input-field" value={exp.start_date || ''} onChange={e => updateItemField('work_experiences', idx, 'start_date', e.target.value)} placeholder="e.g. Jan 2022 - Present" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Description & Responsibilities</label>
                  <textarea rows={3} className="input-field" value={exp.description || ''} onChange={e => updateItemField('work_experiences', idx, 'description', e.target.value)} placeholder="Key accomplishments and daily responsibilities..." />
                </div>
              </div>
            ))}
            {workList.length === 0 && <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>No work experiences added yet. Click "Add Experience" above.</div>}
          </div>
        </div>

        {/* 5. EDUCATION */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '800' }}>
              <GraduationCap size={20} color="#06b6d4" /> 5. Education
            </h3>
            <button type="button" onClick={() => addItem('educations', { degree: '', institution: '', field_of_study: '', start_year: '', end_year: '', cgpa: '' })} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              <Plus size={14} /> Add Education
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {eduList.map((edu, idx) => (
              <div key={idx} style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <button type="button" onClick={() => removeItem('educations', idx)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Degree</label>
                    <input type="text" className="input-field" value={edu.degree || ''} onChange={e => updateItemField('educations', idx, 'degree', e.target.value)} placeholder="e.g. B.Tech / M.S." />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Field of Study</label>
                    <input type="text" className="input-field" value={edu.field_of_study || ''} onChange={e => updateItemField('educations', idx, 'field_of_study', e.target.value)} placeholder="e.g. Computer Science" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Institution / University</label>
                    <input type="text" className="input-field" value={edu.institution || ''} onChange={e => updateItemField('educations', idx, 'institution', e.target.value)} placeholder="e.g. IIT Hyderabad" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>CGPA / Percentage</label>
                    <input type="text" className="input-field" value={edu.cgpa || ''} onChange={e => updateItemField('educations', idx, 'cgpa', e.target.value)} placeholder="e.g. 8.5 / 10" />
                  </div>
                </div>
              </div>
            ))}
            {eduList.length === 0 && <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>No education records added yet. Click "Add Education" above.</div>}
          </div>
        </div>

        {/* 6. PROJECTS */}
        <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: '800' }}>
              <FolderGit2 size={20} color="#059669" /> 6. Key Projects
            </h3>
            <button type="button" onClick={() => addItem('projects', { title: '', tech_stack: '', description: '', project_url: '' })} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
              <Plus size={14} /> Add Project
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {projList.map((proj, idx) => (
              <div key={idx} style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                <button type="button" onClick={() => removeItem('projects', idx)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
                  <Trash2 size={18} />
                </button>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Project Title</label>
                    <input type="text" className="input-field" value={proj.title || ''} onChange={e => updateItemField('projects', idx, 'title', e.target.value)} placeholder="e.g. AI Resume Parser & Matcher" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Tech Stack</label>
                    <input type="text" className="input-field" value={proj.tech_stack || ''} onChange={e => updateItemField('projects', idx, 'tech_stack', e.target.value)} placeholder="e.g. React, Python, FastAPI, Docker" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Live URL / Repository</label>
                    <input type="text" className="input-field" value={proj.project_url || ''} onChange={e => updateItemField('projects', idx, 'project_url', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#1f2937', display: 'block', marginBottom: '4px', fontWeight: '700' }}>Description</label>
                  <textarea rows={3} className="input-field" value={proj.description || ''} onChange={e => updateItemField('projects', idx, 'description', e.target.value)} placeholder="Overview of technical architecture & impact..." />
                </div>
              </div>
            ))}
            {projList.length === 0 && <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>No projects added yet. Click "Add Project" above.</div>}
          </div>
        </div>

        {/* SAVE BUTTON FOOTER */}
        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '14px', justifyContent: 'center', fontSize: '1rem', marginTop: '12px' }}>
          <Save size={20} /> {saving ? 'Saving Candidate Profile...' : 'Save Complete Candidate Profile'}
        </button>

      </form>

      {/* CUSTOM RESUME DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingResume)}
        title="Delete Resume Document"
        message={`Are you sure you want to delete "${deletingResume?.filename || 'this resume'}"? This action cannot be undone.`}
        confirmText="Delete Resume"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDeleteResume}
        onCancel={() => setDeletingResume(null)}
      />
    </div>
  );
}
