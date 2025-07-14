from fastapi import HTTPException, status


class CustomException(HTTPException):
    """Base custom exception"""
    pass


class AuthenticationError(CustomException):
    """Authentication related errors"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class AuthorizationError(CustomException):
    """Authorization related errors"""
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class NotFoundError(CustomException):
    """Resource not found errors"""
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ValidationError(CustomException):
    """Validation errors"""
    def __init__(self, detail: str = "Validation failed"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class ConflictError(CustomException):
    """Conflict errors (e.g., duplicate resources)"""
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class InsufficientCreditsError(CustomException):
    """Insufficient credits error"""
    def __init__(self, detail: str = "Insufficient credits"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


class ProcessingError(CustomException):
    """AI processing errors"""
    def __init__(self, detail: str = "Processing failed"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


class FileUploadError(CustomException):
    """File upload errors"""
    def __init__(self, detail: str = "File upload failed"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


class PaymentError(CustomException):
    """Payment processing errors"""
    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail=detail)


class RateLimitError(CustomException):
    """Rate limiting errors"""
    def __init__(self, detail: str = "Rate limit exceeded"):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)