import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import StudentDashboard from './StudentDashboard';
import OrganizerDashboard from './OrganizerDashboard';
import AdminDashboard from './AdminDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const sessionToken = localStorage.getItem('session_token');
    
    if (savedUser && sessionToken) {
      setUser(JSON.parse(savedUser));
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = () => {
    setCurrentPage('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('login');
  };

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'organizer':
        return <OrganizerDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      default:
        return <div>Invalid role</div>;
    }
  };

  if (currentPage === 'dashboard') {
    return renderDashboard();
  }

  return (
    <div>
      {currentPage === 'login' ? (
        <div>
          <Login onLoginSuccess={handleLoginSuccess} />
          <div style={styles.switchContainer}>
            <span style={styles.switchText}>Don't have an account? </span>
            <button 
              onClick={() => setCurrentPage('register')} 
              style={styles.switchButton}
            >
              Register here
            </button>
          </div>
        </div>
      ) : (
        <div>
          <Register onRegisterSuccess={handleRegisterSuccess} />
          <div style={styles.switchContainer}>
            <span style={styles.switchText}>Already have an account? </span>
            <button 
              onClick={() => setCurrentPage('login')} 
              style={styles.switchButton}
            >
              Login here
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  switchContainer: {
    textAlign: 'center',
    marginTop: '20px',
    padding: '20px',
    animation: 'fadeIn 0.5s ease-in'
  },
  switchText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.3s ease'
  }
};

export default App;