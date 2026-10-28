import React, { useEffect, useState, useCallback } from 'react';
import { jobAPI, applicationAPI } from '../services/api';
import JobCard from '../components/JobCard';
import { Search, MapPin, Filter, Briefcase, X, Calendar, Award, Clock, RefreshCw, DollarSign } from 'lucide-react';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());

  // Fetch applications for logged-in user to check which jobs were already applied
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      applicationAPI.getMyApplications()
        .then(res => {
          if (res.data && Array.isArray(res.data)) {
            const ids = new Set(res.data.map(app => app.job_id));
            setAppliedJobIds(ids);
          }
        })
        .catch(err => console.error('Error fetching user applications:', err));
    }
  }, []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [salaryFilter, setSalaryFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [postedFilter, setPostedFilter] = useState('');

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce handler for keyword search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch jobs dynamically based on active filters
  const fetchJobs = useCallback(() => {
    setLoading(true);

    const params = {};
    if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
    if (locationQuery.trim()) params.location = locationQuery.trim();
    if (salaryFilter) params.salary = salaryFilter;
    if (jobTypeFilter) params.job_type = jobTypeFilter;
    if (experienceFilter) params.experience = experienceFilter;
    if (postedFilter) params.posted = postedFilter;

    jobAPI.searchJobs(params)
      .then(res => setJobs(res.data || []))
      .catch(err => console.error('Error fetching jobs:', err))
      .finally(() => setLoading(false));
  }, [debouncedSearch, locationQuery, salaryFilter, jobTypeFilter, experienceFilter, postedFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSalaryFilter('');
    setJobTypeFilter('');
    setExperienceFilter('');
    setPostedFilter('');
    setDebouncedSearch('');
  };

  // Helper labels for active filter chips
  const getSalaryLabel = (val) => {
    const map = {
      '1-3': '1 LPA - 3 LPA',
      '3-6': '3 LPA - 6 LPA',
      '4-6': '4 LPA - 6 LPA',
      '6-10': '6 LPA - 10 LPA',
      '10-15': '10 LPA - 15 LPA',
      '15-25': '15 LPA - 25 LPA',
      '25+': '25 LPA+'
    };
    return map[val] || val;
  };

  const getExperienceLabel = (val) => {
    const map = {
      entry: 'Entry Level',
      senior: 'Senior Level',
      manager: 'Manager',
      director: 'Director',
      executive: 'Executive'
    };
    return map[val] || val;
  };

  const getPostedLabel = (val) => {
    const map = {
      '24hours': 'Past 24 Hours',
      '7days': 'Past 7 Days',
      '30days': 'Past 1 Month'
    };
    return map[val] || val;
  };

  const activeFilters = [];
  if (debouncedSearch.trim()) activeFilters.push({ key: 'search', label: `Keyword: "${debouncedSearch}"`, clear: () => { setSearchQuery(''); setDebouncedSearch(''); } });
  if (locationQuery.trim()) activeFilters.push({ key: 'location', label: `Location: ${locationQuery}`, clear: () => setLocationQuery('') });
  if (salaryFilter) activeFilters.push({ key: 'salary', label: `Salary: ${getSalaryLabel(salaryFilter)}`, clear: () => setSalaryFilter('') });
  if (jobTypeFilter) activeFilters.push({ key: 'job_type', label: `Type: ${jobTypeFilter}`, clear: () => setJobTypeFilter('') });
  if (experienceFilter) activeFilters.push({ key: 'experience', label: `Exp: ${getExperienceLabel(experienceFilter)}`, clear: () => setExperienceFilter('') });
  if (postedFilter) activeFilters.push({ key: 'posted', label: `Posted: ${getPostedLabel(postedFilter)}`, clear: () => setPostedFilter('') });

  return (
    <div className="app-container">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', color: '#1f2937', fontWeight: '800', marginBottom: '4px' }}>
          Explore Job Opportunities
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Find positions tailored to your skill set with real-time search & filtering.
        </p>
      </div>

      {/* FILTER TOOLBAR PANEL */}
      <form 
        onSubmit={handleSearchSubmit} 
        className="glass-panel" 
        style={{ 
          padding: '18px 20px', 
          marginBottom: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '14px' 
        }}
      >
        {/* ROW 1: KEYWORD, LOCATION & SALARY RANGE SEARCH INPUTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '42px' }}
              placeholder="Title, skill, or company (e.g. React, Python)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <MapPin size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '42px' }}
              placeholder="City, State, Country, or Remote"
              value={locationQuery}
              onChange={e => setLocationQuery(e.target.value)}
            />
          </div>

          {/* SALARY RANGE DROPDOWN (BESIDE CITY BOX) */}
          <div style={{ position: 'relative' }}>
            <DollarSign size={18} color="#6b7280" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <select 
              className="input-field"
              value={salaryFilter}
              onChange={e => setSalaryFilter(e.target.value)}
              style={{ paddingLeft: '42px', color: salaryFilter ? '#1f2937' : '#6b7280', fontWeight: salaryFilter ? '700' : 'normal' }}
            >
              <option value="">All Salary Ranges</option>
              <option value="1-3">1 LPA - 3 LPA</option>
              <option value="3-6">3 LPA - 6 LPA</option>
              <option value="4-6">4 LPA - 6 LPA</option>
              <option value="6-10">6 LPA - 10 LPA</option>
              <option value="10-15">10 LPA - 15 LPA</option>
              <option value="15-25">15 LPA - 25 LPA</option>
              <option value="25+">25 LPA+</option>
            </select>
          </div>
        </div>

        {/* ROW 2: DROPDOWNS & ACTION BUTTONS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'center' }}>
          {/* Job Type Dropdown */}
          <div>
            <select 
              className="input-field"
              value={jobTypeFilter}
              onChange={e => setJobTypeFilter(e.target.value)}
              style={{ color: jobTypeFilter ? '#1f2937' : '#6b7280' }}
            >
              <option value="">All Job Types</option>
              <option value="Full-time">Full-Time</option>
              <option value="Part-time">Part-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          {/* Experience Level Dropdown */}
          <div>
            <select 
              className="input-field"
              value={experienceFilter}
              onChange={e => setExperienceFilter(e.target.value)}
              style={{ color: experienceFilter ? '#1f2937' : '#6b7280' }}
            >
              <option value="">All Experience Levels</option>
              <option value="entry">Entry Level</option>
              <option value="senior">Senior Level</option>
              <option value="manager">Manager</option>
              <option value="director">Director</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {/* Posted Date Dropdown */}
          <div>
            <select 
              className="input-field"
              value={postedFilter}
              onChange={e => setPostedFilter(e.target.value)}
              style={{ color: postedFilter ? '#1f2937' : '#6b7280' }}
            >
              <option value="">All Posted Dates</option>
              <option value="24hours">Past 24 Hours</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 1 Month</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, height: '42px', justifyContent: 'center', fontSize: '0.85rem' }}>
              Search Jobs
            </button>
            
            {activeFilters.length > 0 && (
              <button 
                type="button" 
                onClick={handleClearFilters}
                className="btn-secondary" 
                style={{ height: '42px', padding: '0 14px', fontSize: '0.82rem', borderRadius: '10px' }}
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* ACTIVE FILTER CHIPS */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600', marginRight: '4px' }}>
            Active Filters:
          </span>
          {activeFilters.map(filter => (
            <span 
              key={filter.key} 
              style={{ 
                background: 'rgba(6, 182, 212, 0.15)', 
                color: '#0891b2', 
                border: '1px solid rgba(6, 182, 212, 0.3)', 
                padding: '4px 10px', 
                borderRadius: '16px', 
                fontSize: '0.78rem', 
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {filter.label}
              <button 
                type="button" 
                onClick={filter.clear}
                style={{ background: 'transparent', border: 'none', color: '#0891b2', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <button 
            onClick={handleClearFilters} 
            style={{ background: 'transparent', border: 'none', color: '#dc2626', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', marginLeft: '6px' }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* JOB GRID / EMPTY STATES */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <RefreshCw size={18} className="spin-icon" color="#06b6d4" /> Fetching matching job opportunities...
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid-2">
          {jobs.map(job => (
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
        <div className="glass-panel" style={{ padding: '50px 24px', textAlign: 'center', color: '#6b7280' }}>
          <Briefcase size={40} color="#06b6d4" style={{ margin: '0 auto 14px', display: 'block' }} />
          <h3 style={{ fontSize: '1.2rem', color: '#1f2937', fontWeight: '700', marginBottom: '6px' }}>
            {locationQuery ? "No jobs found for this location." : "No jobs match your current filters."}
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#4b5563', maxWidth: '480px', margin: '0 auto 20px' }}>
            Try adjusting your search criteria, clearing location constraints, or exploring all available openings.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={handleClearFilters} className="btn-secondary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
              Clear Filters
            </button>
            <button onClick={handleClearFilters} className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
              View All Jobs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
