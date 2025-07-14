import re
import uuid
import hashlib
import secrets
from typing import Optional, Dict, Any, List, Union
from datetime import datetime, timedelta
from email.utils import parseaddr
import mimetypes
import os
import json
from decimal import Decimal


def generate_unique_id() -> str:
    """Generate a unique identifier."""
    return str(uuid.uuid4())


def generate_secure_token(length: int = 32) -> str:
    """Generate a cryptographically secure random token."""
    return secrets.token_urlsafe(length)


def hash_string(text: str, salt: Optional[str] = None) -> str:
    """Hash a string with optional salt."""
    if salt is None:
        salt = secrets.token_hex(16)
    
    combined = f"{text}{salt}"
    return hashlib.sha256(combined.encode()).hexdigest()


def is_valid_email(email: str) -> bool:
    """Validate email address format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_email_format(email: str) -> bool:
    """Validate email using email.utils.parseaddr."""
    parsed = parseaddr(email)
    return '@' in parsed[1] and '.' in parsed[1].split('@')[1]


def normalize_email(email: str) -> str:
    """Normalize email address to lowercase."""
    return email.lower().strip()


def is_strong_password(password: str) -> Dict[str, Any]:
    """
    Check if password meets strength requirements.
    
    Returns:
        Dict with 'is_valid' boolean and 'issues' list
    """
    issues = []
    
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        issues.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        issues.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        issues.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        issues.append("Password should contain at least one special character")
    
    return {
        "is_valid": len(issues) == 0,
        "issues": issues,
        "strength_score": max(0, 5 - len(issues))
    }


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    # Remove path traversal attempts
    filename = os.path.basename(filename)
    
    # Replace unsafe characters
    filename = re.sub(r'[^\w\-_.]', '_', filename)
    
    # Limit length
    name, ext = os.path.splitext(filename)
    if len(name) > 100:
        name = name[:100]
    
    return f"{name}{ext}"


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return os.path.splitext(filename)[1].lower()


def is_allowed_file_type(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file type is allowed."""
    extension = get_file_extension(filename)
    return extension in [ext.lower() for ext in allowed_extensions]


def get_mime_type(filename: str) -> str:
    """Get MIME type from filename."""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def calculate_pagination(page: int, per_page: int, total_items: int) -> Dict[str, Any]:
    """Calculate pagination metadata."""
    total_pages = (total_items + per_page - 1) // per_page
    
    return {
        "page": page,
        "per_page": per_page,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_prev": page > 1,
        "has_next": page < total_pages,
        "prev_page": page - 1 if page > 1 else None,
        "next_page": page + 1 if page < total_pages else None
    }


def format_datetime(dt: datetime, format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
    """Format datetime to string."""
    return dt.strftime(format_string)


def parse_datetime(date_string: str, format_string: str = "%Y-%m-%d %H:%M:%S") -> datetime:
    """Parse datetime from string."""
    return datetime.strptime(date_string, format_string)


def get_time_ago(dt: datetime) -> str:
    """Get human-readable time difference from now."""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days != 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    else:
        return "Just now"


def clean_dict(data: Dict[str, Any], remove_none: bool = True, remove_empty: bool = False) -> Dict[str, Any]:
    """Clean dictionary by removing None or empty values."""
    cleaned = {}
    
    for key, value in data.items():
        if remove_none and value is None:
            continue
        if remove_empty and not value:
            continue
        cleaned[key] = value
    
    return cleaned


def merge_dicts(*dicts: Dict[str, Any]) -> Dict[str, Any]:
    """Merge multiple dictionaries."""
    result = {}
    for d in dicts:
        if d:
            result.update(d)
    return result


def flatten_dict(data: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
    """Flatten nested dictionary."""
    items = []
    for k, v in data.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)


def convert_to_serializable(obj: Any) -> Any:
    """Convert object to JSON serializable format."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, Decimal):
        return float(obj)
    elif hasattr(obj, '__dict__'):
        return obj.__dict__
    elif isinstance(obj, (list, tuple)):
        return [convert_to_serializable(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_to_serializable(value) for key, value in obj.items()}
    else:
        return obj


def safe_json_loads(json_string: str, default: Any = None) -> Any:
    """Safely parse JSON string."""
    try:
        return json.loads(json_string)
    except (json.JSONDecodeError, TypeError):
        return default


def extract_numbers(text: str) -> List[float]:
    """Extract all numbers from text."""
    pattern = r'-?\d+\.?\d*'
    matches = re.findall(pattern, text)
    return [float(match) for match in matches if match]


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    # Convert to lowercase and replace spaces with hyphens
    slug = text.lower().strip()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    return slug


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to specified length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def mask_email(email: str) -> str:
    """Mask email address for privacy."""
    if '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    
    if len(local) <= 2:
        masked_local = local[0] + '*'
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"


def validate_url(url: str) -> bool:
    """Validate URL format."""
    pattern = r'^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$'
    return re.match(pattern, url) is not None


def extract_domain(url: str) -> Optional[str]:
    """Extract domain from URL."""
    pattern = r'https?:\/\/((?:[-\w.])+)'
    match = re.search(pattern, url)
    return match.group(1) if match else None


def generate_filename(original_filename: str, prefix: str = "", suffix: str = "") -> str:
    """Generate unique filename with optional prefix and suffix."""
    name, ext = os.path.splitext(original_filename)
    unique_id = generate_unique_id()[:8]
    
    parts = [prefix, name, unique_id, suffix]
    filename = "_".join(filter(None, parts))
    
    return sanitize_filename(f"{filename}{ext}")


def chunk_list(lst: List[Any], chunk_size: int) -> List[List[Any]]:
    """Split list into chunks of specified size."""
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def remove_duplicates(lst: List[Any], key: Optional[str] = None) -> List[Any]:
    """Remove duplicates from list."""
    if key:
        seen = set()
        result = []
        for item in lst:
            item_key = getattr(item, key) if hasattr(item, key) else item.get(key)
            if item_key not in seen:
                seen.add(item_key)
                result.append(item)
        return result
    else:
        return list(dict.fromkeys(lst))


def format_currency(amount: Union[int, float, Decimal], currency: str = "EUR") -> str:
    """Format amount as currency."""
    if currency.upper() == "EUR":
        return f"€{amount:.2f}"
    elif currency.upper() == "USD":
        return f"${amount:.2f}"
    else:
        return f"{amount:.2f} {currency.upper()}"


def parse_boolean(value: Any) -> bool:
    """Parse various types to boolean."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on', 'y')
    if isinstance(value, (int, float)):
        return bool(value)
    return False


def calculate_percentage(part: Union[int, float], total: Union[int, float]) -> float:
    """Calculate percentage."""
    if total == 0:
        return 0.0
    return (part / total) * 100


def clamp(value: Union[int, float], min_val: Union[int, float], max_val: Union[int, float]) -> Union[int, float]:
    """Clamp value between min and max."""
    return max(min_val, min(value, max_val))


def generate_color_from_string(text: str) -> str:
    """Generate consistent color hex code from string."""
    hash_obj = hashlib.md5(text.encode())
    hex_hash = hash_obj.hexdigest()
    return f"#{hex_hash[:6]}"


def validate_hex_color(color: str) -> bool:
    """Validate hex color format."""
    pattern = r'^#[0-9A-Fa-f]{6}$'
    return re.match(pattern, color) is not None


def get_client_ip(request_headers: Dict[str, str]) -> str:
    """Extract client IP from request headers."""
    # Check for common forwarded headers
    forwarded_headers = [
        'X-Forwarded-For',
        'X-Real-IP',
        'CF-Connecting-IP',
        'X-Client-IP'
    ]
    
    for header in forwarded_headers:
        if header in request_headers:
            ip = request_headers[header].split(',')[0].strip()
            if ip:
                return ip
    
    return request_headers.get('Remote-Addr', 'unknown')


def rate_limit_key(user_id: Optional[str], ip: str, endpoint: str) -> str:
    """Generate rate limit key."""
    identifier = user_id if user_id else ip
    return f"rate_limit:{identifier}:{endpoint}"


def convert_coordinates(x: float, y: float, w: float, h: float, 
                       from_format: str = "percentage", 
                       to_format: str = "pixels", 
                       image_width: int = 1000, 
                       image_height: int = 1000) -> tuple:
    """Convert coordinates between percentage and pixel formats."""
    if from_format == "percentage" and to_format == "pixels":
        return (
            int(x * image_width),
            int(y * image_height),
            int(w * image_width),
            int(h * image_height)
        )
    elif from_format == "pixels" and to_format == "percentage":
        return (
            x / image_width,
            y / image_height,
            w / image_width,
            h / image_height
        )
    else:
        return (x, y, w, h)