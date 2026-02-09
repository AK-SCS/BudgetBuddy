# 🚀 BudgetBuddy Deployment Guide

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Local Development](#local-development)
3. [Production Deployment](#production-deployment)
4. [Cloud Deployments](#cloud-deployments)
5. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Environment Setup

### 1. Create Environment Files

First, copy the example environment files and configure them:

```bash
# Backend (.NET API)
cp BudgetBuddy/.env.example BudgetBuddy/.env

# ML Service (Python)
cp BudgetBuddy-ml-service/.env.example BudgetBuddy-ml-service/.env

# Frontend (React)
cp budgetbuddyweb/.env.example budgetbuddyweb/.env
```

### 2. Generate Secure Secrets

**JWT Secret (Required):**
```bash
# Generate a cryptographically secure 64-character secret
openssl rand -base64 48

# Or use PowerShell on Windows
[System.Convert]::ToBase64String((1..48 | ForEach-Object {Get-Random -Minimum 0 -Maximum 256}))
```

Add this to `BudgetBuddy/.env`:
```env
JWT_SECRET=your-generated-secret-here-minimum-32-characters
```

**Get Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `BudgetBuddy/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Configure Database

**Development (SQLite):**
```env
DATABASE_TYPE=sqlite
SQLITE_CONNECTION_STRING=Data Source=Data/budgetbuddy.db
```

**Production (PostgreSQL):**
```env
DATABASE_TYPE=postgresql
POSTGRES_CONNECTION_STRING=Host=your-postgres-host;Database=budgetbuddy;Username=your-user;Password=your-password
```

---

## Local Development

### Option 1: Docker Compose (Recommended)

```bash
# Start all services in development mode
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

Access the app:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5206
- API Docs: http://localhost:5206/swagger
- ML Service: http://localhost:8000

### Option 2: Manual Development

**1. Start Backend:**
```bash
cd BudgetBuddy
dotnet restore
dotnet ef database update  # Run migrations
dotnet run
```

**2. Start ML Service:**
```bash
cd BudgetBuddy-ml-service
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python train.py  # Train model (first time only)
uvicorn main:app --reload
```

**3. Start Frontend:**
```bash
cd budgetbuddyweb
npm install
npm run dev
```

---

## Production Deployment

### Step 1: Build Production Images

```bash
# Build all services
docker-compose build

# Or build individually
docker build -f Dockerfile.backend -t budgetbuddy-backend .
docker build -f Dockerfile.ml -t budgetbuddy-ml .
docker build -f Dockerfile.frontend -t budgetbuddy-frontend .
```

### Step 2: Configure Production Environment

Create a `.env.production` file:
```env
# Database (Use PostgreSQL in production)
DATABASE_TYPE=postgresql
POSTGRES_CONNECTION_STRING=Host=your-db-host;Database=budgetbuddy;Username=admin;Password=secure-password

# Security
JWT_SECRET=your-very-secure-random-secret-minimum-32-characters
GEMINI_API_KEY=your-production-gemini-api-key

# URLs
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
ML_SERVICE_BASE_URL=http://ml-service:8000

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100

# Environment
ASPNETCORE_ENVIRONMENT=Production
ENVIRONMENT=production
```

### Step 3: Deploy with Docker Compose

```bash
# Start production services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Scale services if needed
docker-compose up -d --scale backend=3
```

### Step 4: Set Up Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/budgetbuddy`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5206/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ML Service
    location /ml/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/budgetbuddy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Cloud Deployments

### Azure App Service

**1. Login to Azure:**
```bash
az login
```

**2. Create Resource Group:**
```bash
az group create --name budgetbuddy-rg --location eastus
```

**3. Deploy Backend:**
```bash
# Create App Service Plan
az appservice plan create --name budgetbuddy-plan --resource-group budgetbuddy-rg --sku B1 --is-linux

# Create Web App
az webapp create --name budgetbuddy-api --resource-group budgetbuddy-rg --plan budgetbuddy-plan --runtime "DOTNETCORE:8.0"

# Configure environment variables
az webapp config appsettings set --name budgetbuddy-api --resource-group budgetbuddy-rg --settings \
  DATABASE_TYPE=postgresql \
  JWT_SECRET=$JWT_SECRET \
  GEMINI_API_KEY=$GEMINI_API_KEY

# Deploy
cd BudgetBuddy
dotnet publish -c Release
az webapp deployment source config-zip --resource-group budgetbuddy-rg --name budgetbuddy-api --src publish.zip
```

**4. Deploy Frontend:**
```bash
# Create Static Web App
az staticwebapp create --name budgetbuddy-web --resource-group budgetbuddy-rg --location eastus

# Build and deploy
cd budgetbuddyweb
npm run build
az staticwebapp deploy --name budgetbuddy-web --resource-group budgetbuddy-rg --source-path dist
```

**5. Set Up PostgreSQL:**
```bash
az postgres flexible-server create \
  --name budgetbuddy-db \
  --resource-group budgetbuddy-rg \
  --location eastus \
  --admin-user adminuser \
  --admin-password SecurePassword123! \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32
```

### AWS (Elastic Beanstalk)

**1. Install EB CLI:**
```bash
pip install awsebcli
```

**2. Initialize:**
```bash
eb init -p docker budgetbuddy --region us-east-1
```

**3. Create Environment:**
```bash
eb create production-env --instance-type t3.small
```

**4. Deploy:**
```bash
eb deploy
```

**5. Set Environment Variables:**
```bash
eb setenv \
  DATABASE_TYPE=postgresql \
  JWT_SECRET=$JWT_SECRET \
  GEMINI_API_KEY=$GEMINI_API_KEY
```

### Google Cloud Platform (Cloud Run)

**1. Build and Push Images:**
```bash
# Configure Docker for GCP
gcloud auth configure-docker

# Build and push
docker build -f Dockerfile.backend -t gcr.io/your-project/budgetbuddy-backend .
docker push gcr.io/your-project/budgetbuddy-backend

docker build -f Dockerfile.ml -t gcr.io/your-project/budgetbuddy-ml .
docker push gcr.io/your-project/budgetbuddy-ml
```

**2. Deploy to Cloud Run:**
```bash
# Backend
gcloud run deploy budgetbuddy-api \
  --image gcr.io/your-project/budgetbuddy-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_TYPE=postgresql,JWT_SECRET=$JWT_SECRET

# ML Service
gcloud run deploy budgetbuddy-ml \
  --image gcr.io/your-project/budgetbuddy-ml \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend
curl http://localhost:5206/health

# ML Service
curl http://localhost:8000/health

# Frontend
curl http://localhost:80/health
```

### Logs

**Docker:**
```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

**Application Logs:**
- Backend: `BudgetBuddy/logs/budgetbuddy-YYYY-MM-DD.log`
- ML Service: `BudgetBuddy-ml-service/logs/ml-service.log`

### Database Migrations

**Create Migration:**
```bash
cd BudgetBuddy
dotnet ef migrations add MigrationName
```

**Apply Migration:**
```bash
dotnet ef database update
```

**Production Migration:**
```bash
# Generate SQL script
dotnet ef migrations script --output migration.sql

# Review and apply manually
psql -h your-db-host -U admin -d budgetbuddy -f migration.sql
```

### Backup & Restore

**PostgreSQL Backup:**
```bash
# Backup
pg_dump -h your-db-host -U admin -d budgetbuddy > backup-$(date +%Y%m%d).sql

# Restore
psql -h your-db-host -U admin -d budgetbuddy < backup-20260210.sql
```

**Docker Volume Backup:**
```bash
# Backup
docker run --rm -v budgetbuddy_postgres_data:/data -v $(pwd):/backup ubuntu tar czf /backup/postgres-backup.tar.gz /data

# Restore
docker run --rm -v budgetbuddy_postgres_data:/data -v $(pwd):/backup ubuntu tar xzf /backup/postgres-backup.tar.gz -C /
```

### Scaling

**Horizontal Scaling:**
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# With load balancer (Nginx upstream)
upstream backend_servers {
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}
```

### Performance Tuning

**Database:**
```sql
-- Add indexes
CREATE INDEX idx_budget_entries_user_id ON budget_entries(user_id);
CREATE INDEX idx_budget_entries_month ON budget_entries(month);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM budget_entries WHERE user_id = 1;
```

**Caching:**
- Add Redis for session management
- Implement response caching for ML predictions
- Use CDN for frontend assets

---

## Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
psql "postgresql://user:password@host:5432/budgetbuddy"
```

**Issue: ML model not found**
```bash
# Train the model
cd BudgetBuddy-ml-service
python train.py

# Check model file exists
ls -la models/random_forest_pipeline.joblib
```

**Issue: CORS errors**
```bash
# Check ALLOWED_ORIGINS includes your frontend URL
echo $ALLOWED_ORIGINS
```

**Issue: JWT authentication failed**
```bash
# Ensure JWT_SECRET is set and same across restarts
# Check it's at least 32 characters
```

### Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review [GitHub Issues](https://github.com/yourusername/BudgetBuddy/issues)
3. Email: support@budgetbuddy.com

---

**Happy Deploying! 🚀**
