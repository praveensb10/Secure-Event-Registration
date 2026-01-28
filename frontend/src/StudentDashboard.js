import React, { useState, useEffect } from 'react';
import { api } from './api';

function StudentDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myCertificates, setMyCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('session_token');
    
    try {
      const [eventsRes, regsRes, certsRes] = await Promise.all([
        api.getEvents(),
        api.getMyRegistrations(token),
        api.getMyCertificates(token)
      ]);

      setEvents(eventsRes.data);
      setMyRegistrations(regsRes.data);
      setMyCertificates(certsRes.data);
    } catch (err) {
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    const token = localStorage.getItem('session_token');
    
    try {
      await api.registerForEvent(eventId, token);
      setMessage('Registered successfully!');
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Student Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Available Events</h2>
        <div style={styles.grid}>
          {events.map(event => {
            const isRegistered = myRegistrations.some(r => r.event_id === event.id);
            
            return (
              <div key={event.id} style={styles.card}>
                <h3 style={styles.cardTitle}>{event.name}</h3>
                <p style={styles.cardText}>{event.description}</p>
                <p style={styles.cardText}><strong>Date:</strong> {event.date}</p>
                <p style={styles.cardText}><strong>Capacity:</strong> {event.max_capacity}</p>
                
                {isRegistered ? (
                  <button style={styles.disabledButton} disabled>
                    Already Registered
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRegister(event.id)} 
                    style={styles.button}
                  >
                    Register
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>My Registrations</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Event</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {myRegistrations.map(reg => (
              <tr key={reg.id}>
                <td style={styles.td}>{reg.event_name}</td>
                <td style={styles.td}>{reg.event_date}</td>
                <td style={styles.td}>
                  <span style={styles.badge}>{reg.status}</span>
                </td>
                <td style={styles.td}>
                  {reg.attendance_marked ? '✅ Marked' : '⏳ Pending'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>My Certificates</h2>
        <div style={styles.grid}>
          {myCertificates.map(cert => (
            <div key={cert.id} style={styles.certCard}>
              <h3 style={styles.cardTitle}>{cert.event_name}</h3>
              <p style={styles.cardText}><strong>ID:</strong> {cert.certificate_id}</p>
              <p style={styles.cardText}><strong>Issued:</strong> {cert.issued_at}</p>
              <p style={styles.cardText}><strong>Signature:</strong></p>
              <div style={styles.signature}>{cert.digital_signature.substring(0, 40)}...</div>
              
              {cert.qr_code_path && (
                <div style={styles.qrContainer}>
                  <img 
                    src={`http://localhost:5000/${cert.qr_code_path}`} 
                    alt="QR Code" 
                    style={styles.qrImage}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '30px',
    borderRadius: '16px',
    color: 'white',
    boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
    animation: 'slideUp 0.6s ease-out'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  username: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '8px 16px',
    borderRadius: '20px'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
  },
  message: {
    padding: '14px 20px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '8px',
    marginBottom: '20px',
    animation: 'slideUp 0.4s ease-out',
    border: '1px solid #93c5fd',
    fontWeight: '500'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#1f2937'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb'
  },
  certCard: {
    backgroundColor: '#fefce8',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '2px solid #fbbf24'
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#1f2937'
  },
  cardText: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '8px'
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '10px'
  },
  disabledButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#d1d5db',
    color: '#6b7280',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '10px',
    cursor: 'not-allowed'
  },
  table: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f3f4f6',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#4b5563'
  },
  badge: {
    padding: '4px 8px',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  },
  signature: {
    backgroundColor: '#f9fafb',
    padding: '10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    color: '#6b7280',
    marginTop: '5px'
  },
  qrContainer: {
    marginTop: '15px',
    textAlign: 'center'
  },
  qrImage: {
    width: '150px',
    height: '150px',
    border: '2px solid #fbbf24',
    borderRadius: '4px'
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  },
  certCard: {
    backgroundColor: '#fefce8',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.2)',
    border: '2px solid #fbbf24',
    transition: 'all 0.3s ease',
    animation: 'scaleIn 0.5s ease-out'
  }
};

export default StudentDashboard;