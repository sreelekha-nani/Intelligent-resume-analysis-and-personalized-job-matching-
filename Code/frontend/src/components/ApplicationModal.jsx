import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, resumeAPI, userAPI, applicationAPI, atsAPI } from '../services/api';
import { 
  X, CheckCircle2, FileText, Upload, Eye, Sparkles, AlertTriangle, 
  User, Mail, Phone, MapPin, ExternalLink, ArrowRight, ArrowLeft, Copy, Check, Edit3, RefreshCw, Download, Clock, Users
} from 'lucide-react';
import MatchScore from './MatchScore';
import ATSReportView from './ATSReportView';
import { formatTimeAgo, parseUTCDate } from '../utils/formatters';

export default function ApplicationModal({ job, onClose, onSuccess }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const coverLetterRef = useRef(null);

  // Flow Step: 1 = Preview & Resume, 2 = Cover Letter Choice, 2.5 = AI Cover Letter Editor, 3 = Final Review
  const [step, setStep] = useState(1);

  // Loading States
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [coverLetterError, setCoverLetterError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Detailed ATS Engine States
  const [analyzingATS, setAnalyzingATS] = useState(false);
  const [atsReport, setAtsReport] = useState(null);
  const [showAtsReportModal, setShowAtsReportModal] = useState(false);

  // Data States
  const [userProfile, setUserProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);

  // Checkboxes
  const [confirmProfileChecked, setConfirmProfileChecked] = useState(false);
  const [confirmReviewChecked, setConfirmReviewChecked] = useState(false);

  // Cover Letter States
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterTone, setCoverLetterTone] = useState('standard');
  const [copiedText, setCopiedText] = useState(false);

  // Calculated ATS Match Preview
  const [atsScore, setAtsScore] = useState(0);
  const [matchedSkills, setMatchedSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);

  useEffect(() => {
    // 1. Fetch Candidate Profile
    authAPI.getMe()
      .then(res => {
        const u = res.data;
        userAPI.getProfile()
          .then(pRes => setUserProfile({ ...u, ...pRes.data }))
          .catch(() => setUserProfile(u));
      })
      .finally(() => setLoadingProfile(false));

    // 2. Fetch Resumes
    fetchResumes();
  }, []);

  const fetchResumes = () => {
    setLoadingResumes(true);
    resumeAPI.getMyResumes()
      .then(res => {
        setResumes(res.data || []);
        if (res.data && res.data.length > 0) {
          // Pre-select active resume or first resume
          const active = res.data.find(r => r.is_active) || res.data[0];
          setSelectedResumeId(active.id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingResumes(false));
  };

  // Recalculate Unified ATS Match Preview via backend service whenever selected resume or job changes
  useEffect(() => {
    if (!job || !selectedResumeId || resumes.length === 0) return;

    atsAPI.analyzeATS({
      target_role: job.title,
      job_description: (job.description || '') + '\n' + (job.requirements || ''),
      job_id: job.id,
      resume_id: parseInt(selectedResumeId)
    })
    .then(res => {
      const r = res.data;
      setAtsReport(r);
      setAtsScore(r.ats_score);
      setMatchedSkills(r.matched_keywords || []);
      setMissingSkills(r.skills_gap?.required_missing || []);
    })
    .catch(err => {
      console.error("ATS Preview Error:", err);
    });
  }, [selectedResumeId, resumes, job]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await resumeAPI.uploadResume(formData);
      await fetchResumes();
      if (res.data && res.data.id) {
        setSelectedResumeId(res.data.id);
      }
    } catch (err) {
      alert('Failed to upload resume file.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleAnalyzeATS = async () => {
    if (!selectedResumeId || !job) return;
    setAnalyzingATS(true);
    try {
      const res = await atsAPI.analyzeATS({
        target_role: job.title,
        job_description: (job.description || '') + '\n' + (job.requirements || ''),
        job_id: job.id,
        resume_id: parseInt(selectedResumeId)
      });
      setAtsReport(res.data);
      setShowAtsReportModal(true);
    } catch (err) {
      alert('Failed to analyze resume with ATS Engine.');
    } finally {
      setAnalyzingATS(false);
    }
  };

  const handleGenerateCoverLetter = async (overrideTone) => {
    const activeTone = typeof overrideTone === 'string' ? overrideTone : coverLetterTone;
    setGeneratingCoverLetter(true);
    setCoverLetterError(null);
    try {
      const res = await applicationAPI.generateCoverLetter({
        job_id: job.id,
        resume_id: selectedResumeId,
        tone: activeTone
      });
      setCoverLetter(res.data.cover_letter || '');
      setIncludeCoverLetter(true);
      setStep(2.5);
    } catch (err) {
      console.error("AI Cover Letter Generation Error:", err);
      const errDetail = err.response?.data?.detail || err.message || 'Failed to generate AI Cover Letter.';
      setCoverLetterError(errDetail);
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const handleCycleToneAndRegenerate = () => {
    const tones = ['standard', 'technical', 'impact', 'leadership'];
    const nextIdx = (tones.indexOf(coverLetterTone) + 1) % tones.length;
    const nextTone = tones[nextIdx];
    setCoverLetterTone(nextTone);
    handleGenerateCoverLetter(nextTone);
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter], { type: 'application/pdf' });
    element.href = URL.createObjectURL(file);
    element.download = `${userProfile?.full_name?.replace(/\s+/g, '_') || 'Candidate'}_Cover_Letter_${job?.company?.replace(/\s+/g, '_') || 'Job'}.pdf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadDOCX = () => {
    const element = document.createElement('a');
    const file = new Blob([coverLetter], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    element.href = URL.createObjectURL(file);
    element.download = `${userProfile?.full_name?.replace(/\s+/g, '_') || 'Candidate'}_Cover_Letter_${job?.company?.replace(/\s+/g, '_') || 'Job'}.docx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmitApplication = async () => {
    setSubmitting(true);
    try {
      await applicationAPI.applyForJob({
        job_id: job.id,
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        cover_letter: includeCoverLetter ? coverLetter : ''
      });
      alert(`Application submitted successfully for ${job?.title}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = typeof err.response?.data?.detail === 'string' 
        ? err.response.data.detail 
        : (err.response?.data?.detail?.[0]?.msg || err.message || 'Failed to submit job application.');
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedResume = resumes.find(r => r.id === parseInt(selectedResumeId));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0, 0, 0, 0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto',
        padding: '32px', background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: '16px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.12)'
      }}>
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* STEP PROGRESS BAR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ flex: 1, height: '5px', background: step >= 1 ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(6, 182, 212, 0.15)', borderRadius: '3px' }} />
          <div style={{ flex: 1, height: '5px', background: step >= 2 ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(6, 182, 212, 0.15)', borderRadius: '3px' }} />
          <div style={{ flex: 1, height: '5px', background: step >= 3 ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(6, 182, 212, 0.15)', borderRadius: '3px' }} />
        </div>

        {/* ==================== STEP 1: APPLICATION PREVIEW & RESUME SELECTION ==================== */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 1 of 3 — Job Application Preview
              </span>
              <h2 style={{ fontSize: '1.4rem', color: '#1f2937', fontWeight: '800', margin: '4px 0 0' }}>
                Apply for {job?.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '6px 0 0', fontSize: '0.88rem', color: '#4b5563', fontWeight: '500' }}>
                <span>{job?.company}</span>
                <span>•</span>
                <span>{job?.location}</span>
                <span>•</span>
                <span style={{ color: '#0891b2', fontWeight: '700' }}>{job?.employment_type || job?.job_type || 'Full-time'}</span>
                <span>•</span>
                <span style={{ color: '#166534', fontWeight: '700', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                  {job?.openings_count || 1} {(job?.openings_count || 1) === 1 ? 'Opening' : 'Openings'}
                </span>
                <span>•</span>
                <span style={{ color: '#475569', fontWeight: '600', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                  Posted {formatTimeAgo(job?.created_at)}
                </span>
              </div>
            </div>

            {/* CLOSED JOB WARNING BANNER */}
            {job?.status && (job.status.toLowerCase() === 'closed' || job.status.toLowerCase() === 'draft') && (
              <div style={{ padding: '14px 18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontWeight: '700', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#dc2626" /> This job opening is closed and is no longer accepting new applications.
              </div>
            )}

            {/* CANDIDATE PROFILE CARD */}
            <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#0891b2" /> Candidate Profile
                </h4>
                <button 
                  onClick={() => window.open('/profile', '_blank')}
                  className="btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.88rem' }}>
                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Full Name:</span> <strong style={{ color: '#1f2937', fontWeight: '800' }}>{userProfile?.full_name || 'Candidate'}</strong></div>
                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Email:</span> <strong style={{ color: '#1f2937', fontWeight: '800' }}>{userProfile?.email || 'N/A'}</strong></div>
                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Phone:</span> <strong style={{ color: '#1f2937', fontWeight: '800' }}>{userProfile?.phone || 'Not set'}</strong></div>
                <div><span style={{ color: '#4b5563', fontWeight: '600' }}>Location:</span> <strong style={{ color: '#1f2937', fontWeight: '800' }}>{[userProfile?.current_city, userProfile?.state].filter(Boolean).join(', ') || 'India'}</strong></div>
              </div>
            </div>

            {/* RESUME SELECTION */}
            <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0891b2" /> Resume Selection
              </h4>

              {loadingResumes ? (
                <div style={{ fontSize: '0.88rem', color: '#6b7280' }}>Loading uploaded resumes...</div>
              ) : resumes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <p style={{ fontSize: '0.88rem', color: '#dc2626', marginBottom: '10px', fontWeight: '600' }}>No resume uploaded. Please upload your resume PDF to proceed.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    <Upload size={14} /> Upload Resume PDF
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <select 
                      className="input-field" 
                      value={selectedResumeId || ''} 
                      onChange={e => setSelectedResumeId(e.target.value)}
                      style={{ flex: 1, minWidth: '220px', color: '#1f2937', fontWeight: '700', background: '#ffffff', border: '1px solid #cbd5e1' }}
                    >
                      {resumes.map(r => (
                        <option key={r.id} value={r.id} style={{ background: '#ffffff', color: '#1f2937' }}>
                          {r.filename} ({r.uploaded_at ? parseUTCDate(r.uploaded_at)?.toLocaleDateString() : 'Uploaded'}) {r.is_active ? '★ Active' : ''}
                        </option>
                      ))}
                    </select>

                    {selectedResume && (
                      <a 
                        href={`http://127.0.0.1:8000/resumes/${selectedResume?.id}/preview`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn-secondary" 
                        style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                      >
                        <Eye size={15} /> Preview
                      </a>
                    )}

                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="btn-secondary" 
                      disabled={uploadingResume}
                      style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.3)' }}
                    >
                      <Upload size={15} /> {uploadingResume ? 'Uploading...' : 'Upload New'}
                    </button>

                    <button 
                      onClick={handleAnalyzeATS} 
                      disabled={analyzingATS || !selectedResumeId}
                      className="btn-primary" 
                      style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={15} color="white" /> {analyzingATS ? 'Analyzing...' : 'Analyze Resume'}
                    </button>
                  </div>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx" style={{ display: 'none' }} />
            </div>

            {/* LIVE ATS MATCH PREVIEW CARD */}
            <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '0.95rem', color: '#1f2937', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#059669" /> Real-time ATS Match Preview (Weighted Score)
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: '600' }}>Estimated Score:</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: '800', color: atsScore >= 75 ? '#059669' : (atsScore >= 50 ? '#d97706' : '#dc2626') }}>
                    {atsScore}%
                  </span>
                </div>
              </div>

              {/* THRESHOLD BANNER 1: Strong Match (>= 75%) */}
              {atsScore >= 75 && (
                <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', fontSize: '0.88rem', color: '#059669', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                  <CheckCircle2 size={18} /> Your resume is a strong match for this role.
                </div>
              )}

              {/* THRESHOLD BANNER 2: Moderate Match (50% - 74%) */}
              {atsScore >= 50 && atsScore < 75 && (
                <div style={{ padding: '12px 16px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', fontSize: '0.88rem', color: '#d97706', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                    <AlertTriangle size={18} /> Your resume partially matches this role. Consider improving it before applying.
                  </div>
                  <button onClick={handleAnalyzeATS} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.12)' }}>
                    <Sparkles size={14} /> Improve Resume
                  </button>
                </div>
              )}

              {/* THRESHOLD BANNER 3: Low Match (< 50%) */}
              {atsScore < 50 && (
                <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', fontSize: '0.88rem', color: '#dc2626', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                      <AlertTriangle size={18} /> Your resume has a low match for this position.
                    </div>
                    <button onClick={handleAnalyzeATS} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}>
                      <Sparkles size={14} /> Open ATS Engine
                    </button>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: '600' }}>
                    <b>Improve Resume Based on Required Skills:</b> {missingSkills.slice(0, 6).join(', ') || 'Review missing technical skills'}
                  </div>
                </div>
              )}

              {/* SKILLS DISPLAY CHIPS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#059669', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Matching Skills</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {matchedSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>{sk}</span>
                    ))}
                    {matchedSkills.length === 0 && <span style={{ color: '#6b7280' }}>None detected</span>}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#dc2626', fontWeight: '800', display: 'block', marginBottom: '6px' }}>Missing Required Skills</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {missingSkills.map((sk, i) => (
                      <span key={i} style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 10px', borderRadius: '12px', fontWeight: '600' }}>{sk}</span>
                    ))}
                    {missingSkills.length === 0 && <span style={{ color: '#059669', fontWeight: '600' }}>All required skills matched!</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* CONFIRMATION CHECKBOX */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <input 
                type="checkbox" 
                id="confirmProfile" 
                checked={confirmProfileChecked} 
                onChange={e => setConfirmProfileChecked(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="confirmProfile" style={{ fontSize: '0.88rem', color: '#1f2937', cursor: 'pointer', fontWeight: '700' }}>
                I confirm that my profile details and selected resume are accurate.
              </label>
            </div>

            {/* FOOTER ACTION BUTTONS CONTROLLED BY SCORE THRESHOLDS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px' }}>
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {/* Score < 50%: Hide Continue button & show Open ATS Engine button */}
                {atsScore < 50 ? (
                  <button 
                    onClick={handleAnalyzeATS} 
                    className="btn-primary" 
                    style={{ padding: '10px 24px', borderRadius: '10px' }}
                  >
                    <Sparkles size={16} /> Open ATS Engine to Improve Resume
                  </button>
                ) : atsScore >= 50 && atsScore < 75 ? (
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!confirmProfileChecked || !selectedResumeId || Boolean(job?.status && (job.status.toLowerCase() === 'closed' || job.status.toLowerCase() === 'draft'))}
                    className="btn-primary" 
                    style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Continue Anyway <ArrowRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!confirmProfileChecked || !selectedResumeId || Boolean(job?.status && (job.status.toLowerCase() === 'closed' || job.status.toLowerCase() === 'draft'))}
                    className="btn-primary" 
                    style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Continue with Application <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== STEP 2: COVER LETTER CHOICE ==================== */}
        {step === 2 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Step 2 of 3 — Cover Letter Options
            </span>
            <h2 style={{ fontSize: '1.5rem', color: '#1f2937', fontWeight: '800', margin: '8px 0 6px' }}>
              Would you like to include a Cover Letter?
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#4b5563', maxWidth: '500px', margin: '0 auto 24px', fontWeight: '500' }}>
              Including a tailored cover letter increases your interview callback rate by up to 40%.
            </p>

            {coverLetterError && (
              <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', textAlign: 'left', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontWeight: '800', fontSize: '0.9rem' }}>
                    <AlertTriangle size={18} /> Cover Letter Generation Failed
                  </div>
                  <button onClick={handleGenerateCoverLetter} className="btn-secondary" style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '6px' }}>
                    <RefreshCw size={13} /> Retry
                  </button>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#dc2626', margin: '6px 0 0', fontFamily: 'monospace' }}>
                  {coverLetterError}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              <div 
                onClick={() => { setIncludeCoverLetter(false); setStep(3); }}
                className="glass-panel" 
                style={{ padding: '24px', cursor: 'pointer', border: '1px solid #e2e8f0', background: '#ffffff', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <FileText size={20} color="#0891b2" />
                </div>
                <h4 style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '800', marginBottom: '6px' }}>Apply Without Cover Letter</h4>
                <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: 0, lineHeight: 1.4, fontWeight: '500' }}>
                  Submit your candidate profile and selected resume directly for review.
                </p>
              </div>

              <div 
                onClick={handleGenerateCoverLetter}
                className="glass-panel" 
                style={{ padding: '24px', cursor: 'pointer', border: '1px solid rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.08)', textAlign: 'left', transition: 'all 0.2s ease' }}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Sparkles size={20} color="white" />
                </div>
                <h4 style={{ fontSize: '1rem', color: '#0891b2', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Apply With AI Cover Letter ✨
                </h4>
                <p style={{ fontSize: '0.82rem', color: '#374151', margin: 0, lineHeight: 1.4, fontWeight: '500' }}>
                  Instantly generate a tailored cover letter based strictly on your profile & skills.
                </p>
              </div>
            </div>

            {generatingCoverLetter && (
              <div style={{ padding: '14px', background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', borderRadius: '10px', fontSize: '0.88rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} className="spin-icon" /> Generating Personalized AI Cover Letter for {job?.title}...
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 2.5: AI COVER LETTER EDITOR ==================== */}
        {step === 2.5 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '800', textTransform: 'uppercase' }}>AI Cover Letter Generator</span>
                <h3 style={{ fontSize: '1.2rem', color: '#1f2937', fontWeight: '800', margin: 0 }}>Tailored Cover Letter Editor</h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select 
                  className="input-field" 
                  value={coverLetterTone} 
                  onChange={e => {
                    setCoverLetterTone(e.target.value);
                    handleGenerateCoverLetter(e.target.value);
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '6px', width: 'auto', background: '#ffffff', color: '#1f2937', fontWeight: '700', borderColor: '#cbd5e1' }}
                >
                  <option value="standard">Standard Professional</option>
                  <option value="technical">Technical Architecture Focus</option>
                  <option value="impact">Metrics & Results Focus</option>
                  <option value="leadership">Engineering Quality Focus</option>
                </select>

                <button onClick={handleCycleToneAndRegenerate} disabled={generatingCoverLetter} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={13} className={generatingCoverLetter ? 'spin-icon' : ''} /> {generatingCoverLetter ? 'Regenerating...' : 'Regenerate'}
                </button>
                <button onClick={() => coverLetterRef.current?.focus()} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={handleCopyCoverLetter} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {copiedText ? <Check size={13} color="#059669" /> : <Copy size={13} />} {copiedText ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={handleDownloadPDF} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0891b2' }}>
                  <Download size={13} /> Download PDF
                </button>
                <button onClick={handleDownloadDOCX} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0891b2' }}>
                  <Download size={13} /> Download DOCX
                </button>
              </div>
            </div>

            {coverLetterError && (
              <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: '600' }}>{coverLetterError}</span>
                <button onClick={handleGenerateCoverLetter} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}>
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            <textarea 
              ref={coverLetterRef}
              rows={13} 
              className="input-field" 
              value={coverLetter} 
              onChange={e => setCoverLetter(e.target.value)} 
              style={{ width: '100%', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '20px', fontFamily: 'var(--font-family)', background: '#ffffff', color: '#1f2937', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', fontWeight: '500' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(2)} className="btn-secondary" style={{ padding: '8px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(3)} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Continue to Final Review <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ==================== STEP 3: FINAL REVIEW & SUBMIT ==================== */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 3 of 3 — Final Application Review
              </span>
              <h2 style={{ fontSize: '1.4rem', color: '#1f2937', fontWeight: '800', margin: '4px 0 0' }}>
                Review Your Application
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#0891b2', margin: '0 0 6px', fontWeight: '800' }}>Target Position</h4>
                <div style={{ fontSize: '1rem', color: '#1f2937', fontWeight: '800' }}>{job?.title}</div>
                <div style={{ fontSize: '0.82rem', color: '#4b5563', fontWeight: '500' }}>{job?.company} — {job?.location}</div>
              </div>

              <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '0.88rem', color: '#0891b2', margin: '0 0 8px', fontWeight: '800' }}>Candidate & Selected Resume</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: '#374151' }}>
                  <div><b>Name:</b> {userProfile?.full_name}</div>
                  <div><b>Email:</b> {userProfile?.email}</div>
                  <div><b>Resume:</b> <span style={{ color: '#059669', fontWeight: '700' }}>{selectedResume?.filename || 'Uploaded Resume'}</span></div>
                  <div><b>ATS Score:</b> <span style={{ color: '#059669', fontWeight: '800' }}>{atsScore}%</span></div>
                </div>
              </div>

              {includeCoverLetter && coverLetter && (
                <div style={{ padding: '16px', background: 'rgba(6, 182, 212, 0.05)', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.88rem', color: '#059669', margin: 0, fontWeight: '800' }}>Included AI Cover Letter</h4>
                    <button onClick={() => setStep(2.5)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '0.72rem', borderRadius: '4px' }}>
                      Edit Cover Letter
                    </button>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#1f2937', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto', background: '#ffffff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {coverLetter}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <input 
                type="checkbox" 
                id="confirmReview" 
                checked={confirmReviewChecked} 
                onChange={e => setConfirmReviewChecked(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="confirmReview" style={{ fontSize: '0.88rem', color: '#1f2937', cursor: 'pointer', fontWeight: '700' }}>
                I have reviewed my application details and agree to submit them to {job?.company}.
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setStep(includeCoverLetter ? 2.5 : 2)} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={16} /> Back
              </button>
              <button 
                onClick={handleSubmitApplication} 
                disabled={!confirmReviewChecked || submitting}
                className="btn-primary" 
                style={{ padding: '10px 28px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '0.92rem' }}
              >
                {submitting ? 'Submitting Application...' : '🚀 Submit Application'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* OVERLAY MODAL FOR DETAILED ATS ANALYSIS REPORT */}
      {showAtsReportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20000, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%', maxWidth: '950px', maxHeight: '92vh', overflowY: 'auto',
            padding: '28px', border: '1px solid #e2e8f0', position: 'relative', background: '#ffffff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: '#0891b2', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ATS Engine Full Analysis
                </span>
                <h2 style={{ fontSize: '1.4rem', color: '#1f2937', fontWeight: '800', margin: 0 }}>
                  Detailed Resume Match Report for {job?.title}
                </h2>
              </div>
              <button onClick={() => setShowAtsReportModal(false)} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <ATSReportView report={atsReport} roleName={job?.title} resumeName={selectedResume?.filename} />

            <div style={{ marginTop: '24px', textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button onClick={() => setShowAtsReportModal(false)} className="btn-primary" style={{ padding: '8px 24px', borderRadius: '8px' }}>
                Back to Application Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
