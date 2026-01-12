# AWS Hosting Guide - Church Management System

## Overview

This document outlines the complete AWS infrastructure setup for hosting the Church Management System. The architecture uses a serverless approach for cost efficiency and scalability.

---

## Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   Route 53      │
                                    │   (DNS)         │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┴────────────────────────┐
                    │                                                 │
                    ▼                                                 ▼
         ┌──────────────────┐                              ┌──────────────────┐
         │   CloudFront     │                              │   API Gateway    │
         │   Distribution   │                              │   (REST API)     │
         │   (Frontend CDN) │                              │                  │
         └────────┬─────────┘                              └────────┬─────────┘
                  │                                                 │
                  ▼                                                 ▼
         ┌──────────────────┐                              ┌──────────────────┐
         │   S3 Bucket      │                              │   Lambda         │
         │   (Static Files) │                              │   (FastAPI)      │
         │   - HTML/CSS/JS  │                              │   - API handlers │
         └──────────────────┘                              └────────┬─────────┘
                                                                    │
                           ┌────────────────────────────────────────┤
                           │                                        │
                           ▼                                        ▼
                  ┌──────────────────┐                     ┌──────────────────┐
                  │   RDS PostgreSQL │                     │   S3 Bucket      │
                  │   (Database)     │                     │   (Media Files)  │
                  │   ✓ CONFIGURED   │                     │   - Photos       │
                  └──────────────────┘                     └──────────────────┘

                           ┌──────────────────┐
                           │   SES            │
                           │   (Email)        │
                           │   - Notifications│
                           └──────────────────┘
```

---

## Current State

| Component | Status | Details |
|-----------|--------|---------|
| RDS PostgreSQL | ✅ Configured | `church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com` |
| S3 Media Bucket | ⚠️ Referenced | `church-media-bucket` (needs creation) |
| Lambda Handler | ✅ Ready | `lambda_handler.py` with Mangum adapter |
| Frontend Build | ✅ Ready | Vite build outputs to `dist/` |

---

## Estimated Monthly Costs

| Service | Configuration | Est. Cost |
|---------|--------------|-----------|
| RDS PostgreSQL | db.t3.micro, 20GB | ~$15-20/mo |
| Lambda | 1M requests, 128MB | ~$0-5/mo |
| API Gateway | 1M requests | ~$3.50/mo |
| S3 (Static) | 1GB storage | ~$0.03/mo |
| S3 (Media) | 10GB storage | ~$0.23/mo |
| CloudFront | 50GB transfer | ~$4.25/mo |
| Route 53 | 1 hosted zone | ~$0.50/mo |
| SES | 1000 emails | ~$0.10/mo |
| **Total** | | **~$25-35/mo** |

---

## Phase 1: Prerequisites

### 1.1 Install Required Tools

```bash
# AWS CLI v2
# Download from: https://aws.amazon.com/cli/

# Verify installation
aws --version

# Configure credentials
aws configure
# Region: us-east-1
# Output: json
```

### 1.2 Verify AWS CLI Access

```bash
aws sts get-caller-identity
```

### 1.3 Required IAM Permissions

Ensure your IAM user/role has these policies:
- `AmazonS3FullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `CloudFrontFullAccess`
- `AmazonRDSFullAccess` (already configured)
- `AmazonSESFullAccess`
- `SecretsManagerReadWrite`
- `AmazonRoute53FullAccess` (if using custom domain)

---

## Phase 2: Secrets Management

### 2.1 Store Application Secrets

```bash
# Create secret for application config
aws secretsmanager create-secret \
  --name church-app-secrets \
  --description "Church App production secrets" \
  --secret-string '{
    "DATABASE_URL": "postgresql+psycopg://church_admin:ChurchDb2024Secure!@church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com:5432/church_db",
    "SECRET_KEY": "GENERATE_A_STRONG_64_CHAR_SECRET_HERE",
    "AWS_REGION": "us-east-1",
    "S3_BUCKET_NAME": "church-media-bucket"
  }'
```

### 2.2 Generate Secure SECRET_KEY

```bash
# Generate a cryptographically secure key
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

---

## Phase 3: S3 Buckets Setup

### 3.1 Create Frontend Static Hosting Bucket

```bash
# Create bucket for frontend static files
aws s3 mb s3://church-frontend-static --region us-east-1

# Enable static website hosting
aws s3 website s3://church-frontend-static \
  --index-document index.html \
  --error-document index.html

# Create bucket policy for public read (CloudFront will handle this)
cat > /tmp/bucket-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::church-frontend-static/*"
    }
  ]
}
EOF

# Apply policy
aws s3api put-bucket-policy \
  --bucket church-frontend-static \
  --policy file:///tmp/bucket-policy.json

# Disable block public access (required for static hosting)
aws s3api put-public-access-block \
  --bucket church-frontend-static \
  --public-access-block-configuration \
  "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

### 3.2 Create Media Storage Bucket

```bash
# Create bucket for user uploads (photos, documents)
aws s3 mb s3://church-media-bucket --region us-east-1

# Enable CORS for media bucket
cat > /tmp/cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket church-media-bucket \
  --cors-configuration file:///tmp/cors-config.json
```

---

## Phase 4: Lambda Function Setup

### 4.1 Create Lambda Execution Role

```bash
# Create trust policy
cat > /tmp/lambda-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
  --role-name church-lambda-role \
  --assume-role-policy-document file:///tmp/lambda-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name church-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name church-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name church-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

aws iam attach-role-policy \
  --role-name church-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
```

### 4.2 Create Lambda VPC Access Policy (for RDS)

```bash
# Attach VPC execution role for RDS access
aws iam attach-role-policy \
  --role-name church-lambda-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
```

### 4.3 Package Backend for Lambda

```bash
cd backend

# Create deployment package directory
mkdir -p lambda_package

# Install dependencies to package directory
pip install -r requirements.txt -t lambda_package/

# Copy application code
cp -r app lambda_package/
cp lambda_handler.py lambda_package/

# Create zip file
cd lambda_package
zip -r ../church-backend.zip .
cd ..
```

### 4.4 Create Lambda Function

```bash
# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name church-lambda-role --query 'Role.Arn' --output text)

# Create Lambda function
aws lambda create-function \
  --function-name church-backend-api \
  --runtime python3.12 \
  --handler lambda_handler.handler \
  --role $ROLE_ARN \
  --zip-file fileb://church-backend.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{
    APP_NAME=Church Management System,
    DEBUG=false,
    DATABASE_URL=postgresql+psycopg://church_admin:ChurchDb2024Secure!@church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com:5432/church_db,
    SECRET_KEY=YOUR_PRODUCTION_SECRET_KEY,
    ALGORITHM=HS256,
    ACCESS_TOKEN_EXPIRE_MINUTES=15,
    REFRESH_TOKEN_EXPIRE_DAYS=7,
    AWS_REGION=us-east-1,
    S3_BUCKET_NAME=church-media-bucket,
    BACKEND_CORS_ORIGINS=[\"https://your-domain.com\"],
    FRONTEND_URL=https://your-domain.com
  }"
```

### 4.5 Configure Lambda for VPC (RDS Access)

```bash
# Get VPC and subnet info from RDS
RDS_VPC=$(aws rds describe-db-instances \
  --db-instance-identifier church-db \
  --query 'DBInstances[0].DBSubnetGroup.VpcId' \
  --output text)

SUBNET_IDS=$(aws rds describe-db-instances \
  --db-instance-identifier church-db \
  --query 'DBInstances[0].DBSubnetGroup.Subnets[*].SubnetIdentifier' \
  --output text | tr '\t' ',')

SECURITY_GROUP=$(aws rds describe-db-instances \
  --db-instance-identifier church-db \
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
  --output text)

# Update Lambda VPC config
aws lambda update-function-configuration \
  --function-name church-backend-api \
  --vpc-config SubnetIds=$SUBNET_IDS,SecurityGroupIds=$SECURITY_GROUP
```

---

## Phase 5: API Gateway Setup

### 5.1 Create REST API

```bash
# Create API Gateway
aws apigateway create-rest-api \
  --name church-api \
  --description "Church Management System API" \
  --endpoint-configuration types=REGIONAL

# Get API ID (save this)
API_ID=$(aws apigateway get-rest-apis \
  --query "items[?name=='church-api'].id" \
  --output text)

echo "API ID: $API_ID"
```

### 5.2 Create Proxy Resource

```bash
# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?path==`/`].id' \
  --output text)

# Create proxy resource {proxy+}
aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part "{proxy+}"

# Get proxy resource ID
PROXY_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[?pathPart==`{proxy+}`].id' \
  --output text)
```

### 5.3 Create Methods and Integration

```bash
# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name church-backend-api \
  --query 'Configuration.FunctionArn' \
  --output text)

# Create ANY method on proxy resource
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $PROXY_ID \
  --http-method ANY \
  --authorization-type NONE

# Create Lambda proxy integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $PROXY_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Create ANY method on root resource for /health endpoint
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method ANY \
  --authorization-type NONE

aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $ROOT_ID \
  --http-method ANY \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
```

### 5.4 Grant API Gateway Permission to Invoke Lambda

```bash
# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Add permission for API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name church-backend-api \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:$ACCOUNT_ID:$API_ID/*"
```

### 5.5 Deploy API

```bash
# Create deployment
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --description "Production deployment"

# Get invoke URL
echo "API URL: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
```

### 5.6 Enable CORS on API Gateway

```bash
# Add CORS headers to responses
aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type DEFAULT_4XX \
  --response-parameters '{
    "gatewayresponse.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
    "gatewayresponse.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
  }'

aws apigateway put-gateway-response \
  --rest-api-id $API_ID \
  --response-type DEFAULT_5XX \
  --response-parameters '{
    "gatewayresponse.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
    "gatewayresponse.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
  }'

# Redeploy
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod
```

---

## Phase 6: Frontend Deployment

### 6.1 Build Frontend for Production

```bash
cd frontend

# Update .env for production API URL
cat > .env.production << EOF
VITE_API_URL=https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/api/v1
EOF

# Build for production
npm run build
```

### 6.2 Deploy to S3

```bash
# Sync build output to S3
aws s3 sync dist/ s3://church-frontend-static --delete

# Set cache control headers
aws s3 cp s3://church-frontend-static s3://church-frontend-static \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000" \
  --exclude "index.html"

aws s3 cp s3://church-frontend-static/index.html s3://church-frontend-static/index.html \
  --metadata-directive REPLACE \
  --cache-control "no-cache"
```

---

## Phase 7: CloudFront Distribution

### 7.1 Create CloudFront Distribution

```bash
# Create distribution config
cat > /tmp/cloudfront-config.json << 'EOF'
{
  "CallerReference": "church-frontend-dist-001",
  "Comment": "Church Management System Frontend",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-church-frontend-static",
        "DomainName": "church-frontend-static.s3.us-east-1.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-church-frontend-static",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file:///tmp/cloudfront-config.json
```

### 7.2 Get CloudFront URL

```bash
# List distributions
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='Church Management System Frontend'].{Id:Id,Domain:DomainName,Status:Status}" \
  --output table
```

---

## Phase 8: Custom Domain (Optional)

### 8.1 Request SSL Certificate

```bash
# Request certificate in ACM (must be in us-east-1 for CloudFront)
aws acm request-certificate \
  --domain-name church.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 8.2 Create Route 53 Hosted Zone

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name yourdomain.com \
  --caller-reference $(date +%s)
```

### 8.3 Add DNS Records

```bash
# Get CloudFront distribution domain
CF_DOMAIN="d1234567890.cloudfront.net"

# Create alias record for frontend
cat > /tmp/route53-record.json << EOF
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "church.yourdomain.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "DNSName": "$CF_DOMAIN",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file:///tmp/route53-record.json
```

---

## Phase 9: SES Email Setup

### 9.1 Verify Email Domain

```bash
# Verify domain
aws ses verify-domain-identity --domain yourdomain.com

# Get DKIM tokens
aws ses verify-domain-dkim --domain yourdomain.com
```

### 9.2 Request Production Access

```bash
# Check current sending quota
aws ses get-send-quota

# Note: To exit sandbox mode, submit a request via AWS Console
# SES > Account Dashboard > Request Production Access
```

---

## Phase 10: Monitoring Setup

### 10.1 Create CloudWatch Dashboard

```bash
# Create dashboard
cat > /tmp/dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "x": 0, "y": 0,
      "width": 12, "height": 6,
      "properties": {
        "title": "Lambda Invocations",
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "church-backend-api"]
        ],
        "period": 300,
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 12, "y": 0,
      "width": 12, "height": 6,
      "properties": {
        "title": "Lambda Errors",
        "metrics": [
          ["AWS/Lambda", "Errors", "FunctionName", "church-backend-api"]
        ],
        "period": 300,
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 0, "y": 6,
      "width": 12, "height": 6,
      "properties": {
        "title": "API Gateway Requests",
        "metrics": [
          ["AWS/ApiGateway", "Count", "ApiName", "church-api"]
        ],
        "period": 300,
        "region": "us-east-1"
      }
    },
    {
      "type": "metric",
      "x": 12, "y": 6,
      "width": 12, "height": 6,
      "properties": {
        "title": "RDS CPU",
        "metrics": [
          ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "church-db"]
        ],
        "period": 300,
        "region": "us-east-1"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name church-app-dashboard \
  --dashboard-body file:///tmp/dashboard.json
```

### 10.2 Create Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name church-lambda-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=church-backend-api \
  --evaluation-periods 1 \
  --alarm-description "Lambda function errors exceed threshold"

# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name church-api-5xx-errors \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ApiName,Value=church-api \
  --evaluation-periods 1 \
  --alarm-description "API 5xx errors exceed threshold"
```

---

## Deployment Commands Quick Reference

### Update Lambda Code

```bash
cd backend
rm -rf lambda_package church-backend.zip
mkdir lambda_package
pip install -r requirements.txt -t lambda_package/
cp -r app lambda_package/
cp lambda_handler.py lambda_package/
cd lambda_package && zip -r ../church-backend.zip . && cd ..

aws lambda update-function-code \
  --function-name church-backend-api \
  --zip-file fileb://church-backend.zip
```

### Update Frontend

```bash
cd frontend
npm run build
aws s3 sync dist/ s3://church-frontend-static --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Run Database Migrations

```bash
cd backend
alembic upgrade head
```

### View Lambda Logs

```bash
aws logs tail /aws/lambda/church-backend-api --follow
```

---

## Environment Variables Reference

### Backend (Lambda)

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_NAME` | Application name | Church Management System |
| `DEBUG` | Debug mode | false |
| `DATABASE_URL` | PostgreSQL connection | postgresql+psycopg://... |
| `SECRET_KEY` | JWT signing key | 64-char random string |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | 15 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | 7 |
| `AWS_REGION` | AWS region | us-east-1 |
| `S3_BUCKET_NAME` | Media bucket | church-media-bucket |
| `BACKEND_CORS_ORIGINS` | CORS origins | ["https://your-domain.com"] |
| `FRONTEND_URL` | Frontend URL | https://your-domain.com |

### Frontend (.env.production)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | https://xxx.execute-api.us-east-1.amazonaws.com/prod/api/v1 |

---

## Security Checklist

- [ ] Generate strong SECRET_KEY (64+ characters)
- [ ] Store secrets in AWS Secrets Manager
- [ ] Restrict RDS security group to Lambda VPC only
- [ ] Enable RDS encryption at rest
- [ ] Enable SSL for database connections
- [ ] Set DEBUG=false in production
- [ ] Configure proper CORS origins
- [ ] Enable CloudFront HTTPS redirect
- [ ] Set up CloudWatch alarms
- [ ] Enable AWS WAF on API Gateway (optional)
- [ ] Regular security patches and updates

---

## Troubleshooting

### Lambda Timeout

- Increase timeout in Lambda configuration
- Check VPC NAT Gateway for internet access
- Verify RDS security group allows Lambda

### API Gateway 502 Error

- Check Lambda execution logs in CloudWatch
- Verify Lambda handler path is correct
- Check Mangum adapter configuration

### Frontend 404 on Refresh

- Ensure CloudFront custom error response returns index.html
- S3 website hosting must be enabled

### Database Connection Issues

- Lambda must be in same VPC as RDS
- Security group must allow port 5432
- Check DATABASE_URL format

### CORS Errors

- Update BACKEND_CORS_ORIGINS with production domain
- Check API Gateway CORS configuration
- Verify CloudFront doesn't strip headers

---

## Next Steps After Setup

1. **Test all endpoints** via API Gateway URL
2. **Verify frontend** loads and can authenticate
3. **Run database migrations** on RDS
4. **Set up CI/CD** pipeline (GitHub Actions recommended)
5. **Configure custom domain** with SSL
6. **Enable AWS WAF** for additional security
7. **Set up backup automation** for RDS
8. **Document runbook** for operations

---

## Resources

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [API Gateway REST API](https://docs.aws.amazon.com/apigateway/)
- [CloudFront Developer Guide](https://docs.aws.amazon.com/cloudfront/)
- [Mangum Documentation](https://mangum.io/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
