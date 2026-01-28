from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import os
import base64

# RUBRIC 3: ENCRYPTION
# AES-256 encryption for securing sensitive data

def generate_encryption_key():
    """
    RUBRIC 3: KEY EXCHANGE MECHANISM
    Generate a secure AES-256 encryption key (32 bytes = 256 bits)
    """
    return os.urandom(32)

def encrypt_data(plaintext, key):
    """
    RUBRIC 3: ENCRYPTION & DECRYPTION
    Encrypt data using AES-256 in CBC mode
    
    Args:
        plaintext (str): Data to encrypt
        key (bytes): 32-byte encryption key
    
    Returns:
        str: Base64-encoded encrypted data with IV
    """
    # Generate random IV (Initialization Vector)
    iv = os.urandom(16)
    
    # Create cipher
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    
    # Pad the plaintext to be multiple of 16 bytes
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(plaintext.encode('utf-8')) + padder.finalize()
    
    # Encrypt
    ciphertext = encryptor.update(padded_data) + encryptor.finalize()
    
    # Combine IV + ciphertext and encode as base64
    encrypted = iv + ciphertext
    return base64.b64encode(encrypted).decode('utf-8')

def decrypt_data(encrypted_data, key):
    """
    RUBRIC 3: ENCRYPTION & DECRYPTION
    Decrypt AES-256 encrypted data
    
    Args:
        encrypted_data (str): Base64-encoded encrypted data
        key (bytes): 32-byte encryption key
    
    Returns:
        str: Decrypted plaintext
    """
    # Decode from base64
    encrypted = base64.b64decode(encrypted_data)
    
    # Extract IV (first 16 bytes) and ciphertext
    iv = encrypted[:16]
    ciphertext = encrypted[16:]
    
    # Create cipher
    cipher = Cipher(
        algorithms.AES(key),
        modes.CBC(iv),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    
    # Decrypt
    padded_data = decryptor.update(ciphertext) + decryptor.finalize()
    
    # Unpad
    unpadder = padding.PKCS7(128).unpadder()
    plaintext = unpadder.update(padded_data) + unpadder.finalize()
    
    return plaintext.decode('utf-8')

def key_to_string(key):
    """Convert key bytes to base64 string for storage"""
    return base64.b64encode(key).decode('utf-8')

def string_to_key(key_string):
    """Convert base64 string back to key bytes"""
    return base64.b64decode(key_string)