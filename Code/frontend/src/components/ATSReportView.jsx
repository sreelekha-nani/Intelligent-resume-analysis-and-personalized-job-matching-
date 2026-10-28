import React from 'react';
import { 
  CheckCircle2, AlertTriangle, Lightbulb, Check, Info, Award, FileText, Sparkles, Target, Layers 
} from 'lucide-react';

export default function ATSReportView({ report, roleName, resumeName }) {
  if (!report) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
      
      {/* 1. OVERALL ATS SCORE CARD (WEIGHTED) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '24px', marginBottom: '20px' }}>
          
          {/* Circular Score Badge */}
          <div style={{
            width: '95px', height: '95px', borderRadius: '50%',
            background: report.ats_score >= 75 ? 'rgba(16, 185, 129, 0.15)' : (report.ats_score >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
            border: `4px solid ${report.ats_score >= 75 ? '#10b981' : (report.ats_score >= 50 ? '#f59e0b' : '#ef4444')}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: report.ats_score >= 75 ? '#059669' : (report.ats_score >= 50 ? '#d97706' : '#dc2626'), lineHeight: 1 }}>
              {Math.round(report.ats_score)}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: '2px' }}>/ 100</span>
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#1f2937', fontWeight: '800', margin: 0 }}>Overall ATS Score</h2>
              <span style={{
                padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700',
                background: report.match_level === 'Strong' ? 'rgba(16, 185, 129, 0.2)' : (report.match_level === 'Moderate' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                color: report.match_level === 'Strong' ? '#059669' : (report.match_level === 'Moderate' ? '#d97706' : '#dc2626'),
                border: `1px solid ${report.match_level === 'Strong' ? 'rgba(16, 185, 129, 0.4)' : (report.match_level === 'Moderate' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)')}`
              }}>
                {report.match_level} Match
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>
              Calculated using weighted criteria: <b>40% Required Skills</b>, <b>25% Experience</b>, <b>15% Projects</b>, <b>10% Education</b>, <b>10% Format</b>.
            </p>
          </div>
        </div>

        {/* Score Breakdown Category Progress Bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
          {Object.entries(report.breakdown || {}).map(([key, val]) => {
            const labelMap = {
              keyword_match: 'Required Skills (40%)',
              skills_match: 'Skills Match (40%)',
              experience_match: 'Experience (25%)',
              education_match: 'Education (10%)',
              role_relevance: 'Projects (15%)',
              readability: 'Format & Structure (10%)'
            };
            return (
              <div key={key} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: '#4b5563', fontWeight: '500' }}>{labelMap[key] || key}</span>
                  <span style={{ color: '#1f2937', fontWeight: '700' }}>{Math.round(val)}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${val}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: '4px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MATCHED TECHNICAL KEYWORDS */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#1f2937', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} color="#059669" /> Matched Technical Skills ({report.matched_keywords?.length || 0})
        </h3>
        {report.matched_keywords && report.matched_keywords.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {report.matched_keywords.map((kw, i) => (
              <span key={i} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {kw} <Check size={13} />
              </span>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>No target technical skills matched yet.</div>
        )}
      </div>

      {/* 3. MISSING TECHNICAL SKILLS WITH EVIDENCE & RECOMMENDATIONS */}
      {report.missing_keywords && report.missing_keywords.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#1f2937', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="#d97706" /> Missing Technical Skills & Recommendations ({report.missing_keywords.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.missing_keywords.map((item, idx) => (
              <div key={idx} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.98rem', fontWeight: '700', color: '#b45309' }}>Missing Skill: {item.keyword}</span>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>Required Skill</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: '#374151', marginBottom: '6px' }}><b>Reason:</b> {item.why_it_matters}</p>
                
                {item.evidence && (
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '6px', background: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <b>Evidence from JD:</b> "{item.evidence}"
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#0891b2', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6, 182, 212, 0.08)', padding: '6px 10px', borderRadius: '6px' }}>
                  <Info size={13} color="#06b6d4" /> <b>Recommendation:</b> {item.advice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SKILLS GAP CATEGORIZATION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#059669" /> Required Skills Found
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(report.skills_gap?.skills_found || []).map((sk, i) => (
              <span key={i} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '4px 10px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '500' }}>
                {sk}
              </span>
            ))}
            {(report.skills_gap?.skills_found || []).length === 0 && (
              <span style={{ fontSize: '0.82rem', color: '#6b7280' }}>None identified.</span>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} color="#dc2626" /> Required Skills Missing
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(report.skills_gap?.required_missing || []).map((sk, i) => (
              <span key={i} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '600' }}>
                {sk}
              </span>
            ))}
            {(report.skills_gap?.required_missing || []).length === 0 && (
              <span style={{ fontSize: '0.82rem', color: '#059669' }}>All required skills found!</span>
            )}
          </div>
        </div>
      </div>

      {/* Additional Resume Skills */}
      {report.additional_resume_skills && report.additional_resume_skills.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', color: '#1f2937', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#06b6d4" /> Additional Valuable Skills in Resume
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '10px' }}>
            Technologies present in your resume that were not explicitly listed in this job posting, but add professional value.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {report.additional_resume_skills.map((sk, i) => (
              <span key={i} style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.25)', padding: '4px 10px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: '500' }}>
                {sk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. SECTION-BY-SECTION ANALYSIS */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', color: '#1f2937', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} color="#06b6d4" /> Section-by-Section Analysis & Actionable Suggestions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {Object.entries(report.section_analysis || {}).map(([secKey, secVal]) => {
            const isGood = secVal.status === 'Good' || secVal.status === 'Excellent';
            const isMod = secVal.status === 'Needs Improvement';
            return (
              <div key={secKey} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: '#1f2937', fontWeight: '700', fontSize: '0.9rem', textTransform: 'capitalize' }}>{secKey}</span>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '700',
                    background: isGood ? 'rgba(16, 185, 129, 0.2)' : (isMod ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    color: isGood ? '#059669' : (isMod ? '#d97706' : '#dc2626')
                  }}>
                    {secVal.status}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#4b5563', margin: '0 0 6px' }}>{secVal.reason}</p>
                <div style={{ fontSize: '0.78rem', color: '#0891b2', fontStyle: 'italic', background: 'rgba(6, 182, 212, 0.08)', padding: '6px', borderRadius: '6px' }}>
                  💡 {secVal.suggestion}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
