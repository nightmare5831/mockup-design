from typing import Optional
import logging
from app.config.settings import settings

# Try to import smtplib (Python's nodemailer equivalent)
try:
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    SMTP_AVAILABLE = True
except ImportError:
    SMTP_AVAILABLE = False

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails using nodemailer-like Gmail interface"""
    
    def __init__(self):
        self.email_address = settings.EMAIL_ADDRESS
        self.email_password = settings.EMAIL_PASSWORD
    
    def _create_transporter(self):
        """Create nodemailer-like transporter for Gmail"""
        if not SMTP_AVAILABLE:
            logger.warning("SMTP libraries not available")
            return None
            
        if not self.email_address or not self.email_password:
            logger.warning("Email credentials not configured (EMAIL_ADDRESS, EMAIL_PASSWORD)")
            return None
            
        try:
            # nodemailer.createTransport({ service: 'Gmail', auth: { user, pass } })
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(self.email_address, self.email_password)
            return server
            
        except Exception as e:
            logger.error(f"Failed to create email transporter: {e}")
            return None
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        text: str,
        html: Optional[str] = None
    ) -> bool:
        """Send email using Gmail service (nodemailer-like interface)"""
        
        # Log email for development when no credentials
        if not self.email_address or not self.email_password:
            logger.info(f"EMAIL TO: {to_email}")
            logger.info(f"SUBJECT: {subject}")
            logger.info(f"TEXT: {text}")
            return False
            
        transporter = self._create_transporter()
        if not transporter:
            logger.warning(f"Email not sent to {to_email} - transporter not available")
            logger.info(f"EMAIL TO: {to_email}")
            logger.info(f"SUBJECT: {subject}")
            logger.info(f"TEXT: {text}")
            return False
            
        try:
            # Create message similar to nodemailer mailOptions
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_address
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text body
            msg.attach(MIMEText(text, 'plain'))
            
            # Add HTML body if provided
            if html:
                msg.attach(MIMEText(html, 'html'))
            
            # Send email (equivalent to transporter.sendMail)
            transporter.send_message(msg)
            transporter.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            logger.info(f"EMAIL TO: {to_email}")
            logger.info(f"SUBJECT: {subject}")
            logger.info(f"TEXT: {text}")
            if transporter:
                try:
                    transporter.quit()
                except:
                    pass
            return False
    
    async def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        subject = "Welcome to AI Mockup Platform!"
        text = f"""Hello {user_name},

Welcome to AI Mockup Platform! We're excited to have you on board.

You've been given {settings.FREE_CREDITS_ON_SIGNUP} free credits to get started. You can use these to generate professional mockups of your promotional products.

To get started:
1. Upload your product and logo images
2. Select your marking technique
3. Generate your mockup!

If you have any questions, feel free to contact our support team.

Best regards,
The AI Mockup Platform Team"""
        
        return await self.send_email(user_email, subject, text)
    
    async def send_password_reset_email(
        self,
        user_email: str,
        reset_token: str
    ) -> bool:
        """Send password reset email"""
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{reset_token}"
        subject = "Password Reset"
        text = f"""You are receiving this because you (or someone else) requested a password reset.

Please click on the following link, or paste it into your browser to complete the process:

{reset_link}

If you did not request this, please ignore this email and your password will remain unchanged.

Best regards,
The AI Mockup Platform Team"""
        
        return await self.send_email(user_email, subject, text)
    
    async def send_password_reset_confirmation(self, user_email: str) -> bool:
        """Send password reset confirmation email"""
        subject = "Your password has been changed!"
        text = f"""Hello,

This is a confirmation that the password for your account {user_email} has just been changed.

Best regards,
The AI Mockup Platform Team"""
        
        return await self.send_email(user_email, subject, text)
    
    async def send_mockup_completed_email(
        self,
        user_email: str,
        user_name: str,
        mockup_name: str
    ) -> bool:
        """Send notification when mockup is completed"""
        subject = "Your mockup is ready!"
        text = f"""Hello {user_name},

Great news! Your mockup "{mockup_name}" has been generated successfully.

You can view and download your mockup by logging into your account.

Thank you for using AI Mockup Platform!

Best regards,
The AI Mockup Platform Team"""
        
        return await self.send_email(user_email, subject, text)
    
    async def send_subscription_notification(
        self,
        user_email: str,
        user_name: str,
        plan_name: str,
        monthly_credits: int
    ) -> bool:
        """Send subscription activation notification"""
        subject = "Subscription activated successfully"
        text = f"""Hello {user_name},

Your {plan_name} subscription has been activated successfully!

Your subscription includes:
- {monthly_credits} credits per month
- Access to all marking techniques
- Priority processing

Thank you for subscribing to AI Mockup Platform!

Best regards,
The AI Mockup Platform Team"""
        
        return await self.send_email(user_email, subject, text)