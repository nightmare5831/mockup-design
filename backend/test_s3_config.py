#!/usr/bin/env python3
"""
Test script to validate AWS S3 configuration for mockup generation.
This script helps verify that S3 integration is working properly.
"""

import os
import sys
from dotenv import load_dotenv
import boto3
from botocore.exceptions import ClientError

# Load environment variables
load_dotenv()

def test_s3_config():
    """Test AWS S3 configuration and connectivity"""
    print("🔍 Testing AWS S3 Configuration...")
    
    # Check required environment variables
    required_vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET', 'AWS_REGION']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n💡 To fix this, add these variables to your .env file:")
        print("   AWS_ACCESS_KEY_ID=your_access_key")
        print("   AWS_SECRET_ACCESS_KEY=your_secret_key")
        print("   AWS_S3_BUCKET=your-bucket-name")
        print("   AWS_REGION=us-east-1  # or your preferred region")
        return False
    
    print("✅ All required environment variables are set")
    
    try:
        # Test S3 connection
        s3_client = boto3.client(
            's3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        
        bucket_name = os.getenv('AWS_S3_BUCKET')
        
        # Test bucket access
        print(f"🔗 Testing connection to bucket: {bucket_name}")
        s3_client.head_bucket(Bucket=bucket_name)
        print("✅ Successfully connected to S3 bucket")
        
        # Test write permissions by uploading a small test file
        test_key = "test/connection-test.txt"
        test_content = b"S3 connection test"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ContentType='text/plain',
            ACL='public-read'
        )
        
        # Generate the public URL
        public_url = f"https://{bucket_name}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{test_key}"
        print(f"✅ Successfully uploaded test file: {public_url}")
        
        # Clean up test file
        s3_client.delete_object(Bucket=bucket_name, Key=test_key)
        print("✅ Test file cleaned up")
        
        print("\n🎉 S3 configuration is working correctly!")
        print("   Your mockup images will now be uploaded to S3 and accessible via public URLs.")
        
        return True
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'NoSuchBucket':
            print(f"❌ Bucket '{bucket_name}' does not exist")
            print("💡 Create the bucket in AWS S3 console or use AWS CLI:")
            print(f"   aws s3 mb s3://{bucket_name}")
        elif error_code == 'AccessDenied':
            print("❌ Access denied - check your AWS credentials and permissions")
            print("💡 Make sure your AWS user has S3 read/write permissions")
        else:
            print(f"❌ S3 error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_base_url():
    """Test BASE_URL configuration for local storage fallback"""
    print("\n🔍 Testing BASE_URL configuration...")
    
    base_url = os.getenv('BASE_URL')
    if not base_url:
        print("⚠️  BASE_URL not set - using default: http://localhost:5371")
        print("💡 For production, set BASE_URL in your .env file:")
        print("   BASE_URL=https://your-domain.com")
    else:
        print(f"✅ BASE_URL is set: {base_url}")
    
    return True

def main():
    """Run all configuration tests"""
    print("🚀 Mockup Platform - AWS S3 Configuration Test\n")
    
    s3_success = test_s3_config()
    base_url_success = test_base_url()
    
    print("\n" + "="*50)
    if s3_success:
        print("✅ AWS S3 is configured and working!")
        print("   -> Images will be uploaded to S3 with public URLs")
        print("   -> piapi.ai will be able to access your images")
    else:
        print("❌ AWS S3 configuration failed")
        print("   -> Images will be stored locally")
        print("   -> Make sure BASE_URL is accessible from the internet for piapi.ai")
    
    print("\n💡 Next steps:")
    print("   1. Make sure PIAPI_API_KEY is set in your .env file")
    print("   2. Test the mockup generation flow from the frontend")
    print("   3. Check logs for any errors during generation")

if __name__ == "__main__":
    main()