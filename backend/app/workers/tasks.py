from celery import current_task
from datetime import datetime, timedelta
import asyncio
import logging
from typing import Optional

from app.workers.celery_app import celery_app
from app.config.database import get_db
from app.services.ai_service import AIService
from app.services.email_service import EmailService
from prisma.enums import MockupStatus

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)


@celery_app.task(bind=True, max_retries=3)
def generate_mockup_task(self, mockup_id: str):
    """Generate mockup using AI service"""
    async def _generate():
        db = await get_db()
    logger.info(f"====================Starting mockup generation for ID: {mockup_id}")
    try:
        # Get mockup details
        mockup = await db.mockup.find_unique(where={"id": mockup_id})
        if not mockup:
            logger.error(f"Mockup {mockup_id} not found")
            return
        
        # Update status to processing
        await db.mockup.update(
            where={"id": mockup_id},
            data={"status": MockupStatus.PROCESSING}
        )
        
        # Update task progress
        if self:
            self.update_state(
                state='PROGRESS',
                meta={'current': 25, 'total': 100, 'status': 'Processing images...'}
            )
        
        start_time = datetime.utcnow()
        
        # Initialize AI service
        ai_service = AIService()
        if not ai_service.pipeline:
            await ai_service.initialize_models()
        
        if self:
            self.update_state(
                state='PROGRESS',
                meta={'current': 50, 'total': 100, 'status': 'Generating mockup...'}
            )
        
        # Generate mockup
        result_url = await ai_service.generate_mockup(
            product_image_url=mockup.product_image_url,
            logo_image_url=mockup.logo_image_url,
            marking_zone=(
                mockup.marking_zone_x,
                mockup.marking_zone_y,
                mockup.marking_zone_w,
                mockup.marking_zone_h
            ),
            marking_technique=mockup.marking_technique,
            logo_scale=mockup.logo_scale,
            logo_rotation=mockup.logo_rotation,
            logo_color=mockup.logo_color,
            user_id=mockup.user_id
        )
        
        # if current_task:
        #     current_task.update_state(
        #         state='PROGRESS',
        #         meta={'current': 90, 'total': 100, 'status': 'Finalizing...'}
        #     )
        
        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time = int((end_time - start_time).total_seconds())
        
        # Update mockup with result
        await db.mockup.update(
            where={"id": mockup_id},
            data={
                "status": MockupStatus.COMPLETED,
                "result_image_url": result_url,
                "processing_time": processing_time,
                "error_message": None
            }
        )
        
        # Send notification email
        user = await db.user.find_unique(where={"id": mockup.user_id})
        # if user and user.email:
        #     send_email_task.delay(
        #         "mockup_completed",
        #         user.email,
        #         {
        #             "user_name": user.first_name or "User",
        #             "mockup_name": mockup.name or "Your mockup",
        #             "mockup_id": mockup_id
        #         }
        #     )
        
        logger.info(f"Mockup {mockup_id} generated successfully in {processing_time}s")
        
    except Exception as e:
        logger.error(f"Error generating mockup {mockup_id}: {e}")
        
        # Update mockup with error
        await db.mockup.update(
            where={"id": mockup_id},
            data={
                "status": MockupStatus.FAILED,
                "error_message": str(e)
            }
        )
        
        # Refund credit if generation failed
        if mockup.credit_id:
            credit = await db.credit.find_unique(where={"id": mockup.credit_id})
            if credit and credit.used > 0:
                await db.credit.update(
                    where={"id": credit.id},
                    data={"used": credit.used - 1}
                )
        
        # Retry task if not at max retries
        # if self.request.retries < self.max_retries:
        #     raise self.retry(countdown=60, exc=e)
        
            raise e
        
        finally:
            await db.disconnect()
    
    return run_async(_generate())


@celery_app.task
def send_email_task(template: str, recipient: str, context: dict):
    """Send email using template"""
    async def _send():
        try:
            email_service = EmailService()
            await email_service.send_templated_email(template, recipient, context)
            logger.info(f"Email sent to {recipient} using template {template}")
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {e}")
            raise
    
    return run_async(_send())


@celery_app.task
def cleanup_expired_credits():
    """Clean up expired credits"""
    async def _cleanup():
        db = await get_db()
        
        try:
            # Find expired credits
            expired_credits = await db.credit.find_many(
                where={
                    "expires_at": {"lt": datetime.utcnow()},
                    "used": {"lt": db.credit.fields.amount}
                }
            )
            
            count = 0
            for credit in expired_credits:
                # Zero out unused expired credits
                await db.credit.update(
                    where={"id": credit.id},
                    data={"used": credit.amount}
                )
                count += 1
            
            logger.info(f"Cleaned up {count} expired credits")
            
        except Exception as e:
            logger.error(f"Error cleaning up expired credits: {e}")
        finally:
            await db.disconnect()
    
    return run_async(_cleanup())


@celery_app.task
def cleanup_old_mockups():
    """Clean up old mockup files"""
    async def _cleanup():
        db = await get_db()
        
        try:
            # Find mockups older than 90 days
            cutoff_date = datetime.utcnow() - timedelta(days=90)
            old_mockups = await db.mockup.find_many(
                where={"created_at": {"lt": cutoff_date}}
            )
            
            from app.services.storage_service import StorageService
            storage = StorageService()
            
            count = 0
            for mockup in old_mockups:
                try:
                    # Delete files from storage
                    if mockup.result_image_url:
                        # Extract key from URL
                        key = mockup.result_image_url.split('/')[-1]
                        await storage.delete_file(f"mockups/{key}")
                    
                    # Delete mockup record
                    await db.mockup.delete(where={"id": mockup.id})
                    count += 1
                    
                except Exception as e:
                    logger.error(f"Error deleting mockup {mockup.id}: {e}")
            
            logger.info(f"Cleaned up {count} old mockups")
            
        except Exception as e:
            logger.error(f"Error cleaning up old mockups: {e}")
        finally:
            await db.disconnect()
    
    return run_async(_cleanup())


@celery_app.task
def health_check_task():
    """Periodic health check"""
    async def _health_check():
        db = await get_db()
        
        try:
            # Check database connectivity
            user_count = await db.user.count()
            
            # Check for stuck processing mockups
            stuck_mockups = await db.mockup.find_many(
                where={
                    "status": MockupStatus.PROCESSING,
                    "updated_at": {"lt": datetime.utcnow() - timedelta(minutes=10)}
                }
            )
            
            # Reset stuck mockups
            for mockup in stuck_mockups:
                await db.mockup.update(
                    where={"id": mockup.id},
                    data={
                        "status": MockupStatus.FAILED,
                        "error_message": "Processing timeout"
                    }
                )
                
                # Refund credit
                if mockup.credit_id:
                    credit = await db.credit.find_unique(where={"id": mockup.credit_id})
                    if credit and credit.used > 0:
                        await db.credit.update(
                            where={"id": credit.id},
                            data={"used": credit.used - 1}
                        )
            
            if stuck_mockups:
                logger.warning(f"Reset {len(stuck_mockups)} stuck mockups")
            
            logger.info(f"Health check passed. Users: {user_count}")
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
        finally:
            await db.disconnect()
    
    return run_async(_health_check())


@celery_app.task
def process_webhook_task(event_type: str, event_data: dict):
    """Process webhook events asynchronously"""
    async def _process():
        db = await get_db()
        
        try:
            if event_type == "payment.completed":
                # Handle successful payment
                await handle_payment_completion(event_data, db)
            elif event_type == "subscription.cancelled":
                # Handle subscription cancellation
                await handle_subscription_cancellation(event_data, db)
            
        except Exception as e:
            logger.error(f"Error processing webhook {event_type}: {e}")
        finally:
            await db.disconnect()
    
    return run_async(_process())


async def handle_payment_completion(event_data: dict, db):
    """Handle completed payment webhook"""
    try:
        payment_id = event_data.get("payment_id")
        if not payment_id:
            return
        
        payment = await db.payment.find_unique(where={"id": payment_id})
        if not payment:
            return
        
        # Add credits for credit purchases
        metadata = event_data.get("metadata", {})
        if metadata.get("type") == "credit_purchase":
            credit_amount = int(metadata.get("credit_amount", 0))
            if credit_amount > 0:
                await db.credit.create(
                    data={
                        "user_id": payment.user_id,
                        "amount": credit_amount,
                        "used": 0,
                        "expires_at": datetime.utcnow() + timedelta(days=365)
                    }
                )
                
                logger.info(f"Added {credit_amount} credits for payment {payment_id}")
        
    except Exception as e:
        logger.error(f"Error handling payment completion: {e}")


async def handle_subscription_cancellation(event_data: dict, db):
    """Handle subscription cancellation webhook"""
    try:
        subscription_id = event_data.get("subscription_id")
        if not subscription_id:
            return
        
        # Update subscription status
        await db.subscription.update_many(
            where={"stripe_id": subscription_id},
            data={"status": "CANCELLED"}
        )
        
        logger.info(f"Cancelled subscription {subscription_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription cancellation: {e}")


@celery_app.task(bind=True)
def bulk_process_mockups(self, mockup_ids: list):
    """Process multiple mockups in batch"""
    async def _bulk_process():
        total = len(mockup_ids)
        
        for i, mockup_id in enumerate(mockup_ids):
            try:
                # Update progress
                if current_task:
                    current_task.update_state(
                        state='PROGRESS',
                        meta={
                            'current': i + 1,
                            'total': total,
                            'status': f'Processing mockup {i + 1} of {total}'
                        }
                    )
                
                # Process individual mockup
                generate_mockup_task.delay(mockup_id)
                
            except Exception as e:
                logger.error(f"Error in bulk processing mockup {mockup_id}: {e}")
        
        logger.info(f"Bulk processing initiated for {total} mockups")
    
    return run_async(_bulk_process())