import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
from typing import Optional
from app.config.settings import settings
import logging
import uuid
import os

logger = logging.getLogger(__name__)


class StorageService:
    """Service for handling file storage with AWS S3 or local storage"""
    
    def __init__(self, upload_folder: str = "uploads"):
        self.use_s3 = self._should_use_s3()
        self.upload_folder = upload_folder
        
        if self.use_s3:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket_name = settings.AWS_S3_BUCKET
            logger.info("Using S3 storage")
        else:
            self.s3_client = None
            os.makedirs(self.upload_folder, exist_ok=True)
            logger.info("Using local storage")
    
    def _should_use_s3(self) -> bool:
        """Force local storage for now"""
        return False  # Always use local storage
    
    async def upload_file(
        self,
        file: UploadFile,
        key: str,
        content_type: Optional[str] = None
    ) -> str:
        """Upload file to S3 or local storage and return URL"""
        try:
            # Reset file pointer
            await file.seek(0)
            
            if self.use_s3:
                # Upload to S3
                self.s3_client.upload_fileobj(
                    file.file,
                    self.bucket_name,
                    key,
                    ExtraArgs={
                        'ContentType': content_type or file.content_type or 'application/octet-stream',
                        'ACL': 'public-read'
                    }
                )
                
                # Return public URL
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
                logger.info(f"File uploaded to S3: {url}")
                return url
            else:
                # Upload to local storage
                file_location = os.path.join(self.upload_folder, key)
                os.makedirs(os.path.dirname(file_location), exist_ok=True)
                
                with open(file_location, "wb") as f:
                    contents = await file.read()
                    f.write(contents)
                
                logger.info(f"File saved locally: {file_location}")
                return f"/uploads/{key}"
            
        except (ClientError, Exception) as e:
            logger.error(f"Error uploading file: {e}")
            raise Exception(f"Failed to upload file: {str(e)}")
    
    async def upload_from_bytes(
        self,
        data: bytes,
        key: str,
        content_type: str = 'application/octet-stream'
    ) -> str:
        """Upload bytes data to S3 or local storage"""
        try:
            if self.use_s3:
                # Upload to S3
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=data,
                    ContentType=content_type,
                    ACL='public-read'
                )
                
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
                logger.info(f"Data uploaded to S3: {url}")
                return url
            else:
                # Upload to local storage
                file_location = os.path.join(self.upload_folder, key)
                os.makedirs(os.path.dirname(file_location), exist_ok=True)
                
                with open(file_location, "wb") as f:
                    f.write(data)
                
                logger.info(f"Data saved locally: {file_location}")
                return f"/uploads/{key}"
            
        except (ClientError, Exception) as e:
            logger.error(f"Error uploading data: {e}")
            raise Exception(f"Failed to upload data: {str(e)}")
    
    async def delete_file(self, key: str) -> bool:
        """Delete file from S3 or local storage"""
        try:
            if self.use_s3:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=key
                )
                logger.info(f"File deleted from S3: {key}")
            else:
                file_location = os.path.join(self.upload_folder, key)
                if os.path.exists(file_location):
                    os.remove(file_location)
                    logger.info(f"File deleted locally: {file_location}")
            return True
            
        except (ClientError, Exception) as e:
            logger.error(f"Error deleting file: {e}")
            return False
    
    async def generate_presigned_url(
        self,
        key: str,
        expiration: int = 3600,
        method: str = 'get_object'
    ) -> str:
        """Generate presigned URL for temporary access"""
        try:
            if self.use_s3:
                url = self.s3_client.generate_presigned_url(
                    method,
                    Params={'Bucket': self.bucket_name, 'Key': key},
                    ExpiresIn=expiration
                )
                return url
            else:
                # For local storage, return regular URL
                return f"/uploads/{key}"
            
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise Exception(f"Failed to generate URL: {str(e)}")
    
    async def file_exists(self, key: str) -> bool:
        """Check if file exists in S3 or local storage"""
        try:
            if self.use_s3:
                self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
                return True
            else:
                file_location = os.path.join(self.upload_folder, key)
                return os.path.exists(file_location)
        except (ClientError, Exception):
            return False
    
    async def get_file_info(self, key: str) -> Optional[dict]:
        """Get file metadata"""
        try:
            if self.use_s3:
                response = self.s3_client.head_object(Bucket=self.bucket_name, Key=key)
                return {
                    'size': response['ContentLength'],
                    'content_type': response['ContentType'],
                    'last_modified': response['LastModified'],
                    'etag': response['ETag']
                }
            else:
                # For local storage, get file stats
                file_location = os.path.join(self.upload_folder, key)
                if os.path.exists(file_location):
                    stat = os.stat(file_location)
                    return {
                        'size': stat.st_size,
                        'last_modified': stat.st_mtime
                    }
                return None
        except (ClientError, Exception) as e:
            logger.error(f"Error getting file info: {e}")
            return None
    
    def generate_unique_key(self, user_id: str, folder: str, filename: str) -> str:
        """Generate unique S3 key for file"""
        file_extension = os.path.splitext(filename)[1]
        unique_name = f"{uuid.uuid4()}{file_extension}"
        return f"{folder}/{user_id}/{unique_name}"
    
    async def copy_file(self, source_key: str, dest_key: str) -> str:
        """Copy file within storage"""
        try:
            if self.use_s3:
                copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
                
                self.s3_client.copy_object(
                    CopySource=copy_source,
                    Bucket=self.bucket_name,
                    Key=dest_key,
                    ACL='public-read'
                )
                
                url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{dest_key}"
                return url
            else:
                # For local storage, copy file
                source_path = os.path.join(self.upload_folder, source_key)
                dest_path = os.path.join(self.upload_folder, dest_key)
                
                # Create destination directory if needed
                os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                
                # Copy file
                import shutil
                shutil.copy2(source_path, dest_path)
                
                logger.info(f"File copied locally: {source_path} -> {dest_path}")
                return f"/uploads/{dest_key}"
            
        except (ClientError, Exception) as e:
            logger.error(f"Error copying file: {e}")
            raise Exception(f"Failed to copy file: {str(e)}")