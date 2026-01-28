import React, { useState, useEffect } from 'react';
import { api } from './api';

function AdminDashboard({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem('session_token');

    try {
      const [usersRes, eventsRes] = await Promise.all([
        api.getAllUsers(token),
        api.getEvents()
      ]);

      setUsers(usersRes.data);
      setEvents(eventsRes.data);
    } catch (err) {
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  const studentCount = users.filter(u => u.role === 'student').length;
  const organizerCount = users.filter(u => u.role === 'organizer').length;
  const adminCount = users.filter(u => u.role === 'admin').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <div style={styles.userInfo}>
          <span style={styles.username}>{user.username}</span>
          <button onClick={onLogout} style={styles.logoutButton}>Logout</button>
        </div>
      </div>

      {message && <div style={styles.message}>{message}</div>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{users.length}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{studentCount}</div>
          <div style={styles.statLabel}>Students</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{organizerCount}</div>
          <div style={styles.statLabel}>Organizers</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{events.length}</div>
          <div style={styles.statLabel}>Total Events</div>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Users</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={styles.td}>{u.id}</td>
                <td style={styles.td}>{u.username}</td>
                <td style={styles.td}>{u.email}</td>
                <td style={styles.td}>
                  <span style={getRoleBadgeStyle(u.role)}>{u.role}</span>
                </td>
                <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>All Events</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Event Name</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Organizer</th>
              <th style={styles.th}>Capacity</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td style={styles.td}>{event.id}</td>
                <td style={styles.td}>{event.name}</td>
                <td style={styles.td}>{event.date}</td>
                <td style={styles.td}>{event.organizer_name}</td>
                <td style={styles.td}>{event.max_capacity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const getRoleBadgeStyle = (role) => {
  const baseStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  };

  if (role === 'admin') {
    return { ...baseStyle, backgroundColor: '#fecaca', color: '#991b1b' };
  } else if (role === 'organizer') {
    return { ...baseStyle, backgroundColor: '#fed7aa', color: '#9a3412' };
  } else {
    return { ...baseStyle, backgroundColor: '#d1fae5', color: '#065f46' };
  }
};

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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #e5e7eb'
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
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
  }
};

export default AdminDashboard;