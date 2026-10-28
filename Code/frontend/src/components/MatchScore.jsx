import React from 'react';

export default function MatchScore({ score = 0 }) {
  let label = 'Low Match';
  let textColor = '#dc2626';
  let bgColor = 'rgba(239, 68, 68, 0.12)';
  let borderColor = 'rgba(239, 68, 68, 0.3)';

  if (score >= 80) {
    label = 'Excellent Match';
    textColor = '#059669';
    bgColor = 'rgba(16, 185, 129, 0.12)';
    borderColor = 'rgba(16, 185, 129, 0.3)';
  } else if (score >= 60) {
    label = 'Good Match';
    textColor = '#d97706';
    bgColor = 'rgba(245, 158, 11, 0.12)';
    borderColor = 'rgba(245, 158, 11, 0.3)';
  } else if (score >= 50) {
    label = 'Moderate Match';
    textColor = '#d97706';
    bgColor = 'rgba(245, 158, 11, 0.12)';
    borderColor = 'rgba(245, 158, 11, 0.3)';
  }

  return (
    <div 
      title="This score estimates how well your selected resume matches this job."
      style={{
        padding: '6px 12px',
        borderRadius: '10px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        textAlign: 'right',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexShrink: 0,
        cursor: 'help'
      }}
    >
      <span style={{ fontSize: '0.78rem', fontWeight: '800', color: textColor, lineHeight: 1.2 }}>
        ATS Match {Math.round(score)}%
      </span>
      <span style={{ fontSize: '0.7rem', color: textColor, fontWeight: '700', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}
