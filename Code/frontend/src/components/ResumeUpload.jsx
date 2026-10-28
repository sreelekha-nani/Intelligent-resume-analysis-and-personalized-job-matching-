import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { resumeAPI } from '../services/api';

export default function ResumeUpload({ onParsed }) {
  const [uploading, setUploading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await resumeAPI.uploadResume(formData);
      setParsedResult(res.data);
      if (onParsed) onParsed(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Failed to upload or parse resume file.';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg).join(', ');
      }
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <UploadCloud color="#06b6d4" size={26} /> AI Resume Parser & Upload
        </h3>
        <p style={{ fontSize: '0.88rem', color: '#374151', marginTop: '6px', fontWeight: '600' }}>
          Upload your PDF/DOCX resume to automatically extract skills, experience, and sync with job matching engines.
        </p>
      </div>

      <div style={{
        border: '2px dashed #06b6d4',
        borderRadius: '16px',
        padding: '36px 20px',
        textAlign: 'center',
        background: 'rgba(6, 182, 212, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}>
        <input 
          type="file" 
          accept=".pdf,.docx,.doc,.txt"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          style={{ display: 'none' }} 
          id="resume-file-input"
        />
        <label htmlFor="resume-file-input" style={{ cursor: 'pointer', display: 'block' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileText size={28} color="#0891b2" />
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1f2937', display: 'block' }}>
            {uploading ? 'Parsing with AI Engine...' : 'Click to Upload Resume (PDF / DOCX)'}
          </span>
          <span style={{ fontSize: '0.82rem', color: '#4b5563', display: 'block', marginTop: '4px', fontWeight: '600' }}>
            Max file size 10MB
          </span>
        </label>
      </div>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#dc2626', fontSize: '0.88rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {parsedResult && (
        <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '800', marginBottom: '10px' }}>
            <CheckCircle2 size={18} /> Successfully Parsed & Autofilled Profile: {parsedResult.filename}
          </div>
          
          <div style={{ fontSize: '0.85rem', color: '#1f2937', marginBottom: '8px', fontWeight: '700' }}>
            <b>Extracted Skills ({parsedResult.skills?.length || 0}):</b>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
            {parsedResult.skills?.map((s, idx) => (
              <span key={idx} style={{ background: 'rgba(16, 185, 129, 0.18)', color: '#059669', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700' }}>
                {s}
              </span>
            ))}
          </div>

          <div style={{ fontSize: '0.84rem', color: '#374151', fontWeight: '600' }}>
            Years of Experience Detected: <b style={{ color: '#0891b2' }}>{parsedResult.experience_years} yrs</b>
          </div>
        </div>
      )}
    </div>
  );
}
