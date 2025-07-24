#!/usr/bin/env python3
"""
Script to configure S3 bucket for public read access
Run this once to set up your S3 bucket properly
"""

import boto3
import json
from app.config.settings import settings

def configure_s3_bucket():
    """Configure S3 bucket for public read access with ACL support"""
    
    # Create S3 client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION
    )
    
    bucket_name = settings.AWS_S3_BUCKET
    
    try:
        # 0. Check if bucket exists and get current settings
        print(f"Configuring bucket: {bucket_name}")
        
        try:
            response = s3_client.head_bucket(Bucket=bucket_name)
            print("✓ Bucket exists and is accessible")
        except Exception as e:
            print(f"❌ Cannot access bucket: {e}")
            return False
        
        # 1. Enable ACLs on the bucket (Object Ownership)
        print("\n1. Configuring bucket ownership for ACLs...")
        try:
            s3_client.put_bucket_ownership_controls(
                Bucket=bucket_name,
                OwnershipControls={
                    'Rules': [{
                        'ObjectOwnership': 'BucketOwnerPreferred'  # Allows ACLs
                    }]
                }
            )
            print("✓ Enabled ACL support (BucketOwnerPreferred)")
        except Exception as e:
            print(f"⚠️  ACL configuration warning: {e}")
            print("   Trying alternative ACL setting...")
            try:
                s3_client.put_bucket_ownership_controls(
                    Bucket=bucket_name,
                    OwnershipControls={
                        'Rules': [{
                            'ObjectOwnership': 'ObjectWriter'  # Full ACL support
                        }]
                    }
                )
                print("✓ Enabled full ACL support (ObjectWriter)")
            except Exception as e2:
                print(f"⚠️  Could not enable ACLs: {e2}")
                print("   Will use bucket policy instead of ACLs")
        
        # 2. Disable Block Public Access settings
        print("\n2. Configuring public access settings...")
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': False,
                'IgnorePublicAcls': False,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        )
        print("✓ Disabled block public access settings")
        
        # 3. Set bucket policy for public read access
        print("\n3. Applying public read bucket policy...")
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }
        
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        print("✓ Applied public read bucket policy")
        
        # 4. Set bucket CORS configuration for web access
        print("\n4. Configuring CORS settings...")
        cors_configuration = {
            'CORSRules': [
                {
                    'AllowedHeaders': ['*'],
                    'AllowedMethods': ['GET', 'HEAD', 'PUT', 'POST'],
                    'AllowedOrigins': ['*'],
                    'ExposeHeaders': ['ETag'],
                    'MaxAgeSeconds': 3000
                }
            ]
        }
        
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        print("✓ Configured CORS settings")
        
        # 5. Test the configuration
        print("\n5. Testing configuration...")
        test_acl_support(s3_client, bucket_name)
        
        print(f"\n🎉 S3 bucket '{bucket_name}' is now configured for public access!")
        print(f"   Public URL format: https://{bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/your-file-key")
        print(f"   ACL Support: {'✓ Enabled' if test_acl_support else '⚠️ Limited (using bucket policy)'}")
        
    except Exception as e:
        print(f"❌ Error configuring S3 bucket: {e}")
        print("\nMake sure:")
        print("1. Your AWS credentials have full S3 permissions including:")
        print("   - S3:PutBucketOwnershipControls")
        print("   - S3:PutBucketPolicy")
        print("   - S3:PutPublicAccessBlock")
        print("   - S3:PutBucketCors")
        print("2. The bucket exists and you have admin access to it")
        print("3. Your bucket is not in a region with additional restrictions")
        return False
    
    return True

def test_acl_support(s3_client, bucket_name):
    """Test if ACLs are working on the bucket"""
    try:
        # Try to get bucket ACL to test if ACLs are enabled
        s3_client.get_bucket_acl(Bucket=bucket_name)
        print("✓ ACLs are supported and enabled")
        return True
    except Exception as e:
        print(f"⚠️  ACLs may not be fully supported: {e}")
        print("   Files will still be public via bucket policy")
        return False

if __name__ == "__main__":
    configure_s3_bucket()