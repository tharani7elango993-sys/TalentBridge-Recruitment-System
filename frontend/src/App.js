import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login            from './pages/Login';
import Register         from './pages/Register';
import SeekerDashboard  from './pages/SeekerDashboard';
import HRDashboard      from './pages/HRDashboard';
import AdminDashboard   from './pages/AdminDashboard';
import ApplyJob from "./pages/ApplyJob";

// Role-based private route
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

function getDashboard(role) {
  if (role === 'admin') return '/admin';
  if (role === 'hr')    return '/hr';
  return '/dashboard';
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={getDashboard(user.role)} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={getDashboard(user.role)} replace />} />

      <Route path="/dashboard" element={<PrivateRoute roles={['jobseeker']}><SeekerDashboard /></PrivateRoute>} />
      <Route path="/hr"        element={<PrivateRoute roles={['hr']}><HRDashboard /></PrivateRoute>} />
      <Route path="/admin"     element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

      <Route path="/unauthorized" element={<div style={{textAlign:'center',padding:'60px',fontFamily:'DM Sans,sans-serif'}}><h2>🚫 Unauthorized</h2><p style={{color:'#64748b',marginTop:'8px'}}>You don't have permission to view this page.</p></div>} />
      <Route path="*" element={<Navigate to={user ? getDashboard(user.role) : '/login'} replace />} />
     <Route path="/apply/:jobId" element={<ApplyJob />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
