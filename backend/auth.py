import bcrypt
import pyotp
import secrets
import hashlib
from datetime import datetime, timedelta
from database import get_db_connection

# RUBRIC 1: AUTHENTICATION (NIST SP 800-63-2 Compliant)
# RUBRIC 4: HASHING WITH SALT

def validate_password_strength(password):
    """
    NIST SP 800-63-2 compliant password validation:
    - Minimum 8 characters
    - At least 1 uppercase, 1 lowercase, 1 number, 1 special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
    
    if not (has_upper and has_lower and has_digit and has_special):
        return False, "Password must contain uppercase, lowercase, number, and special character"
    
    return True, "Password is strong"

def hash_password(password):
    """
    RUBRIC 4: HASHING WITH SALT
    Hash password with salt using bcrypt
    """
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8'), salt.decode('utf-8')

def verify_password(password, password_hash):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_totp_secret():
    """
    RUBRIC 1: MULTI-FACTOR AUTHENTICATION
    Generate TOTP secret for Google Authenticator
    """
    return pyotp.random_base32()

def generate_totp_uri(email, secret):
    """Generate TOTP provisioning URI for QR code"""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="Secure Event System")

def verify_totp(secret, token):
    """
    RUBRIC 1: MULTI-FACTOR AUTHENTICATION
    Verify TOTP token from Google Authenticator
    """
    totp = pyotp.TOTP(secret)
    # Increase valid_window to allow for clock drift
    return totp.verify(token, valid_window=5)

def generate_session_token():
    """Generate secure session token"""
    return secrets.token_urlsafe(32)

def create_session(user_id):
    """
    NIST SP 800-63-2: Session Management
    Create session with 30-minute timeout
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    session_token = generate_session_token()
    created_at = datetime.now()
    expires_at = created_at + timedelta(minutes=30)
    
    cursor.execute('''
        INSERT INTO sessions (user_id, session_token, created_at, expires_at)
        VALUES (?, ?, ?, ?)
    ''', (user_id, session_token, created_at.isoformat(), expires_at.isoformat()))
    
    conn.commit()
    conn.close()
    
    return session_token

def validate_session(session_token):
    """Validate session token and check expiry"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT user_id, expires_at FROM sessions WHERE session_token = ?
    ''', (session_token,))
    
    session = cursor.fetchone()
    conn.close()
    
    if not session:
        return None
    
    expires_at = datetime.fromisoformat(session['expires_at'])
    if datetime.now() > expires_at:
        return None
    
    return session['user_id']

def check_account_lockout(username):
    """
    NIST SP 800-63-2: Account Lockout
    Lock account after 3 failed attempts for 15 minutes
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT failed_attempts, locked_until FROM users WHERE username = ?
    ''', (username,))
    
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return False, "User not found"
    
    if user['locked_until']:
        locked_until = datetime.fromisoformat(user['locked_until'])
        if datetime.now() < locked_until:
            return True, f"Account locked until {locked_until.strftime('%H:%M:%S')}"
    
    return False, "Account not locked"

def increment_failed_attempts(username):
    """Increment failed login attempts"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE users SET failed_attempts = failed_attempts + 1 WHERE username = ?
    ''', (username,))
    
    cursor.execute('''
        SELECT failed_attempts FROM users WHERE username = ?
    ''', (username,))
    
    user = cursor.fetchone()
    
    if user['failed_attempts'] >= 3:
        locked_until = datetime.now() + timedelta(minutes=15)
        cursor.execute('''
            UPDATE users SET locked_until = ? WHERE username = ?
        ''', (locked_until.isoformat(), username))
    
    conn.commit()
    conn.close()

def reset_failed_attempts(username):
    """Reset failed attempts after successful login"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = ?
    ''', (username,))
    
    conn.commit()
    conn.close()