import React, { useState, useEffect } from 'react';
import { api } from './api';

function OrganizerDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    max_capacity: 100
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await api.getEvents();
      setEvents(res.data);
    } catch (err) {
      setMessage('Error loading events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('session_token');

    try {
      await api.createEvent(newEvent, token);
      setMessage('Event created successfully!');
      setShowCreateForm(false);
      setNewEvent({ name: '', description: '', date: '', max_capacity: 100 });
      loadEvents();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Failed to create event');
    }
  };

  const loadRegistrations = async (eventId) => {
    const token = localStorage.getItem('session_token');

    try {
      const res = await api.getEventRegistrations(eventId, token);
      setRegistrations(res.data);
      setSelectedEvent(eventId);
    } catch (err) {
      setMessage('Error loading registrations');
    }
  };

  const handleMarkAttendance = async (registrationId) => {
    const token = localStorage.getItem('session_token');

    try {
      await api.markAttendance(registrationId, token);
      setMessage('Attendance marked!');
      loadRegistrations(selectedEvent);
    } catch (err) {
      setMessage('Error marking attendance');
    }
  };

  const handleGenerateCertificate = async (registrationId) => {
    const token = localStorage.getItem('session_token');

    try {
      await api.generateCertificate(registrationId, token);
      setMessage('Certificate generated!');
      loadRegistrations(selectedEvent);
    } catch (err) {
      setMessage(err.response?.data?.error || 'Error generating certificate');
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Organizer Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>My Events</h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)} 
            style={styles.createButton}
          >
            {showCreateForm ? 'Cancel' : '+ Create Event'}
          </button>
        </div>

        {showCreateForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>Create New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Event Name</label>
                <input
                  type="text"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Max Capacity</label>
                <input
                  type="number"
                  value={newEvent.max_capacity}
                  onChange={(e) => setNewEvent({...newEvent, max_capacity: e.target.value})}
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" style={styles.button}>
                Create Event
              </button>
            </form>
          </div>
        )}

        <div style={styles.grid}>
          {events.map(event => (
            <div key={event.id} style={styles.card}>
              <h3 style={styles.cardTitle}>{event.name}</h3>
              <p style={styles.cardText}>{event.description}</p>
              <p style={styles.cardText}><strong>Date:</strong> {event.date}</p>
              <p style={styles.cardText}><strong>Capacity:</strong> {event.max_capacity}</p>
              <button 
                onClick={() => loadRegistrations(event.id)}
                style={styles.button}
              >
                View Registrations
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Event Registrations</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Attendance</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg.id}>
                  <td style={styles.td}>{reg.student_name}</td>
                  <td style={styles.td}>{reg.student_email}</td>
                  <td style={styles.td}>
                    <span style={styles.badge}>{reg.status}</span>
                  </td>
                  <td style={styles.td}>
                    {reg.attendance_marked ? '✅ Marked' : '⏳ Not Marked'}
                  </td>
                  <td style={styles.td}>
                    {!reg.attendance_marked ? (
                      <button 
                        onClick={() => handleMarkAttendance(reg.id)}
                        style={styles.smallButton}
                      >
                        Mark Attendance
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleGenerateCertificate(reg.id)}
                        style={styles.certButton}
                      >
                        Generate Certificate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #e5e7eb'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  username: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  message: {
    padding: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  section: {
    marginBottom: '40px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  formCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '24px',
    border: '1px solid #e5e7eb'
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#1f2937'
  },
  formGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
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
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  certButton: {
    padding: '6px 12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  }
};

export default OrganizerDashboard;