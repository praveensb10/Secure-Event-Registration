import React, { useState } from 'react';
import { api } from './api';
import { QRCodeCanvas } from 'qrcode.react';

function Register({ onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totpUri, setTotpUri] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.register({
        username,
        email,
        password,
        role
      });

      setTotpUri(response.data.totp_uri);
      setTotpSecret(response.data.totp_secret);
      setShowQR(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (showQR) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Setup Multi-Factor Authentication</h2>
          
          <div style={styles.qrSection}>
            <p style={styles.text}>
              1. Install <strong>Google Authenticator</strong> on your phone
            </p>
            <p style={styles.text}>
              2. Scan this QR code with the app:
            </p>
            
            <div style={styles.qrContainer}>
              <QRCodeCanvas value={totpUri} size={200} />
            </div>
            
            <p style={styles.text}>Or enter this secret manually:</p>
            <div style={styles.secretBox}>
              {totpSecret}
            </div>
            
            <button 
              onClick={onRegisterSuccess} 
              style={styles.button}
            >
              Done - Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register - Secure Event System</h2>
        
        <form onSubmit={handleRegister}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
            <small style={styles.hint}>
              Min 8 chars, uppercase, lowercase, number, special character
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              style={styles.input}
            >
              <option value="student">Student</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    padding: '20px',
    animation: 'fadeIn 0.5s ease-in'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    width: '100%',
    maxWidth: '400px',
    animation: 'slideUp 0.6s ease-out'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  text: {
    fontSize: '14px',
    color: '#374151',
    marginBottom: '10px',
    fontWeight: '500'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s ease',
    outline: 'none'
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '5px',
    display: 'block'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    animation: 'shake 0.5s ease'
  },
  qrSection: {
    textAlign: 'center',
    animation: 'fadeIn 0.8s ease-in'
  },
  qrContainer: {
    margin: '20px 0',
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    animation: 'scaleIn 0.5s ease-out'
  },
  secretBox: {
    backgroundColor: '#f3f4f6',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    marginBottom: '20px',
    border: '2px dashed #d1d5db'
  }
};

export default Register;