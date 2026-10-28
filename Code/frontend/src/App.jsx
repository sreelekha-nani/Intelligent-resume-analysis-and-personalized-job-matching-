import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminSidebar from './components/AdminSidebar';
import ErrorBoundary from './components/ErrorBoundary';
import { authAPI } from './services/api';

// Candidate Pages (Lazy Loaded)
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const ATSAnalysis = lazy(() => import('./pages/ATSAnalysis'));
const ATSResults = lazy(() => import('./pages/ATSResults'));
const Applications = lazy(() => import('./pages/Applications'));

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminJobs = lazy(() => import('./pages/AdminJobs'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminApplications = lazy(() => import('./pages/AdminApplications'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#818cf8', fontWeight: '600' }}>
    Loading page...
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#818cf8', fontWeight: '600' }}>
        Initializing AI Job Navigator System...
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <ErrorBoundary>
        {/* Sidebar selection based on role */}
        {isAdmin ? (
          <AdminSidebar user={user} onLogout={handleLogout} />
        ) : (
          <Navbar user={user} onLogout={handleLogout} />
        )}

        <main className={user ? "main-layout" : "full-layout"}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route 
                path="/login" 
                element={
                  user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />) : <Login onLoginSuccess={setUser} />
                } 
              />
              <Route 
                path="/register" 
                element={
                  user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <Navigate to="/dashboard" />) : <Register onLoginSuccess={setUser} />
                } 
              />

              {/* Candidate Protected Routes */}
              <Route path="/dashboard" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <Dashboard user={user} />) : <Navigate to="/login" />} />
              <Route path="/profile" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <Profile />) : <Navigate to="/login" />} />
              <Route path="/jobs" element={user ? (isAdmin ? <Navigate to="/admin/jobs" /> : <Jobs />) : <Navigate to="/login" />} />
              <Route path="/recommendations" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <Recommendations />) : <Navigate to="/login" />} />
              <Route path="/ats-engine" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <ATSAnalysis />) : <Navigate to="/login" />} />
              <Route path="/ats-engine/results" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" /> : <ATSResults />) : <Navigate to="/login" />} />
              <Route path="/ats-analysis" element={<Navigate to="/ats-engine" />} />
              <Route path="/applications" element={user ? (isAdmin ? <Navigate to="/admin/applications" /> : <Applications />) : <Navigate to="/login" />} />

              {/* Admin Protected Routes */}
              <Route path="/admin/dashboard" element={user && isAdmin ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
              <Route path="/admin/jobs" element={user && isAdmin ? <AdminJobs user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
              <Route path="/admin/users" element={user && isAdmin ? <AdminUsers user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
              <Route path="/admin/applications" element={user && isAdmin ? <AdminApplications user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/dashboard" : "/login"} />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

              {/* Fallback Route */}
              <Route path="*" element={<Navigate to={user ? (isAdmin ? "/admin/dashboard" : "/dashboard") : "/login"} />} />
            </Routes>
          </Suspense>
        </main>
      </ErrorBoundary>
    </Router>
  );
}
