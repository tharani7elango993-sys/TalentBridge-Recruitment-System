import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase() : 'U';

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Talent<span>Bridge</span></Link>
      <div className="nav-links">
        {user?.role === 'jobseeker' && <>
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
        </>}
        {user?.role === 'hr' && <>
          <Link to="/hr" className="nav-link">Dashboard</Link>
        </>}
        {user?.role === 'admin' && <>
          <Link to="/admin" className="nav-link">Admin Panel</Link>
        </>}
        {user && (
          <>
            <span className="nav-badge">
              {user.role === 'admin' ? '⚙️' : user.role === 'hr' ? '💼' : '👤'} {initials(user.name)} · {user.role}
            </span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
