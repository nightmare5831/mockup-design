import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, Dict, Any, List
import logging
from jinja2 import Environment, FileSystemLoader
import os
from app.config.settings import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_username = settings.SMTP_USERNAME
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.FROM_EMAIL
        
        # Initialize Jinja2 for email templates
        template_dir = os.path.join(os.path.dirname(__file__), '..', 'templates', 'emails')
        if os.path.exists(template_dir):
            self.jinja_env = Environment(loader=FileSystemLoader(template_dir))
        else:
            self.jinja_env = None
            logger.warning(f"Email template directory not found: {template_dir}")
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Send email with optional HTML body and attachments"""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add text body
            msg.attach(MIMEText(body, 'plain'))
            
            # Add HTML body if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Add attachments if provided
            if attachments:
                for attachment in attachments:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment['data'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                text = msg.as_string()
                server.sendmail(self.from_email, to_email, text)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    async def send_templated_email(
        self,
        template_name: str,
        to_email: str,
        context: Dict[str, Any],
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Send email using template"""
        try:
            if not self.jinja_env:
                # Fallback to simple templates
                return await self._send_simple_template(template_name, to_email, context)
            
            # Load template
            template = self.jinja_env.get_template(f'{template_name}.html')
            html_body = template.render(context)
            
            # Try to load text version
            try:
                text_template = self.jinja_env.get_template(f'{template_name}.txt')
                text_body = text_template.render(context)
            except:
                # Generate text from HTML if no text template
                from html2text import html2text
                text_body = html2text(html_body)
            
            # Get subject from template or use default
            subject = self._get_email_subject(template_name, context)
            
            return await self.send_email(
                to_email, subject, text_body, html_body, attachments
            )
            
        except Exception as e:
            logger.error(f"Failed to send templated email {template_name} to {to_email}: {e}")
            return False
    
    async def _send_simple_template(
        self,
        template_name: str,
        to_email: str,
        context: Dict[str, Any]
    ) -> bool:
        """Send email using simple text templates (fallback)"""
        templates = {
            "welcome": {
                "subject": "Welcome to AI Mockup Platform!",
                "body": """
Hello {user_name},

Welcome to AI Mockup Platform! We're excited to have you on board.

You've been given {free_credits} free credits to get started. You can use these to generate professional mockups of your promotional products.

To get started:
1. Upload your product and logo images
2. Select your marking technique
3. Generate your mockup!

If you have any questions, feel free to contact our support team.

Best regards,
The AI Mockup Platform Team
                """
            },
            "mockup_completed": {
                "subject": "Your mockup is ready!",
                "body": """
Hello {user_name},

Great news! Your mockup "{mockup_name}" has been generated successfully.

You can view and download your mockup by logging into your account.

Thank you for using AI Mockup Platform!

Best regards,
The AI Mockup Platform Team
                """
            },
            "credit_purchase": {
                "subject": "Credits added to your account",
                "body": """
Hello {user_name},

Your credit purchase was successful! {credit_amount} credits have been added to your account.

You can now use these credits to generate more professional mockups.

Thank you for your purchase!

Best regards,
The AI Mockup Platform Team
                """
            },
            "subscription_activated": {
                "subject": "Subscription activated successfully",
                "body": """
Hello {user_name},

Your {plan_name} subscription has been activated successfully!

Your subscription includes:
- {monthly_credits} credits per month
- Access to all marking techniques
- Priority processing

Thank you for subscribing to AI Mockup Platform!

Best regards,
The AI Mockup Platform Team
                """
            },
            "password_reset": {
                "subject": "Reset your password",
                "body": """
Hello,

You requested to reset your password for AI Mockup Platform.

Click the link below to reset your password:
{reset_link}

This link will expire in 24 hours.

If you didn't request this, please ignore this email.

Best regards,
The AI Mockup Platform Team
                """
            }
        }
        
        template = templates.get(template_name)
        if not template:
            logger.error(f"Template {template_name} not found")
            return False
        
        try:
            subject = template["subject"].format(**context)
            body = template["body"].format(**context)
            
            return await self.send_email(to_email, subject, body)
            
        except KeyError as e:
            logger.error(f"Missing context variable for template {template_name}: {e}")
            return False
    
    def _get_email_subject(self, template_name: str, context: Dict[str, Any]) -> str:
        """Get email subject for template"""
        subjects = {
            "welcome": "Welcome to AI Mockup Platform!",
            "mockup_completed": "Your mockup is ready!",
            "credit_purchase": "Credits added to your account",
            "subscription_activated": f"Subscription activated successfully",
            "password_reset": "Reset your password",
            "subscription_cancelled": "Subscription cancelled",
            "low_credits": "Running low on credits",
        }
        
        return subjects.get(template_name, "AI Mockup Platform Notification")
    
    async def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user"""
        context = {
            "user_name": user_name,
            "free_credits": settings.FREE_CREDITS_ON_SIGNUP
        }
        return await self.send_templated_email("welcome", user_email, context)
    
    async def send_mockup_completed_email(
        self,
        user_email: str,
        user_name: str,
        mockup_name: str,
        mockup_id: str
    ) -> bool:
        """Send notification when mockup is completed"""
        context = {
            "user_name": user_name,
            "mockup_name": mockup_name,
            "mockup_id": mockup_id
        }
        return await self.send_templated_email("mockup_completed", user_email, context)
    
    async def send_password_reset_email(
        self,
        user_email: str,
        reset_token: str
    ) -> bool:
        """Send password reset email"""
        reset_link = f"https://yourdomain.com/reset-password?token={reset_token}"
        context = {
            "reset_link": reset_link
        }
        return await self.send_templated_email("password_reset", user_email, context)
    
    async def send_subscription_notification(
        self,
        user_email: str,
        user_name: str,
        plan_name: str,
        monthly_credits: int
    ) -> bool:
        """Send subscription activation notification"""
        context = {
            "user_name": user_name,
            "plan_name": plan_name,
            "monthly_credits": monthly_credits
        }
        return await self.send_templated_email("subscription_activated", user_email, context)