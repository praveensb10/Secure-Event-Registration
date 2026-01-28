# 🔐 Secure Event Registration System

Multi-factor authentication system for college event management with role-based access control, encryption, and digital certificates.

## 🛡️ Security Features

- **Authentication:** Password + TOTP (Google Authenticator)
- **Authorization:** Role-Based Access Control (Student/Organizer/Admin)
- **Encryption:** AES-256 for sensitive data
- **Hashing:** bcrypt with salt for passwords
- **Digital Signatures:** SHA-256 on certificates
- **Encoding:** QR codes for certificate verification

**NIST SP 800-63-2 Compliant**

## 🛠️ Tech Stack

**Backend:** Flask (Python) + SQLite  
**Frontend:** React + Axios  
**Security:** bcrypt, cryptography, pyotp, qrcode

## 📦 Installation

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python database.py
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

**Backend:** http://localhost:5000  
**Frontend:** http://localhost:3000

## 🚀 Usage

1. **Register** → Get TOTP QR code → Scan with Google Authenticator
2. **Login** → Enter password + TOTP code
3. **Use system** based on role (Student/Organizer/Admin)

## 🔐 Security Implementation

| Component | Implementation |
|-----------|----------------|
| Authentication | Password + TOTP, Account lockout, Session timeout |
| Authorization | 3×3 Access Control Matrix (Student/Organizer/Admin × Events/Registrations/Certificates) |
| Encryption | AES-256 CBC mode, PKCS7 padding |
| Hashing | bcrypt with automatic salt |
| Digital Signature | SHA-256 hash-based signatures |
| Encoding | QR code with certificate ID + signature |

## 📋 Access Control Matrix

| Role | Events | Registrations | Certificates |
|------|--------|---------------|--------------|
| Student | View All | Create Own | View Own |
| Organizer | Create, View | View All (their events) | Generate (their events) |
| Admin | Full Access | Full Access | Full Access |

## 📚 Code Structure
```
backend/
├── app.py              # Flask API routes
├── auth.py             # Authentication & TOTP
├── encryption.py       # AES-256 encryption
├── certificate_gen.py  # Certificates & QR codes
└── database.py         # SQLite schema

frontend/src/
├── Login.js            # MFA login
├── Register.js         # Registration with QR
├── StudentDashboard.js
├── OrganizerDashboard.js
└── AdminDashboard.js
```

## 🎓 Project Info

**Course:** 23CSE313 - Foundations of Cyber Security  
**Institution:** Amrita Vishwa Vidyapeetham

## 📄 License

MIT License
