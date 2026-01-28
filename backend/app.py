from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import auth
import encryption
import certificate_gen
from database import get_db_connection, init_db

app = Flask(__name__)
CORS(app)

# Initialize database on startup
init_db()

# ============================================
# RUBRIC 1: AUTHENTICATION
# ============================================

@app.route('/api/register', methods=['POST'])
def register():
    """
    RUBRIC 1: SINGLE-FACTOR AUTHENTICATION (Registration)
    RUBRIC 4: HASHING WITH SALT
    """
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    
    # Validate password strength (NIST SP 800-63-2)
    is_valid, message = auth.validate_password_strength(password)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Hash password with salt
    password_hash, salt = auth.hash_password(password)
    
    # Generate TOTP secret for MFA
    totp_secret = auth.generate_totp_secret()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, salt, role, totp_secret)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (username, email, password_hash, salt, role, totp_secret))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # Generate TOTP URI for QR code (Google Authenticator setup)
        totp_uri = auth.generate_totp_uri(email, totp_secret)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'totp_uri': totp_uri,
            'totp_secret': totp_secret
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    """
    RUBRIC 1: MULTI-FACTOR AUTHENTICATION (Login)
    Step 1: Verify username and password
    """
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Check account lockout (NIST SP 800-63-2)
    is_locked, message = auth.check_account_lockout(username)
    if is_locked:
        return jsonify({'error': message}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, password_hash, role, totp_secret 
        FROM users WHERE username = ?
    ''', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Verify password
    if not auth.verify_password(password, user['password_hash']):
        auth.increment_failed_attempts(username)
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Reset failed attempts on successful password verification
    auth.reset_failed_attempts(username)
    
    return jsonify({
        'message': 'Password verified. Enter TOTP code.',
        'user_id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'requires_totp': True
    }), 200

@app.route('/api/verify-totp', methods=['POST'])
def verify_totp():
    """
    RUBRIC 1: MULTI-FACTOR AUTHENTICATION (MFA)
    Step 2: Verify TOTP code from Google Authenticator
    """
    data = request.json
    username = data.get('username')
    totp_code = data.get('totp_code')
    
    print(f"DEBUG: Verifying TOTP for user: {username}, code: {totp_code}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, username, email, role, totp_secret 
        FROM users WHERE username = ?
    ''', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        print("DEBUG: User not found")
        return jsonify({'error': 'User not found'}), 404
    
    print(f"DEBUG: User found, TOTP secret: {user['totp_secret']}")
    
    # Verify TOTP code with larger time window
    if not auth.verify_totp(user['totp_secret'], totp_code):
        print("DEBUG: TOTP verification failed")
        return jsonify({'error': 'Invalid TOTP code'}), 401
    
    print("DEBUG: TOTP verification SUCCESS")
    
    # Create session (NIST SP 800-63-2 session management)
    session_token = auth.create_session(user['id'])
    
    return jsonify({
        'message': 'Login successful',
        'session_token': session_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

# ============================================
# RUBRIC 2: AUTHORIZATION - ACCESS CONTROL
# ============================================

def require_auth(required_role=None):
    """
    RUBRIC 2: ACCESS CONTROL IMPLEMENTATION
    Enforce access permissions programmatically
    """
    session_token = request.headers.get('Authorization')
    
    if not session_token:
        return None, jsonify({'error': 'No session token provided'}), 401
    
    user_id = auth.validate_session(session_token)
    
    if not user_id:
        return None, jsonify({'error': 'Invalid or expired session'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, email, role FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return None, jsonify({'error': 'User not found'}), 404
    
    # Check role-based access
    if required_role and user['role'] != required_role:
        return None, jsonify({'error': f'Access denied. Required role: {required_role}'}), 403
    
    return dict(user), None, None

# ============================================
# EVENTS API - RUBRIC 2: ACCESS CONTROL
# ============================================

@app.route('/api/events', methods=['GET'])
def get_events():
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    ALL users can view events (Public access)
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT e.*, u.username as organizer_name 
        FROM events e 
        JOIN users u ON e.organizer_id = u.id
        ORDER BY e.date DESC
    ''')
    
    events = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(event) for event in events]), 200

@app.route('/api/events', methods=['POST'])
def create_event():
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    ONLY organizers and admins can create events
    RUBRIC 3: ENCRYPTION
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    # Check role (RUBRIC 2: Access Control)
    if user['role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Only organizers can create events'}), 403
    
    data = request.json
    name = data.get('name')
    description = data.get('description')
    date = data.get('date')
    max_capacity = data.get('max_capacity', 100)
    
    # RUBRIC 3: ENCRYPTION - Encrypt sensitive event details
    encryption_key = encryption.generate_encryption_key()
    encrypted_description = encryption.encrypt_data(description, encryption_key)
    key_string = encryption.key_to_string(encryption_key)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO events (name, description, date, organizer_id, max_capacity, 
                          encrypted_details, encryption_key)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (name, description, date, user['id'], max_capacity, encrypted_description, key_string))
    
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Event created successfully',
        'event_id': event_id
    }), 201

@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event_details(event_id):
    """
    RUBRIC 3: ENCRYPTION & DECRYPTION
    Decrypt event details when authorized user accesses
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
    event = cursor.fetchone()
    conn.close()
    
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    event_dict = dict(event)
    
    # RUBRIC 3: DECRYPTION - Decrypt sensitive details
    if event_dict['encrypted_details'] and event_dict['encryption_key']:
        key = encryption.string_to_key(event_dict['encryption_key'])
        decrypted_description = encryption.decrypt_data(event_dict['encrypted_details'], key)
        event_dict['decrypted_description'] = decrypted_description
    
    return jsonify(event_dict), 200

# ============================================
# REGISTRATIONS API - RUBRIC 2: ACCESS CONTROL
# ============================================

@app.route('/api/register-event', methods=['POST'])
def register_for_event():
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    ONLY students can register for events
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    # Check role (RUBRIC 2: Access Control)
    if user['role'] != 'student':
        return jsonify({'error': 'Only students can register for events'}), 403
    
    data = request.json
    event_id = data.get('event_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO registrations (student_id, event_id, status)
            VALUES (?, ?, 'approved')
        ''', (user['id'], event_id))
        
        registration_id = cursor.lastrowid
        conn.commit()
        
        return jsonify({
            'message': 'Registered for event successfully',
            'registration_id': registration_id
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Already registered or event not found'}), 400
    finally:
        conn.close()

@app.route('/api/my-registrations', methods=['GET'])
def get_my_registrations():
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    Students can ONLY view their OWN registrations
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT r.*, e.name as event_name, e.date as event_date
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.student_id = ?
        ORDER BY r.registered_at DESC
    ''', (user['id'],))
    
    registrations = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(reg) for reg in registrations]), 200

@app.route('/api/event-registrations/<int:event_id>', methods=['GET'])
def get_event_registrations(event_id):
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    ONLY organizers and admins can view event registrations
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    if user['role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Access denied'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT r.*, u.username as student_name, u.email as student_email
        FROM registrations r
        JOIN users u ON r.student_id = u.id
        WHERE r.event_id = ?
    ''', (event_id,))
    
    registrations = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(reg) for reg in registrations]), 200

# ============================================
# ATTENDANCE & CERTIFICATES
# RUBRIC 4: DIGITAL SIGNATURE, RUBRIC 5: QR CODE
# ============================================

@app.route('/api/mark-attendance', methods=['POST'])
def mark_attendance():
    """
    RUBRIC 2: ACCESS CONTROL - Policy Definition
    ONLY organizers can mark attendance
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    if user['role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Only organizers can mark attendance'}), 403
    
    data = request.json
    registration_id = data.get('registration_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE registrations SET attendance_marked = 1 WHERE id = ?
    ''', (registration_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Attendance marked successfully'}), 200

@app.route('/api/generate-certificate', methods=['POST'])
def generate_certificate():
    """
    RUBRIC 4: DIGITAL SIGNATURE USING HASH
    RUBRIC 5: QR CODE ENCODING
    ONLY organizers can generate certificates for students who attended
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    if user['role'] not in ['organizer', 'admin']:
        return jsonify({'error': 'Only organizers can generate certificates'}), 403
    
    data = request.json
    registration_id = data.get('registration_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get registration details
    cursor.execute('''
        SELECT r.*, u.username as student_name, e.name as event_name, e.date as event_date
        FROM registrations r
        JOIN users u ON r.student_id = u.id
        JOIN events e ON r.event_id = e.id
        WHERE r.id = ? AND r.attendance_marked = 1
    ''', (registration_id,))
    
    registration = cursor.fetchone()
    conn.close()
    
    if not registration:
        return jsonify({'error': 'Registration not found or attendance not marked'}), 404
    
    # Check if certificate already exists
    existing_cert = certificate_gen.get_certificate_by_id(f"CERT-{registration_id}")
    if existing_cert:
        return jsonify({'error': 'Certificate already generated'}), 400
    
    # Generate certificate with digital signature and QR code
    certificate = certificate_gen.create_certificate(
        registration_id,
        registration['student_name'],
        registration['event_name'],
        registration['event_date']
    )
    
    return jsonify({
        'message': 'Certificate generated successfully',
        'certificate': certificate
    }), 201

@app.route('/api/my-certificates', methods=['GET'])
def get_my_certificates():
    """
    RUBRIC 2: ACCESS CONTROL
    Students can ONLY view their OWN certificates
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT c.* FROM certificates c
        JOIN registrations r ON c.registration_id = r.id
        WHERE r.student_id = ?
    ''', (user['id'],))
    
    certificates = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(cert) for cert in certificates]), 200

@app.route('/api/verify-certificate/<certificate_id>', methods=['GET'])
def verify_certificate(certificate_id):
    """
    RUBRIC 4: DIGITAL SIGNATURE VERIFICATION
    Anyone can verify certificate authenticity
    """
    cert = certificate_gen.get_certificate_by_id(certificate_id)
    
    if not cert:
        return jsonify({'error': 'Certificate not found', 'valid': False}), 404
    
    # Verify digital signature
    is_valid = certificate_gen.verify_certificate_signature(
        cert['certificate_id'],
        cert['student_name'],
        cert['event_name'],
        cert['event_date'],
        cert['digital_signature']
    )
    
    return jsonify({
        'valid': is_valid,
        'certificate': cert
    }), 200

# ============================================
# ADMIN ROUTES - RUBRIC 2: ACCESS CONTROL
# ============================================

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """
    RUBRIC 2: ACCESS CONTROL
    ONLY admins can view all users
    """
    user, error_response, status_code = require_auth()
    if error_response:
        return error_response, status_code
    
    if user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, username, email, role, created_at FROM users')
    users = cursor.fetchall()
    conn.close()
    
    return jsonify([dict(u) for u in users]), 200

# ============================================
# RUN SERVER
# ============================================

if __name__ == '__main__':
    app.run(debug=True, port=5000)