import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = {
  register: (userData) => 
    axios.post(`${API_URL}/register`, userData),
  
  login: (credentials) => 
    axios.post(`${API_URL}/login`, credentials),
  
  verifyTotp: (data) => 
    axios.post(`${API_URL}/verify-totp`, data),
  
  getEvents: () => 
    axios.get(`${API_URL}/events`),
  
  createEvent: (eventData, token) => 
    axios.post(`${API_URL}/events`, eventData, {
      headers: { Authorization: token }
    }),
  
  registerForEvent: (eventId, token) => 
    axios.post(`${API_URL}/register-event`, { event_id: eventId }, {
      headers: { Authorization: token }
    }),
  
  getMyRegistrations: (token) => 
    axios.get(`${API_URL}/my-registrations`, {
      headers: { Authorization: token }
    }),
  
  getEventRegistrations: (eventId, token) => 
    axios.get(`${API_URL}/event-registrations/${eventId}`, {
      headers: { Authorization: token }
    }),
  
  markAttendance: (registrationId, token) => 
    axios.post(`${API_URL}/mark-attendance`, { registration_id: registrationId }, {
      headers: { Authorization: token }
    }),
  
  generateCertificate: (registrationId, token) => 
    axios.post(`${API_URL}/generate-certificate`, { registration_id: registrationId }, {
      headers: { Authorization: token }
    }),
  
  getMyCertificates: (token) => 
    axios.get(`${API_URL}/my-certificates`, {
      headers: { Authorization: token }
    }),
  
  verifyCertificate: (certificateId) => 
    axios.get(`${API_URL}/verify-certificate/${certificateId}`),
  
  getAllUsers: (token) => 
    axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: token }
    })
};