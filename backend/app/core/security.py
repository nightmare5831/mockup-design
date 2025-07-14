import secrets
import hashlib
import hmac
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from fastapi import Request, HTTPException, status
import re
import ipaddress
from app.config.settings import settings


class SecurityManager:
    """Central security management class."""
    
    def __init__(self):
        self.secret_key = settings.SECRET_KEY.encode()
        self._cipher_suite = None
    
    @property
    def cipher_suite(self) -> Fernet:
        """Get or create cipher suite for encryption/decryption."""
        if self._cipher_suite is None:
            # Derive key from secret
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'ai_mockup_salt',
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.secret_key))
            self._cipher_suite = Fernet(key)
        return self._cipher_suite
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data."""
        encrypted = self.cipher_suite.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data."""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher_suite.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception:
            raise ValueError("Invalid encrypted data")


# Global security manager instance
security_manager = SecurityManager()


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def generate_api_key() -> str:
    """Generate API key with specific format."""
    prefix = "amp"  # AI Mockup Platform
    token = secrets.token_urlsafe(32)
    return f"{prefix}_{token}"


def hash_api_key(api_key: str) -> str:
    """Hash API key for secure storage."""
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(api_key: str, hashed_key: str) -> bool:
    """Verify API key against hash."""
    return secrets.compare_digest(hash_api_key(api_key), hashed_key)


def create_signature(data: str, secret: str) -> str:
    """Create HMAC signature for data integrity."""
    signature = hmac.new(
        secret.encode(),
        data.encode(),
        hashlib.sha256
    ).hexdigest()
    return signature


def verify_signature(data: str, signature: str, secret: str) -> bool:
    """Verify HMAC signature."""
    expected_signature = create_signature(data, secret)
    return secrets.compare_digest(signature, expected_signature)


def create_webhook_signature(payload: str, secret: str) -> str:
    """Create webhook signature for Stripe-style webhooks."""
    timestamp = str(int(datetime.utcnow().timestamp()))
    signed_payload = f"{timestamp}.{payload}"
    signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"t={timestamp},v1={signature}"


def verify_webhook_signature(payload: str, signature_header: str, secret: str, tolerance: int = 300) -> bool:
    """Verify webhook signature with timestamp tolerance."""
    try:
        # Parse signature header
        elements = signature_header.split(',')
        timestamp = None
        signatures = []
        
        for element in elements:
            if element.startswith('t='):
                timestamp = int(element[2:])
            elif element.startswith('v1='):
                signatures.append(element[3:])
        
        if timestamp is None or not signatures:
            return False
        
        # Check timestamp tolerance
        current_time = int(datetime.utcnow().timestamp())
        if abs(current_time - timestamp) > tolerance:
            return False
        
        # Verify signature
        signed_payload = f"{timestamp}.{payload}"
        expected_signature = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return any(secrets.compare_digest(sig, expected_signature) for sig in signatures)
        
    except Exception:
        return False


def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS and injection attacks."""
    if not text:
        return ""
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', '\x00']
    for char in dangerous_chars:
        text = text.replace(char, '')
    
    # Remove SQL injection patterns
    sql_patterns = [
        r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
        r'(\b(OR|AND)\s+\d+\s*=\s*\d+)',
        r'(--|\/\*|\*\/)',
        r'(\bxp_cmdshell\b)',
        r'(\bsp_executesql\b)'
    ]
    
    for pattern in sql_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    return text.strip()


def validate_file_signature(file_content: bytes, allowed_signatures: Dict[str, List[bytes]]) -> Optional[str]:
    """Validate file by checking its binary signature (magic bytes)."""
    if not file_content:
        return None
    
    for file_type, signatures in allowed_signatures.items():
        for signature in signatures:
            if file_content.startswith(signature):
                return file_type
    
    return None


def get_image_signatures() -> Dict[str, List[bytes]]:
    """Get allowed image file signatures."""
    return {
        'jpeg': [b'\xff\xd8\xff'],
        'png': [b'\x89\x50\x4e\x47\x0d\x0a\x1a\x0a'],
        'gif': [b'\x47\x49\x46\x38\x37\x61', b'\x47\x49\x46\x38\x39\x61'],
        'webp': [b'\x52\x49\x46\x46', b'\x57\x45\x42\x50'],
        'bmp': [b'\x42\x4d'],
        'tiff': [b'\x49\x49\x2a\x00', b'\x4d\x4d\x00\x2a']
    }


def is_safe_redirect_url(url: str, allowed_domains: List[str]) -> bool:
    """Check if redirect URL is safe (prevents open redirect attacks)."""
    if not url:
        return False
    
    # Allow relative URLs
    if url.startswith('/') and not url.startswith('//'):
        return True
    
    # Check against allowed domains
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        
        if not parsed.netloc:
            return False
        
        domain = parsed.netloc.lower()
        return any(domain == allowed or domain.endswith(f'.{allowed}') 
                  for allowed in allowed_domains)
                  
    except Exception:
        return False


def get_client_ip(request: Request) -> str:
    """Extract real client IP address from request."""
    # Check forwarded headers in order of preference
    forwarded_headers = [
        'CF-Connecting-IP',  # Cloudflare
        'X-Real-IP',         # Nginx
        'X-Forwarded-For',   # Standard
        'X-Client-IP',       # Alternative
        'X-Cluster-Client-IP'  # Cluster
    ]
    
    for header in forwarded_headers:
        if header in request.headers:
            ip = request.headers[header].split(',')[0].strip()
            if is_valid_ip(ip):
                return ip
    
    # Fallback to client host
    return request.client.host if request.client else 'unknown'


def is_valid_ip(ip: str) -> bool:
    """Validate IP address format."""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False


def is_private_ip(ip: str) -> bool:
    """Check if IP address is private."""
    try:
        return ipaddress.ip_address(ip).is_private
    except ValueError:
        return False


def check_rate_limit(key: str, limit: int, window: int, current_count: int) -> Dict[str, Any]:
    """Check if rate limit is exceeded."""
    exceeded = current_count >= limit
    remaining = max(0, limit - current_count)
    reset_time = datetime.utcnow() + timedelta(seconds=window)
    
    return {
        'exceeded': exceeded,
        'remaining': remaining,
        'reset_time': reset_time,
        'retry_after': window if exceeded else None
    }


def mask_sensitive_data(data: str, mask_char: str = '*', visible_chars: int = 4) -> str:
    """Mask sensitive data for logging (e.g., API keys, emails)."""
    if not data or len(data) <= visible_chars:
        return mask_char * len(data) if data else ""
    
    return data[:visible_chars] + mask_char * (len(data) - visible_chars)


def generate_csrf_token() -> str:
    """Generate CSRF token."""
    return secrets.token_urlsafe(32)


def verify_csrf_token(token: str, session_token: str) -> bool:
    """Verify CSRF token."""
    return secrets.compare_digest(token, session_token)


def create_secure_headers() -> Dict[str, str]:
    """Create security headers for HTTP responses."""
    return {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Content-Security-Policy': (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        ),
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': (
            'camera=(), microphone=(), geolocation=(), '
            'payment=(), usb=(), magnetometer=(), gyroscope=()'
        )
    }


def validate_content_type(content_type: str, allowed_types: List[str]) -> bool:
    """Validate HTTP content type."""
    if not content_type:
        return False
    
    # Extract main content type (ignore charset, boundary, etc.)
    main_type = content_type.split(';')[0].strip().lower()
    return main_type in [t.lower() for t in allowed_types]


def check_password_breach(password_hash: str) -> bool:
    """Check if password hash appears in known breaches (placeholder)."""
    # This would integrate with services like HaveIBeenPwned
    # For now, return False (not breached)
    return False


def generate_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes for 2FA."""
    codes = []
    for _ in range(count):
        # Generate 8-digit codes
        code = ''.join([str(secrets.randbelow(10)) for _ in range(8)])
        # Format as XXXX-XXXX
        formatted_code = f"{code[:4]}-{code[4:]}"
        codes.append(formatted_code)
    return codes


def hash_backup_code(code: str) -> str:
    """Hash backup code for secure storage."""
    # Remove formatting
    clean_code = code.replace('-', '').replace(' ', '')
    return hashlib.sha256(clean_code.encode()).hexdigest()


def verify_backup_code(code: str, hashed_code: str) -> bool:
    """Verify backup code against hash."""
    return secrets.compare_digest(hash_backup_code(code), hashed_code)


class SecurityMiddleware:
    """Security middleware for additional protection."""
    
    def __init__(self):
        self.blocked_ips: set = set()
        self.suspicious_patterns = [
            r'\.\./',  # Path traversal
            r'<script',  # XSS
            r'javascript:',  # XSS
            r'vbscript:',  # XSS
            r'onload=',  # XSS
            r'onerror=',  # XSS
            r'union.*select',  # SQL injection
            r'exec\s*\(',  # Command injection
            r'system\s*\(',  # Command injection
        ]
    
    def is_request_suspicious(self, request: Request) -> bool:
        """Check if request contains suspicious patterns."""
        # Check URL
        url = str(request.url)
        for pattern in self.suspicious_patterns:
            if re.search(pattern, url, re.IGNORECASE):
                return True
        
        # Check headers
        for header_value in request.headers.values():
            for pattern in self.suspicious_patterns:
                if re.search(pattern, header_value, re.IGNORECASE):
                    return True
        
        return False
    
    def block_ip(self, ip: str):
        """Add IP to blocked list."""
        self.blocked_ips.add(ip)
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked."""
        return ip in self.blocked_ips


# Global security middleware instance
security_middleware = SecurityMiddleware()


def encrypt_sensitive_field(value: str) -> str:
    """Encrypt sensitive field for database storage."""
    return security_manager.encrypt_data(value)


def decrypt_sensitive_field(encrypted_value: str) -> str:
    """Decrypt sensitive field from database."""
    return security_manager.decrypt_data(encrypted_value)


def create_audit_log_entry(
    user_id: Optional[str],
    action: str,
    resource: str,
    ip_address: str,
    user_agent: str,
    success: bool = True,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Create audit log entry for security events."""
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'user_id': user_id,
        'action': action,
        'resource': resource,
        'ip_address': ip_address,
        'user_agent': user_agent,
        'success': success,
        'details': details or {}
    }


def validate_session_security(request: Request, user_ip: str, user_agent: str) -> bool:
    """Validate session security parameters."""
    current_ip = get_client_ip(request)
    current_ua = request.headers.get('user-agent', '')
    
    # Allow for some flexibility in IP (for mobile users, proxies)
    ip_changed = current_ip != user_ip
    ua_changed = current_ua != user_agent
    
    # If both changed, likely session hijacking
    if ip_changed and ua_changed:
        return False
    
    # If IP changed to private/localhost, suspicious
    if ip_changed and is_private_ip(current_ip):
        return False
    
    return True