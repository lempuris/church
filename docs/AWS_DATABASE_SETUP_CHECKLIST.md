# AWS Shared Database Setup Checklist

## Overview
Set up a single AWS RDS PostgreSQL instance to serve both local development and production environments.

**Recommended Option**: RDS PostgreSQL t4g.micro (~$12-15/month)
- 2 vCPU, 1GB RAM
- 20GB GP3 storage (free tier)
- PostgreSQL 15+

---

## Phase 1: AWS Prerequisites

### 1.1 Configure AWS CLI
```bash
# Reconfigure with valid credentials
aws configure

# Required inputs:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json

# Verify authentication
aws sts get-caller-identity
```

### 1.2 Create Required IAM Permissions
Ensure your IAM user/role has these permissions:
- `rds:*` (RDS full access)
- `ec2:*` (for VPC/Security Groups)
- `secretsmanager:*` (for credentials storage)

---

## Phase 2: Network Infrastructure

### 2.1 Create VPC (if not exists)
```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=church-vpc}]'

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
  --vpc-id <vpc-id> \
  --enable-dns-hostnames
```

### 2.2 Create Subnets (minimum 2 for RDS)
```bash
# Subnet 1 (us-east-1a)
aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=church-db-subnet-1}]'

# Subnet 2 (us-east-1b)
aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=church-db-subnet-2}]'
```

### 2.3 Create Internet Gateway (for public access)
```bash
# Create IGW
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=church-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
  --internet-gateway-id <igw-id> \
  --vpc-id <vpc-id>
```

### 2.4 Create Route Table
```bash
# Create route table
aws ec2 create-route-table \
  --vpc-id <vpc-id> \
  --tag-specifications 'ResourceType=route-table,Tags=[{Key=Name,Value=church-public-rt}]'

# Add internet route
aws ec2 create-route \
  --route-table-id <rtb-id> \
  --destination-cidr-block 0.0.0.0/0 \
  --gateway-id <igw-id>

# Associate subnets
aws ec2 associate-route-table --route-table-id <rtb-id> --subnet-id <subnet-1-id>
aws ec2 associate-route-table --route-table-id <rtb-id> --subnet-id <subnet-2-id>
```

### 2.5 Create Security Group
```bash
# Create security group
aws ec2 create-security-group \
  --group-name church-db-sg \
  --description "Security group for Church DB" \
  --vpc-id <vpc-id>

# Allow PostgreSQL from anywhere (for dev access)
# WARNING: For production, restrict to specific IPs
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0
```

---

## Phase 3: RDS Database Setup

### 3.1 Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name church-db-subnet-group \
  --db-subnet-group-description "Subnet group for Church DB" \
  --subnet-ids <subnet-1-id> <subnet-2-id>
```

### 3.2 Create RDS PostgreSQL Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier church-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username church_admin \
  --master-user-password <STRONG_PASSWORD_HERE> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name church_db \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name church-db-subnet-group \
  --publicly-accessible \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "Mon:04:00-Mon:05:00" \
  --no-multi-az \
  --tags Key=Project,Value=ChurchManagement Key=Environment,Value=shared
```

### 3.3 Wait for Instance to be Available
```bash
# Check status
aws rds describe-db-instances \
  --db-instance-identifier church-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Wait for 'available' status (takes 5-10 minutes)
aws rds wait db-instance-available --db-instance-identifier church-db
```

### 3.4 Get Connection Endpoint
```bash
aws rds describe-db-instances \
  --db-instance-identifier church-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

---

## Phase 4: Secrets Management

### 4.1 Store Credentials in Secrets Manager
```bash
aws secretsmanager create-secret \
  --name church-db-credentials \
  --description "Church DB credentials" \
  --secret-string '{"username":"church_admin","password":"<PASSWORD>","host":"<RDS_ENDPOINT>","port":"5432","dbname":"church_db"}'
```

---

## Phase 5: Application Configuration

### 5.1 Update Backend .env
```env
# Database - AWS RDS PostgreSQL
DATABASE_URL=postgresql://church_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/church_db

# For async connections (asyncpg)
DATABASE_URL_ASYNC=postgresql+asyncpg://church_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/church_db
```

### 5.2 Update config.py (if needed)
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    DATABASE_URL: str

    # Optional: Add connection pool settings for remote DB
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
```

### 5.3 Update database.py for Connection Pooling
```python
# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Sync engine with pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True  # Important for remote connections
)

# Async engine
async_engine = create_async_engine(
    settings.DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://'),
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_pre_ping=True
)
```

---

## Phase 6: Database Migration

### 6.1 Update alembic.ini
```ini
# Update sqlalchemy.url or use env variable
sqlalchemy.url = postgresql://church_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/church_db
```

### 6.2 Run Migrations
```bash
cd backend

# Generate migration if schema changed
alembic revision --autogenerate -m "initial_aws_migration"

# Apply migrations to AWS RDS
alembic upgrade head
```

### 6.3 Verify Tables Created
```bash
# Connect via psql (if installed)
psql -h <RDS_ENDPOINT> -U church_admin -d church_db -c "\dt"
```

---

## Phase 7: Security Hardening (Production)

### 7.1 Restrict Security Group Access
```bash
# Remove open access
aws ec2 revoke-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0

# Add specific IP ranges
# Your office/home IP
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 5432 \
  --cidr <YOUR_IP>/32

# Lambda VPC (if using Lambda)
# Configure Lambda to use VPC and add Lambda security group
```

### 7.2 Enable SSL Connections
```python
# Update DATABASE_URL with SSL
DATABASE_URL=postgresql://church_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/church_db?sslmode=require
```

### 7.3 Enable Encryption at Rest
```bash
# Enable encryption (must be done at creation or via snapshot restore)
# Add to create-db-instance command:
--storage-encrypted \
--kms-key-id <kms-key-id>  # Optional: use custom KMS key
```

---

## Phase 8: Monitoring & Maintenance

### 8.1 Enable Enhanced Monitoring
```bash
aws rds modify-db-instance \
  --db-instance-identifier church-db \
  --monitoring-interval 60 \
  --monitoring-role-arn <monitoring-role-arn>
```

### 8.2 Set Up CloudWatch Alarms
```bash
# CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name church-db-cpu-high \
  --metric-name CPUUtilization \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=church-db \
  --evaluation-periods 2 \
  --alarm-actions <sns-topic-arn>

# Free storage alarm
aws cloudwatch put-metric-alarm \
  --alarm-name church-db-storage-low \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2147483648 \
  --comparison-operator LessThanThreshold \
  --dimensions Name=DBInstanceIdentifier,Value=church-db \
  --evaluation-periods 1 \
  --alarm-actions <sns-topic-arn>
```

---

## Quick Reference

### Connection String Format
```
postgresql://church_admin:<PASSWORD>@<RDS_ENDPOINT>:5432/church_db
```

### Estimated Monthly Costs
| Resource | Cost |
|----------|------|
| RDS t4g.micro | ~$12.41/mo |
| Storage (20GB gp3) | ~$1.60/mo |
| Data transfer (out) | ~$0.09/GB |
| **Total** | **~$15-20/mo** |

### Useful Commands
```bash
# Check instance status
aws rds describe-db-instances --db-instance-identifier church-db

# Stop instance (saves costs when not in use)
aws rds stop-db-instance --db-instance-identifier church-db

# Start instance
aws rds start-db-instance --db-instance-identifier church-db

# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier church-db \
  --db-snapshot-identifier church-db-manual-$(date +%Y%m%d)
```

---

## Checklist Summary

- [x] **Phase 1**: Configure AWS CLI with valid credentials ✅ (Account: 176835474511)
- [x] **Phase 2**: Set up VPC, subnets, IGW, route tables, security group ✅ (VPC: vpc-adee9bd7, SG: sg-0a2845eabe517acbf)
- [x] **Phase 3**: Create RDS PostgreSQL instance ✅ (church-db, PostgreSQL 15.10, db.t3.micro)
- [x] **Phase 4**: Store credentials in Secrets Manager ✅ (church-db-credentials)
- [x] **Phase 5**: Update application configuration (.env, config.py, database.py) ✅
- [x] **Phase 6**: Run Alembic migrations against AWS RDS ✅
- [ ] **Phase 7**: Harden security (restrict IPs, enable SSL, encryption)
- [ ] **Phase 8**: Set up monitoring and alarms

### Deployed Resources
| Resource | Value |
|----------|-------|
| RDS Endpoint | `church-db.cu3e0crp5ftt.us-east-1.rds.amazonaws.com` |
| Database | `church_db` |
| Username | `church_admin` |
| VPC | `vpc-adee9bd7` |
| Security Group | `sg-0a2845eabe517acbf` |
| Secret ARN | `arn:aws:secretsmanager:us-east-1:176835474511:secret:church-db-credentials-o93lE8` |

---

## Troubleshooting

### Connection Timeout
- Check security group allows your IP
- Verify RDS is publicly accessible
- Check route table has internet gateway route

### Authentication Failed
- Verify username/password in Secrets Manager matches
- Check DATABASE_URL is correctly formatted

### Slow Queries
- Enable Performance Insights in RDS console
- Consider upgrading to t4g.small if CPU bound
- Add appropriate indexes
