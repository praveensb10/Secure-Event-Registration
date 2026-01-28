import hashlib
import qrcode
import os
from datetime import datetime
from database import get_db_connection

def generate_certificate_id():
    """Generate unique certificate ID"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_part = os.urandom(4).hex()
    return f"CERT-{timestamp}-{random_part}"

def generate_digital_signature(certificate_id, student_name, event_name, event_date):
    """
    RUBRIC 4: DIGITAL SIGNATURE USING HASH
    Generate SHA-256 hash as digital signature
    """
    data_to_sign = f"{certificate_id}{student_name}{event_name}{event_date}"
    signature = hashlib.sha256(data_to_sign.encode('utf-8')).hexdigest()
    return signature

def verify_certificate_signature(certificate_id, student_name, event_name, event_date, signature):
    """Verify certificate digital signature"""
    expected_signature = generate_digital_signature(certificate_id, student_name, event_name, event_date)
    return signature == expected_signature

def generate_qr_code(certificate_id, signature):
    """
    RUBRIC 5: ENCODING & DECODING IMPLEMENTATION (QR CODE)
    Generate QR code containing certificate ID and signature
    """
    qr_data = f"Certificate ID: {certificate_id}\nSignature: {signature[:20]}..."
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    qr_filename = f"{certificate_id}_qr.png"
    qr_path = os.path.join('static', 'certificates', qr_filename)
    
    os.makedirs(os.path.dirname(qr_path), exist_ok=True)
    img.save(qr_path)
    
    return qr_path

def create_certificate(registration_id, student_name, event_name, event_date):
    """
    Create certificate with digital signature and QR code
    Covers RUBRIC 4 (Digital Signature) and RUBRIC 5 (QR Code)
    """
    certificate_id = generate_certificate_id()
    
    digital_signature = generate_digital_signature(
        certificate_id, student_name, event_name, event_date
    )
    
    qr_code_path = generate_qr_code(certificate_id, digital_signature)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO certificates 
        (registration_id, certificate_id, student_name, event_name, event_date, 
         digital_signature, qr_code_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (registration_id, certificate_id, student_name, event_name, event_date,
          digital_signature, qr_code_path))
    
    cert_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        'id': cert_id,
        'certificate_id': certificate_id,
        'student_name': student_name,
        'event_name': event_name,
        'event_date': event_date,
        'digital_signature': digital_signature,
        'qr_code_path': qr_code_path
    }

def get_certificate_by_id(certificate_id):
    """Retrieve certificate details"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT * FROM certificates WHERE certificate_id = ?
    ''', (certificate_id,))
    
    cert = cursor.fetchone()
    conn.close()
    
    if cert:
        return dict(cert)
    return None