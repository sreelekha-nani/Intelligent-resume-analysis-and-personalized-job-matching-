import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { atsAPI } from '../services/api';
import { 
  ArrowLeft, RefreshCw, Sparkles, CheckCircle2, AlertTriangle, Lightbulb, 
  Check, Info, Award, FileText, RotateCcw
} from 'lucide-react';

import ATSReportView from '../components/ATSReportView';

export default function ATSResults() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve report and inputs from state or sessionStorage
  const [report, setReport] = useState(() => {
    if (location.state?.report) return location.state.report;
    const stored = sessionStorage.getItem('ats_report');
    return stored ? JSON.parse(stored) : null;
  });

  const [inputs, setInputs] = useState(() => {
    if (location.state?.inputs) return location.state.inputs;
    const stored = sessionStorage.getItem('ats_inputs');
    return stored ? JSON.parse(stored) : null;
  });

  const [reAnalyzing, setReAnalyzing] = useState(false);

  useEffect(() => {
    if (location.state?.report) {
      sessionStorage.setItem('ats_report', JSON.stringify(location.state.report));
    }
    if (location.state?.inputs) {
      sessionStorage.setItem('ats_inputs', JSON.stringify(location.state.inputs));
    }
  }, [location.state]);

  const handleBackToEngine = () => {
    navigate('/ats-engine', { state: { inputs } });
  };

  const handleAnalyzeAnother = () => {
    sessionStorage.removeItem('ats_report');
    sessionStorage.removeItem('ats_inputs');
    navigate('/ats-engine', { state: { reset: true } });
  };

  const handleReAnalyze = async () => {
    if (!inputs || !inputs.targetRole || !inputs.jobDescription) return;
    setReAnalyzing(true);
    try {
      const res = await atsAPI.analyzeATS({
        target_role: inputs.targetRole,
        job_description: inputs.jobDescription,
        job_id: inputs.selectedJobId ? parseInt(inputs.selectedJobId) : null,
        resume_id: inputs.selectedResumeId ? parseInt(inputs.selectedResumeId) : null,
        resume_text: inputs.uploadedResumeText || ''
      });
      setReport(res.data);
      sessionStorage.setItem('ats_report', JSON.stringify(res.data));
    } catch (err) {
      alert('Failed to re-analyze resume.');
    } finally {
      setReAnalyzing(false);
    }
  };

  if (!report || !inputs) {
    return (
      <div className="app-container" style={{ textAlign: 'center', padding: '60px' }}>
        <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>No Active ATS Analysis Found</h3>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Please perform a resume analysis from the ATS Engine input page first.</p>
        <button onClick={() => navigate('/ats-engine')} className="btn-primary" style={{ margin: '0 auto' }}>
          Go to ATS Engine
        </button>
      </div>
    );
  }

  const roleName = inputs.targetRole || 'Target Job Role';
  const resumeName = inputs.resumeName || 'Selected Resume';

  return (
    <div className="app-container">
      {/* TOP NAVIGATION & ACTIONS HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <button 
          onClick={handleBackToEngine} 
          className="btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
        >
          <ArrowLeft size={18} /> ← Back to ATS Engine
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={handleReAnalyze} 
            disabled={reAnalyzing}
            className="btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
          >
            <RefreshCw size={16} className={reAnalyzing ? 'spin-icon' : ''} /> {reAnalyzing ? 'Re-analyzing...' : 'Re-analyze'}
          </button>
          
          <button 
            onClick={handleAnalyzeAnother} 
            className="btn-primary" 
            style={{ padding: '8px 18px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
          >
            <RotateCcw size={16} /> Analyze Another Resume
          </button>
        </div>
      </div>

      {/* RESULTS PAGE HEADER */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '28px', position: 'relative', overflow: 'hidden', background: '#ffffff', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)', borderRadius: '50%' }}></div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
              ATS Engine Analysis Results
            </span>
            <h1 style={{ fontSize: '1.7rem', color: '#1f2937', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
              ATS Resume Analysis
            </h1>
            <div style={{ fontSize: '1.1rem', color: '#0891b2', fontWeight: '700', marginTop: '4px' }}>
              {roleName}
            </div>
          </div>

          <div style={{ padding: '10px 18px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color="#000000" />
            <div>
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', fontWeight: '500' }}>Target Resume File</span>
              <span style={{ fontSize: '0.92rem', color: '#1f2937', fontWeight: '700' }}>Resume: {resumeName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER SHARED ATS REPORT */}
      <ATSReportView report={report} roleName={roleName} resumeName={resumeName} />
    </div>
  );
}
