from celery import Celery
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    'ai_mockup_platform',
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=['app.workers.tasks']
)

# Celery configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes max per task
    task_soft_time_limit=240,  # 4 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

# Task routing
celery_app.conf.task_routes = {
    'app.workers.tasks.generate_mockup_task': {'queue': 'mockup_generation'},
    'app.workers.tasks.send_email_task': {'queue': 'emails'},
    'app.workers.tasks.cleanup_task': {'queue': 'maintenance'},
}

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    'cleanup-expired-credits': {
        'task': 'app.workers.tasks.cleanup_expired_credits',
        'schedule': 60.0 * 60.0,  # Every hour
    },
    'cleanup-old-mockups': {
        'task': 'app.workers.tasks.cleanup_old_mockups',
        'schedule': 60.0 * 60.0 * 24.0,  # Every day
    },
    'health-check': {
        'task': 'app.workers.tasks.health_check_task',
        'schedule': 60.0 * 5.0,  # Every 5 minutes
    },
}

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    logger.info("Celery periodic tasks configured")