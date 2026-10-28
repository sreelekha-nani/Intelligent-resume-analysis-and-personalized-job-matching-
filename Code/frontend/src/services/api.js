import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  register: (email, password, full_name) => api.post('/auth/register', { email, password, full_name }),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, new_password) => api.post('/auth/reset-password', { email, otp, new_password }),
  googleLogin: (credential) => api.post('/auth/google', { credential })
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData)
};

export const resumeAPI = {
  uploadResume: (formData) => api.post('/resumes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyResumes: () => api.get('/resumes/my-resumes'),
  setActiveResume: (id) => api.put(`/resumes/${id}/set-active`),
  deleteResume: (id) => api.delete(`/resumes/${id}`)
};

export const jobAPI = {
  searchJobs: (params) => api.get('/jobs/search', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`)
};

export const recommendationAPI = {
  getRecommendations: () => api.get('/recommendations/')
};

export const atsAPI = {
  analyzeATS: (data) => api.post('/ats/analyze', data)
};

export const applicationAPI = {
  applyToJob: (data) => api.post('/applications/apply', data),
  applyForJob: (data) => api.post('/applications/apply', data),
  generateCoverLetter: (data) => api.post('/applications/generate-cover-letter', data),
  getMyApplications: () => api.get('/applications/my-applications'),
  updateStatus: (id, data) => api.put(`/applications/${id}/status`, data),
  withdrawApplication: (id) => api.delete(`/applications/${id}`)
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats')
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getJobs: (params) => api.get('/admin/jobs', { params }),
  createJob: (data) => api.post('/admin/jobs', data),
  getJobById: (id) => api.get(`/admin/jobs/${id}`),
  updateJob: (id, data) => api.put(`/admin/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserProfile: (id) => api.get(`/admin/users/${id}/profile`),
  getApplications: (params) => api.get('/admin/applications', { params }),
  updateApplicationStatus: (id, data) => api.put(`/admin/applications/${id}/status`, data),
  getApplicationDetails: (id) => api.get(`/admin/applications/${id}`)
};

export default api;
