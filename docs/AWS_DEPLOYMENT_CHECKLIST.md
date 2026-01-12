# AWS Deployment Checklist - Church Management System

Use this checklist to track progress through the complete AWS deployment.

---

## Pre-Deployment Status

| Component | Current Status |
|-----------|---------------|
| RDS PostgreSQL | ✅ Running at `church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com` |
| Database Migrations | ✅ Applied |
| Lambda Handler | ✅ Code exists (`lambda_handler.py`) |
| Frontend Build | ✅ Vite configured |

---

## Phase 1: Prerequisites

- [ ] **1.1** AWS CLI installed and configured
  ```bash
  aws --version
  aws configure
  # Region: us-east-1
  ```

- [ ] **1.2** Verify AWS credentials work
  ```bash
  aws sts get-caller-identity
  ```

- [ ] **1.3** Ensure IAM user has required permissions:
  - [ ] AmazonS3FullAccess
  - [ ] AWSLambda_FullAccess
  - [ ] AmazonAPIGatewayAdministrator
  - [ ] CloudFrontFullAccess
  - [ ] AmazonSESFullAccess
  - [ ] SecretsManagerReadWrite
  - [ ] AmazonRoute53FullAccess (if using custom domain)

---

## Phase 2: Secrets Management

- [ ] **2.1** Generate secure SECRET_KEY
  ```bash
  python -c "import secrets; print(secrets.token_urlsafe(64))"
  ```
  Generated key: `_________________________________________________`

- [ ] **2.2** Create secret in AWS Secrets Manager
  ```bash
  aws secretsmanager create-secret \
    --name church-app-secrets \
    --description "Church App production secrets" \
    --secret-string '{
      "DATABASE_URL": "postgresql+psycopg://church_admin:ChurchDb2024Secure!@church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com:5432/church_db",
      "SECRET_KEY": "YOUR_GENERATED_KEY_HERE"
    }'
  ```

---

## Phase 3: S3 Buckets

### 3.1 Frontend Static Bucket

- [ ] **3.1.1** Create bucket
  ```bash
  aws s3 mb s3://church-frontend-static --region us-east-1
  ```

- [ ] **3.1.2** Enable static website hosting
  ```bash
  aws s3 website s3://church-frontend-static \
    --index-document index.html \
    --error-document index.html
  ```

- [ ] **3.1.3** Disable block public access
  ```bash
  aws s3api put-public-access-block \
    --bucket church-frontend-static \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
  ```

- [ ] **3.1.4** Apply bucket policy for public read
  ```bash
  aws s3api put-bucket-policy \
    --bucket church-frontend-static \
    --policy '{
      "Version": "2012-10-17",
      "Statement": [{
        "Sid": "PublicReadGetObject",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::church-frontend-static/*"
      }]
    }'
  ```

### 3.2 Media Storage Bucket

- [ ] **3.2.1** Create media bucket
  ```bash
  aws s3 mb s3://church-media-bucket --region us-east-1
  ```

- [ ] **3.2.2** Enable CORS
  ```bash
  aws s3api put-bucket-cors \
    --bucket church-media-bucket \
    --cors-configuration '{
      "CORSRules": [{
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "MaxAgeSeconds": 3000
      }]
    }'
  ```

---

## Phase 4: Lambda Function

### 4.1 Create IAM Role

- [ ] **4.1.1** Create Lambda execution role
  ```bash
  aws iam create-role \
    --role-name church-lambda-role \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }'
  ```

- [ ] **4.1.2** Attach basic execution policy
  ```bash
  aws iam attach-role-policy \
    --role-name church-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  ```

- [ ] **4.1.3** Attach VPC access policy (for RDS)
  ```bash
  aws iam attach-role-policy \
    --role-name church-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
  ```

- [ ] **4.1.4** Attach S3 access policy
  ```bash
  aws iam attach-role-policy \
    --role-name church-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
  ```

- [ ] **4.1.5** Attach Secrets Manager policy
  ```bash
  aws iam attach-role-policy \
    --role-name church-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
  ```

- [ ] **4.1.6** Attach SES policy
  ```bash
  aws iam attach-role-policy \
    --role-name church-lambda-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
  ```

### 4.2 Package Backend

- [ ] **4.2.1** Create deployment package
  ```bash
  cd backend
  rm -rf lambda_package church-backend.zip
  mkdir lambda_package
  pip install -r requirements.txt -t lambda_package/
  cp -r app lambda_package/
  cp lambda_handler.py lambda_package/
  cd lambda_package && zip -r ../church-backend.zip . && cd ..
  ```

- [ ] **4.2.2** Verify zip file created
  ```bash
  ls -lh church-backend.zip
  ```

### 4.3 Create Lambda Function

- [ ] **4.3.1** Get role ARN
  ```bash
  ROLE_ARN=$(aws iam get-role --role-name church-lambda-role --query 'Role.Arn' --output text)
  echo $ROLE_ARN
  ```
  Role ARN: `_________________________________________________`

- [ ] **4.3.2** Create Lambda function
  ```bash
  aws lambda create-function \
    --function-name church-backend-api \
    --runtime python3.12 \
    --handler lambda_handler.handler \
    --role $ROLE_ARN \
    --zip-file fileb://church-backend.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables="{
      APP_NAME=\"Church Management System\",
      DEBUG=false,
      DATABASE_URL=\"postgresql+psycopg://church_admin:ChurchDb2024Secure!@church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com:5432/church_db\",
      SECRET_KEY=\"YOUR_SECRET_KEY\",
      ALGORITHM=HS256,
      ACCESS_TOKEN_EXPIRE_MINUTES=15,
      REFRESH_TOKEN_EXPIRE_DAYS=7,
      AWS_REGION=us-east-1,
      S3_BUCKET_NAME=church-media-bucket,
      FRONTEND_URL=\"https://YOUR_CLOUDFRONT_DOMAIN\"
    }"
  ```

### 4.4 Configure VPC (for RDS access)

- [ ] **4.4.1** Get VPC configuration from RDS
  ```bash
  # Get security group
  SG_ID=$(aws rds describe-db-instances \
    --db-instance-identifier church-db \
    --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)
  echo "Security Group: $SG_ID"

  # Get subnet IDs
  aws rds describe-db-instances \
    --db-instance-identifier church-db \
    --query 'DBInstances[0].DBSubnetGroup.Subnets[*].SubnetIdentifier'
  ```
  Security Group ID: `_________________________________________________`
  Subnet IDs: `_________________________________________________`

- [ ] **4.4.2** Update Lambda VPC config
  ```bash
  aws lambda update-function-configuration \
    --function-name church-backend-api \
    --vpc-config SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=$SG_ID
  ```

---

## Phase 5: API Gateway

### 5.1 Create API

- [ ] **5.1.1** Create REST API
  ```bash
  aws apigateway create-rest-api \
    --name church-api \
    --description "Church Management System API" \
    --endpoint-configuration types=REGIONAL
  ```

- [ ] **5.1.2** Get API ID
  ```bash
  API_ID=$(aws apigateway get-rest-apis \
    --query "items[?name=='church-api'].id" \
    --output text)
  echo "API ID: $API_ID"
  ```
  API ID: `_________________________________________________`

### 5.2 Create Resources

- [ ] **5.2.1** Get root resource ID
  ```bash
  ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text)
  echo "Root ID: $ROOT_ID"
  ```

- [ ] **5.2.2** Create proxy resource
  ```bash
  aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "{proxy+}"
  ```

- [ ] **5.2.3** Get proxy resource ID
  ```bash
  PROXY_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?pathPart==`{proxy+}`].id' \
    --output text)
  echo "Proxy ID: $PROXY_ID"
  ```

### 5.3 Create Integration

- [ ] **5.3.1** Get Lambda ARN
  ```bash
  LAMBDA_ARN=$(aws lambda get-function \
    --function-name church-backend-api \
    --query 'Configuration.FunctionArn' \
    --output text)
  echo "Lambda ARN: $LAMBDA_ARN"
  ```

- [ ] **5.3.2** Create method on proxy resource
  ```bash
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_ID \
    --http-method ANY \
    --authorization-type NONE
  ```

- [ ] **5.3.3** Create Lambda integration on proxy
  ```bash
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
  ```

- [ ] **5.3.4** Create method on root resource
  ```bash
  aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $ROOT_ID \
    --http-method ANY \
    --authorization-type NONE
  ```

- [ ] **5.3.5** Create Lambda integration on root
  ```bash
  aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $ROOT_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
  ```

### 5.4 Permissions & Deployment

- [ ] **5.4.1** Grant API Gateway permission to invoke Lambda
  ```bash
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

  aws lambda add-permission \
    --function-name church-backend-api \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:$ACCOUNT_ID:$API_ID/*"
  ```

- [ ] **5.4.2** Deploy API
  ```bash
  aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Production deployment"
  ```

- [ ] **5.4.3** Note API URL
  ```
  API URL: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod
  ```
  API URL: `_________________________________________________`

- [ ] **5.4.4** Test health endpoint
  ```bash
  curl https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/health
  ```

---

## Phase 6: Frontend Deployment

- [ ] **6.1** Update frontend environment for production
  ```bash
  cd frontend
  echo "VITE_API_URL=https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/api/v1" > .env.production
  ```

- [ ] **6.2** Build frontend
  ```bash
  npm run build
  ```

- [ ] **6.3** Deploy to S3
  ```bash
  aws s3 sync dist/ s3://church-frontend-static --delete
  ```

- [ ] **6.4** Test S3 website URL
  ```
  http://church-frontend-static.s3-website-us-east-1.amazonaws.com
  ```

---

## Phase 7: CloudFront Distribution

- [ ] **7.1** Create CloudFront distribution (via AWS Console recommended)
  - Origin: `church-frontend-static.s3.us-east-1.amazonaws.com`
  - Default root object: `index.html`
  - Viewer protocol: Redirect HTTP to HTTPS
  - Custom error response: 404 → /index.html (200)

- [ ] **7.2** Note CloudFront domain
  CloudFront URL: `_________________________________________________`

- [ ] **7.3** Update Lambda CORS/Frontend URL
  ```bash
  aws lambda update-function-configuration \
    --function-name church-backend-api \
    --environment Variables="{
      APP_NAME=\"Church Management System\",
      DEBUG=false,
      DATABASE_URL=\"postgresql+psycopg://church_admin:ChurchDb2024Secure!@church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com:5432/church_db\",
      SECRET_KEY=\"YOUR_SECRET_KEY\",
      ALGORITHM=HS256,
      ACCESS_TOKEN_EXPIRE_MINUTES=15,
      REFRESH_TOKEN_EXPIRE_DAYS=7,
      AWS_REGION=us-east-1,
      S3_BUCKET_NAME=church-media-bucket,
      FRONTEND_URL=\"https://YOUR_CLOUDFRONT_DOMAIN\",
      BACKEND_CORS_ORIGINS=\"[\\\"https://YOUR_CLOUDFRONT_DOMAIN\\\"]\"
    }"
  ```

---

## Phase 8: Verification & Testing

- [ ] **8.1** Test API health endpoint
  ```bash
  curl https://API_ID.execute-api.us-east-1.amazonaws.com/prod/health
  ```

- [ ] **8.2** Test frontend loads
  - Open CloudFront URL in browser
  - Verify page renders correctly

- [ ] **8.3** Test authentication flow
  - [ ] Register new user
  - [ ] Login
  - [ ] Access protected routes
  - [ ] Logout

- [ ] **8.4** Test database connectivity
  - [ ] User data persists
  - [ ] Members can be created

- [ ] **8.5** Check CloudWatch logs
  ```bash
  aws logs tail /aws/lambda/church-backend-api --follow
  ```

---

## Phase 9: Monitoring Setup (Optional)

- [ ] **9.1** Create CloudWatch dashboard
  ```bash
  aws cloudwatch put-dashboard \
    --dashboard-name church-app-dashboard \
    --dashboard-body '{"widgets":[]}'
  ```

- [ ] **9.2** Create Lambda error alarm
  ```bash
  aws cloudwatch put-metric-alarm \
    --alarm-name church-lambda-errors \
    --metric-name Errors \
    --namespace AWS/Lambda \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=FunctionName,Value=church-backend-api \
    --evaluation-periods 1
  ```

---

## Phase 10: Custom Domain (Optional)

- [ ] **10.1** Request SSL certificate in ACM (us-east-1)
  ```bash
  aws acm request-certificate \
    --domain-name church.yourdomain.com \
    --validation-method DNS \
    --region us-east-1
  ```

- [ ] **10.2** Validate certificate (add DNS records)

- [ ] **10.3** Add alternate domain to CloudFront distribution

- [ ] **10.4** Create Route 53 alias record pointing to CloudFront

---

## Deployment Complete Checklist

| Component | Status | URL/Endpoint |
|-----------|--------|--------------|
| RDS Database | ✅ | `church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com` |
| S3 Frontend | ✅ | `church-frontend-static.s3.us-east-1.amazonaws.com` |
| S3 Media | ✅ | `church-cms-media-176835474511.s3.us-east-1.amazonaws.com` |
| Lambda Function | ✅ | `church-backend-api` (Python 3.11) |
| API Gateway | ✅ | `https://joapehkgme.execute-api.us-east-1.amazonaws.com/prod` |
| CloudFront | ✅ | `https://d3avyavpqrbzzd.cloudfront.net` |
| Custom Domain | [ ] | `https://church.yourdomain.com` |

---

## Quick Update Commands

### Update Backend Code
```bash
cd backend
rm -rf lambda_package church-backend.zip
mkdir lambda_package
pip install -r requirements.txt -t lambda_package/
cp -r app lambda_handler.py lambda_package/
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
aws cloudfront create-invalidation \
  --distribution-id E1MAM7TVX65PHT \
  --paths "/*"
```

### View Logs
```bash
aws logs tail /aws/lambda/church-backend-api --follow
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Lambda timeout | Increase timeout, check VPC NAT |
| 502 Bad Gateway | Check Lambda logs, verify handler path |
| CORS errors | Update BACKEND_CORS_ORIGINS in Lambda env |
| 404 on refresh | Add CloudFront custom error response |
| DB connection failed | Verify Lambda VPC config matches RDS |

---

## Notes & Values

Deployed on 2026-01-12:

```
AWS Account ID: 176835474511
API Gateway ID: joapehkgme
API Gateway URL: https://joapehkgme.execute-api.us-east-1.amazonaws.com/prod
CloudFront Distribution ID: E1MAM7TVX65PHT
CloudFront Domain: d3avyavpqrbzzd.cloudfront.net
Lambda Deployment Bucket: church-lambda-deployments
Media Bucket: church-cms-media-176835474511
Secrets: church-app-secrets, church-db-credentials
```
