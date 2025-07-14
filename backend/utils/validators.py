import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pydantic import BaseModel, ValidationError
from email.utils import parseaddr
import ipaddress


class ValidationResult:
    """Validation result container."""
    
    def __init__(self, is_valid: bool = True, errors: List[str] = None):
        self.is_valid = is_valid
        self.errors = errors or []
    
    def add_error(self, error: str):
        """Add an error to the validation result."""
        self.is_valid = False
        self.errors.append(error)
    
    def __bool__(self):
        return self.is_valid


def validate_email(email: str) -> ValidationResult:
    """Validate email address format and structure."""
    result = ValidationResult()
    
    if not email or not isinstance(email, str):
        result.add_error("Email is required and must be a string")
        return result
    
    email = email.strip()
    
    # Basic format validation
    if '@' not in email:
        result.add_error("Email must contain @ symbol")
        return result
    
    # Use email.utils.parseaddr for better validation
    parsed = parseaddr(email)
    if not parsed[1] or parsed[1] != email:
        result.add_error("Invalid email format")
        return result
    
    # Additional checks
    local, domain = email.split('@', 1)
    
    # Local part validation
    if len(local) == 0:
        result.add_error("Email local part cannot be empty")
    elif len(local) > 64:
        result.add_error("Email local part too long (max 64 characters)")
    
    # Domain part validation
    if len(domain) == 0:
        result.add_error("Email domain cannot be empty")
    elif len(domain) > 253:
        result.add_error("Email domain too long (max 253 characters)")
    elif '.' not in domain:
        result.add_error("Email domain must contain at least one dot")
    
    # Check for valid characters
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        result.add_error("Email contains invalid characters")
    
    return result


def validate_password(password: str, min_length: int = 8) -> ValidationResult:
    """Validate password strength and requirements."""
    result = ValidationResult()
    
    if not password or not isinstance(password, str):
        result.add_error("Password is required and must be a string")
        return result
    
    # Length check
    if len(password) < min_length:
        result.add_error(f"Password must be at least {min_length} characters long")
    
    # Character requirements
    if not re.search(r'[A-Z]', password):
        result.add_error("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        result.add_error("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        result.add_error("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        result.add_error("Password must contain at least one special character")
    
    # Common password patterns to avoid
    common_patterns = [
        r'(.)\1{3,}',  # 4+ repeated characters
        r'123456',      # Sequential numbers
        r'abcdef',      # Sequential letters
        r'password',    # Common word
        r'qwerty',      # Keyboard pattern
    ]
    
    for pattern in common_patterns:
        if re.search(pattern, password.lower()):
            result.add_error("Password contains common patterns and is not secure")
            break
    
    return result


def validate_phone_number(phone: str, country_code: Optional[str] = None) -> ValidationResult:
    """Validate phone number format."""
    result = ValidationResult()
    
    if not phone or not isinstance(phone, str):
        result.add_error("Phone number is required and must be a string")
        return result
    
    # Remove all non-digit characters for validation
    digits_only = re.sub(r'\D', '', phone)
    
    if len(digits_only) < 7:
        result.add_error("Phone number too short")
    elif len(digits_only) > 15:
        result.add_error("Phone number too long")
    
    # Basic international format check
    if phone.startswith('+'):
        if not re.match(r'^\+[1-9]\d{1,14}$', phone.replace(' ', '').replace('-', '')):
            result.add_error("Invalid international phone number format")
    
    return result


def validate_url(url: str, require_https: bool = False) -> ValidationResult:
    """Validate URL format and accessibility."""
    result = ValidationResult()
    
    if not url or not isinstance(url, str):
        result.add_error("URL is required and must be a string")
        return result
    
    url = url.strip()
    
    # Basic URL pattern
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    if not url_pattern.match(url):
        result.add_error("Invalid URL format")
    
    if require_https and not url.startswith('https://'):
        result.add_error("HTTPS is required")
    
    return result


def validate_ip_address(ip: str, version: Optional[int] = None) -> ValidationResult:
    """Validate IP address format."""
    result = ValidationResult()
    
    if not ip or not isinstance(ip, str):
        result.add_error("IP address is required and must be a string")
        return result
    
    try:
        ip_obj = ipaddress.ip_address(ip)
        
        if version and ip_obj.version != version:
            result.add_error(f"Expected IPv{version} address")
    
    except ValueError:
        result.add_error("Invalid IP address format")
    
    return result


def validate_json_data(data: Any, schema: Dict[str, Any]) -> ValidationResult:
    """Validate JSON data against a simple schema."""
    result = ValidationResult()
    
    if not isinstance(data, dict):
        result.add_error("Data must be a JSON object")
        return result
    
    # Check required fields
    required_fields = schema.get('required', [])
    for field in required_fields:
        if field not in data:
            result.add_error(f"Missing required field: {field}")
        elif data[field] is None or data[field] == "":
            result.add_error(f"Field cannot be empty: {field}")
    
    # Check field types
    field_types = schema.get('types', {})
    for field, expected_type in field_types.items():
        if field in data and data[field] is not None:
            if not isinstance(data[field], expected_type):
                result.add_error(f"Field '{field}' must be of type {expected_type.__name__}")
    
    # Check field constraints
    constraints = schema.get('constraints', {})
    for field, constraint in constraints.items():
        if field in data and data[field] is not None:
            value = data[field]
            
            # String length constraints
            if 'min_length' in constraint and len(str(value)) < constraint['min_length']:
                result.add_error(f"Field '{field}' is too short")
            
            if 'max_length' in constraint and len(str(value)) > constraint['max_length']:
                result.add_error(f"Field '{field}' is too long")
            
            # Numeric constraints
            if 'min_value' in constraint and float(value) < constraint['min_value']:
                result.add_error(f"Field '{field}' value is too small")
            
            if 'max_value' in constraint and float(value) > constraint['max_value']:
                result.add_error(f"Field '{field}' value is too large")
            
            # Allowed values
            if 'allowed_values' in constraint and value not in constraint['allowed_values']:
                result.add_error(f"Field '{field}' has invalid value")
    
    return result


def validate_file_upload(
    filename: str, 
    file_size: int, 
    allowed_extensions: List[str],
    max_size: int
) -> ValidationResult:
    """Validate file upload parameters."""
    result = ValidationResult()
    
    if not filename:
        result.add_error("Filename is required")
        return result
    
    # Check file extension
    file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
    if not file_ext:
        result.add_error("File must have an extension")
    elif f".{file_ext}" not in [ext.lower() for ext in allowed_extensions]:
        result.add_error(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check file size
    if file_size > max_size:
        result.add_error(f"File size too large. Maximum size: {max_size} bytes")
    
    # Check for potentially dangerous filenames
    dangerous_patterns = [
        r'\.\./',  # Path traversal
        r'[<>:"|?*]',  # Invalid filename characters
        r'^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)',  # Windows reserved names
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, filename, re.IGNORECASE):
            result.add_error("Filename contains invalid characters")
            break
    
    return result


def validate_coordinate(value: float, min_val: float = 0.0, max_val: float = 1.0) -> ValidationResult:
    """Validate coordinate value (typically for image positioning)."""
    result = ValidationResult()
    
    if not isinstance(value, (int, float)):
        result.add_error("Coordinate must be a number")
        return result
    
    if value < min_val:
        result.add_error(f"Coordinate must be >= {min_val}")
    
    if value > max_val:
        result.add_error(f"Coordinate must be <= {max_val}")
    
    return result


def validate_color_hex(color: str) -> ValidationResult:
    """Validate hex color format."""
    result = ValidationResult()
    
    if not color or not isinstance(color, str):
        result.add_error("Color is required and must be a string")
        return result
    
    # Remove # if present
    color = color.lstrip('#')
    
    # Check length (3 or 6 characters)
    if len(color) not in [3, 6]:
        result.add_error("Hex color must be 3 or 6 characters long")
        return result
    
    # Check if all characters are valid hex
    if not re.match(r'^[0-9A-Fa-f]+$', color):
        result.add_error("Invalid hex color format")
    
    return result


def validate_decimal_amount(amount: Union[str, float, int], max_decimal_places: int = 2) -> ValidationResult:
    """Validate decimal amount for financial calculations."""
    result = ValidationResult()
    
    try:
        decimal_amount = Decimal(str(amount))
        
        # Check for negative values
        if decimal_amount < 0:
            result.add_error("Amount cannot be negative")
        
        # Check decimal places
        if decimal_amount.as_tuple().exponent < -max_decimal_places:
            result.add_error(f"Amount cannot have more than {max_decimal_places} decimal places")
        
        # Check for reasonable maximum (e.g., 1 million)
        if decimal_amount > Decimal('1000000'):
            result.add_error("Amount too large")
    
    except (InvalidOperation, ValueError):
        result.add_error("Invalid amount format")
    
    return result


def validate_date_range(start_date: datetime, end_date: datetime) -> ValidationResult:
    """Validate date range."""
    result = ValidationResult()
    
    if not isinstance(start_date, datetime):
        result.add_error("Start date must be a datetime object")
    
    if not isinstance(end_date, datetime):
        result.add_error("End date must be a datetime object")
    
    if result.is_valid and start_date >= end_date:
        result.add_error("Start date must be before end date")
    
    # Check if dates are not too far in the future (e.g., 10 years)
    max_future = datetime.utcnow().replace(year=datetime.utcnow().year + 10)
    
    if result.is_valid:
        if start_date > max_future:
            result.add_error("Start date too far in the future")
        
        if end_date > max_future:
            result.add_error("End date too far in the future")
    
    return result


def validate_pagination_params(page: int, per_page: int, max_per_page: int = 100) -> ValidationResult:
    """Validate pagination parameters."""
    result = ValidationResult()
    
    if not isinstance(page, int) or page < 1:
        result.add_error("Page must be a positive integer")
    
    if not isinstance(per_page, int) or per_page < 1:
        result.add_error("Per page must be a positive integer")
    elif per_page > max_per_page:
        result.add_error(f"Per page cannot exceed {max_per_page}")
    
    return result


def validate_api_key_format(api_key: str, expected_prefix: str = "ak") -> ValidationResult:
    """Validate API key format."""
    result = ValidationResult()
    
    if not api_key or not isinstance(api_key, str):
        result.add_error("API key is required and must be a string")
        return result
    
    if not api_key.startswith(f"{expected_prefix}_"):
        result.add_error(f"API key must start with '{expected_prefix}_'")
    
    # Check length (prefix + underscore + 32+ character key)
    if len(api_key) < len(expected_prefix) + 33:  # prefix + _ + 32 chars minimum
        result.add_error("API key is too short")
    
    return result


class ValidationErrorCollector:
    """Collect multiple validation errors."""
    
    def __init__(self):
        self.errors: Dict[str, List[str]] = {}
        self.is_valid = True
    
    def add_field_error(self, field: str, error: str):
        """Add error for specific field."""
        if field not in self.errors:
            self.errors[field] = []
        self.errors[field].append(error)
        self.is_valid = False
    
    def add_validation_result(self, field: str, result: ValidationResult):
        """Add validation result for field."""
        if not result.is_valid:
            for error in result.errors:
                self.add_field_error(field, error)
    
    def has_errors(self) -> bool:
        """Check if there are any errors."""
        return not self.is_valid
    
    def get_errors_dict(self) -> Dict[str, List[str]]:
        """Get errors as dictionary."""
        return self.errors
    
    def get_flat_errors(self) -> List[str]:
        """Get all errors as flat list."""
        all_errors = []
        for field_errors in self.errors.values():
            all_errors.extend(field_errors)
        return all_errors