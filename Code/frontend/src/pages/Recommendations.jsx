import React, { useEffect, useState } from 'react';
import { recommendationAPI, applicationAPI } from '../services/api';
import JobCard from '../components/JobCard';
import { Sparkles, Sliders, Filter } from 'lucide-react';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minMatch, setMinMatch] = useState(0);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  useEffect(() => {
    recommendationAPI.getRecommendations()
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    const token = localStorage.getItem('token');
    if (token) {
      applicationAPI.getMyApplications()
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const ids = new Set(res.data.map(app => app.job_id));
            setAppliedJobIds(ids);
          }
        })
        .catch(err => console.error('Error fetching applications:', err));
    }
  }, []);

  const filtered = recommendations.filter(j => (j.match_score || 0) >= minMatch);

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles color="#06b6d4" size={28} /> AI Recommended Jobs for You
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
          Ranked based on skill-vector similarity between your parsed resume and job requirements.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Calculating personalized match scores...</div>
      ) : filtered.length > 0 ? (
        <div className="grid-2">
          {filtered.map(job => (
            <JobCard 
              key={job.id} 
              job={job} 
              isApplied={appliedJobIds.has(job.id)}
              onApplied={(jobId) => {
                setAppliedJobIds(prev => new Set([...prev, jobId]));
              }}
            />
          ))}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
          <Sparkles size={36} color="#06b6d4" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ color: '#1f2937' }}>No jobs meet the current {minMatch}% match threshold</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '4px', color: '#4b5563' }}>Try lowering the threshold or updating your skills in your candidate profile.</p>
        </div>
      )}
    </div>
  );
}
