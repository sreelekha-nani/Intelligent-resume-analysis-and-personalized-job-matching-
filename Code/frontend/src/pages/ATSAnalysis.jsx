import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jobAPI, atsAPI, resumeAPI } from '../services/api';
import { 
  FileText, Sparkles, Upload
} from 'lucide-react';

export default function ATSAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();

  // Restore inputs if returning from results page, or check sessionStorage
  const savedInputs = (() => {
    if (location.state?.reset) return null;
    if (location.state?.inputs) return location.state.inputs;
    const stored = sessionStorage.getItem('ats_inputs');
    return stored ? JSON.parse(stored) : null;
  })();

  const [targetRole, setTargetRole] = useState(savedInputs?.targetRole || '');
  const [jobDescription, setJobDescription] = useState(savedInputs?.jobDescription || '');
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(savedInputs?.selectedJobId || '');

  // Resume Upload & Selection State
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(savedInputs?.selectedResumeId || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedResumeText, setUploadedResumeText] = useState(savedInputs?.uploadedResumeText || '');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    // Load existing active jobs & user resumes
    Promise.all([
      jobAPI.searchJobs({}),
      resumeAPI.getMyResumes()
    ])
      .then(([jobRes, resRes]) => {
        if (jobRes.data && jobRes.data.length > 0) {
          setJobs(jobRes.data);
        }
        if (resRes.data && resRes.data.length > 0) {
          setResumes(resRes.data);
          if (!selectedResumeId) {
            const active = resRes.data.find(r => r.is_active) || resRes.data[0];
            if (active) setSelectedResumeId(active.id);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleSelectPlatformJob = (e) => {
    const jId = e.target.value;
    setSelectedJobId(jId);
    if (!jId) return;
    const found = jobs.find(j => j.id === parseInt(jId));
    if (found) {
      setTargetRole(found.title);
      setJobDescription((found.description || '') + '\n\n' + (found.requirements || ''));
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.pdf') && !nameLower.endsWith('.docx') && !nameLower.endsWith('.doc')) {
      alert('Only PDF and DOCX files are supported.');
      return;
    }

    setSelectedFile(file);
    setUploadingResume(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await resumeAPI.uploadResume(formData);
      if (res.data) {
        setUploadedResumeText(JSON.stringify(res.data));
        const resList = await resumeAPI.getMyResumes();
        if (resList.data) {
          setResumes(resList.data);
          setSelectedResumeId(resList.data[0]?.id || '');
        }
      }
    } catch (err) {
      alert('Failed to parse uploaded resume file.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRunATS = async (e) => {
    if (e) e.preventDefault();
    if (!targetRole.trim() || !jobDescription.trim()) return;

    setAnalyzing(true);

    const selectedResumeObj = resumes.find(r => r.id === parseInt(selectedResumeId));
    const resumeName = selectedFile ? selectedFile.name : (selectedResumeObj ? selectedResumeObj.filename : 'Resume File');

    const inputsPayload = {
      targetRole,
      jobDescription,
      selectedJobId,
      selectedResumeId,
      uploadedResumeText,
      resumeName
    };

    try {
      const res = await atsAPI.analyzeATS({
        target_role: targetRole,
        job_description: jobDescription,
        job_id: selectedJobId ? parseInt(selectedJobId) : null,
        resume_id: selectedResumeId ? parseInt(selectedResumeId) : null,
        resume_text: uploadedResumeText
      });

      // Save to sessionStorage and navigate to dedicated results page!
      sessionStorage.setItem('ats_report', JSON.stringify(res.data));
      sessionStorage.setItem('ats_inputs', JSON.stringify(inputsPayload));

      navigate('/ats-engine/results', {
        state: {
          report: res.data,
          inputs: inputsPayload
        }
      });
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to analyze ATS compliance.');
    } finally {
      setAnalyzing(false);
    }
  };

  const isFormValid = Boolean(
    targetRole.trim() && 
    jobDescription.trim() && 
    (selectedResumeId || selectedFile || uploadedResumeText)
  );

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileText color="#000000" size={28} /> ATS Engine
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
          Evaluate your resume against specific target roles & job requirements with measurable ATS scoring, keyword detection, and section feedback.
        </p>
      </div>

      {/* INPUT FORM PANEL */}
      <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* 1. Target Role */}
          <div>
            <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
              1. Target Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Data Analyst, Software Engineer, Java Developer" 
              value={targetRole} 
              onChange={e => setTargetRole(e.target.value)} 
            />
          </div>

          {/* 3. Selected Resume */}
          <div>
            <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
              3. Selected Resume <span style={{ color: '#ef4444' }}>*</span>
            </label>
            
            {resumes.length > 0 ? (
              <select 
                className="input-field" 
                value={selectedResumeId} 
                onChange={e => { setSelectedResumeId(e.target.value); setSelectedFile(null); }}
              >
                {resumes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.filename} {r.is_active ? '(Active Profile Resume)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#6b7280', padding: '10px' }}>No saved profile resumes found. Please upload one below.</div>
            )}
          </div>
        </div>

        {/* 2. Job Description Textarea */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.88rem', color: '#1f2937', display: 'block', marginBottom: '6px', fontWeight: '700' }}>
            2. Job Description / Requirements <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea 
            rows={8} 
            className="input-field"
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the complete job description or job requirements here..."
          />
        </div>

        {/* Upload Different Resume (PDF / DOCX) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', color: '#4b5563', display: 'block', marginBottom: '8px', fontWeight: '600' }}>Upload Different Resume (PDF / DOCX)</label>
          <div 
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: dragOver ? '2px dashed #06b6d4' : '2px dashed rgba(6, 182, 212, 0.4)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: dragOver ? 'rgba(6, 182, 212, 0.08)' : '#f8fafc',
              transition: 'all 0.2s',
              position: 'relative'
            }}
          >
            <input 
              type="file" 
              accept=".pdf,.docx,.doc" 
              onChange={e => handleFileUpload(e.target.files[0])}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
            />
            {/* BLACK ICON AS REQUESTED */}
            <Upload size={32} color="#000000" style={{ margin: '0 auto 8px', display: 'block' }} />
            <div style={{ fontSize: '0.92rem', color: '#1f2937', fontWeight: '700' }}>
              {uploadingResume ? 'Parsing Uploaded Resume...' : selectedFile ? `Uploaded: ${selectedFile.name}` : 'Drag & Drop PDF/DOCX or Click to Browse'}
            </div>
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Max file size 10MB</span>

            {selectedFile && (
              <button 
                type="button" 
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadedResumeText(''); }}
                style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' }}
              >
                Remove Uploaded File
              </button>
            )}
          </div>
        </div>

        {/* Primary Analyze Button */}
        <button 
          onClick={handleRunATS} 
          disabled={!isFormValid || analyzing} 
          className="btn-primary" 
          style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', opacity: isFormValid ? 1 : 0.5 }}
        >
          <Sparkles size={18} color="#ffffff" /> {analyzing ? 'Analyzing Resume...' : 'Analyze Resume'}
        </button>

      </div>
    </div>
  );
}
