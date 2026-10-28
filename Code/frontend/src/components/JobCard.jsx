import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Building, MapPin, Briefcase, Clock, Users, XCircle } from 'lucide-react';
import ApplicationModal from './ApplicationModal';
import { formatTimeAgo } from '../utils/formatters';

export default function JobCard({ job, isApplied, onApplied }) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [hasAppliedLocally, setHasAppliedLocally] = useState(false);

  const applied = Boolean(isApplied || hasAppliedLocally || job.is_applied);
  const isClosed = Boolean(job.status && (job.status.toLowerCase() === 'closed' || job.status.toLowerCase() === 'draft'));
  const isDisabled = applied || isClosed;

  const skillsList = !job.skills_required ? [] : (Array.isArray(job.skills_required) ? job.skills_required : job.skills_required.split(',').map(s => s.trim()).filter(Boolean));

  const visibleSkills = skillsList.slice(0, 6);
  const extraSkillsCount = skillsList.length > 6 ? skillsList.length - 6 : 0;

  const handleApplicationSuccess = () => {
    setHasAppliedLocally(true);
    if (onApplied) onApplied(job.id);
  };

  const openingsCount = job.openings_count || 1;

  return (
    <>
      <div 
        className="glass-panel" 
        style={{ 
          padding: '22px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between', 
          height: '100%',
          borderRadius: '16px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          boxShadow: '0 4px 20px rgba(6, 182, 212, 0.08)'
        }}
      >
        <div>
          {/* HEADER: TITLE + COMPACT ATS BADGE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1f2937', margin: '0 0 6px', lineHeight: 1.3 }}>
                {job.title}
              </h3>
              
              {/* SUB-HEADER: COMPANY • LOCATION • WORK TYPE */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '0.86rem', fontWeight: '600', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ color: '#1f2937', fontWeight: '700' }}>{job.company}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#4b5563', fontWeight: '600' }}>{job.location}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span style={{ color: '#0891b2', fontWeight: '700' }}>{job.employment_type || job.job_type || 'Full-time'}</span>
              </div>

              {/* METADATA CHIPS: OPENINGS COUNT & POSTED TIME */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  color: '#166534', 
                  padding: '3px 9px', 
                  borderRadius: '6px', 
                  fontSize: '0.78rem', 
                  fontWeight: '700' 
                }}>
                  <Users size={13} color="#16a34a" />
                  {openingsCount} {openingsCount === 1 ? 'Opening' : 'Openings'}
                </span>

                <span style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  color: '#475569', 
                  padding: '3px 9px', 
                  borderRadius: '6px', 
                  fontSize: '0.78rem', 
                  fontWeight: '600' 
                }}>
                  <Clock size={13} color="#64748b" />
                  {formatTimeAgo(job.created_at, 'Posted')}
                </span>
              </div>
            </div>
          </div>

          {/* SHORT DESCRIPTION */}
          <p style={{ 
            fontSize: '0.88rem', 
            color: '#374151', 
            fontWeight: '500',
            lineHeight: '1.5', 
            minHeight: '4.5em',
            margin: '14px 0 16px', 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden'
          }}>
            {job.description}
          </p>

          {/* SKILL CHIPS */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
            {visibleSkills.map((skill, idx) => (
              <span 
                key={idx} 
                style={{ 
                  background: 'rgba(6, 182, 212, 0.12)', 
                  color: '#0891b2', 
                  border: '1px solid rgba(6, 182, 212, 0.35)', 
                  padding: '4px 10px', 
                  borderRadius: '8px', 
                  fontSize: '0.78rem', 
                  fontWeight: '700' 
                }}
              >
                {skill}
              </span>
            ))}
            {extraSkillsCount > 0 && (
              <span 
                style={{ 
                  background: '#f1f5f9', 
                  color: '#374151', 
                  border: '1px solid #cbd5e1', 
                  padding: '4px 8px', 
                  borderRadius: '8px', 
                  fontSize: '0.78rem', 
                  fontWeight: '700' 
                }}
              >
                +{extraSkillsCount} More
              </span>
            )}
          </div>
        </div>

        {/* FOOTER: SALARY RANGE + APPLY NOW BUTTON */}
        <div style={{ paddingTop: '14px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '0.88rem', color: '#059669', fontWeight: '800' }}>
            {job.salary_range || 'Competitive Compensation'}
          </div>

          <button 
            onClick={() => !isDisabled && setShowApplyModal(true)} 
            disabled={isDisabled} 
            className={isDisabled ? "btn-secondary" : "btn-primary"} 
            style={{ 
              padding: '8px 20px', 
              fontSize: '0.85rem', 
              borderRadius: '10px', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              ...(applied ? {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                fontWeight: '700'
              } : isClosed ? {
                background: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                fontWeight: '700'
              } : {})
            }}
          >
            {applied ? (
              <><CheckCircle2 size={15} color="#16a34a" /> Applied</>
            ) : isClosed ? (
              <><XCircle size={15} color="#dc2626" /> Application Closed</>
            ) : (
              <>Apply Now <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>

      {/* MULTI-STEP JOB APPLICATION MODAL */}
      {showApplyModal && (
        <ApplicationModal 
          job={job} 
          onClose={() => setShowApplyModal(false)} 
          onSuccess={handleApplicationSuccess} 
        />
      )}
    </>
  );
}
