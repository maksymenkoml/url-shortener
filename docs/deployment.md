# Deployment та DevOps MVP

## 1. Огляд інфраструктури

### Deployment Strategy
- **MVP**: Single VPS deployment
- **Phase 2**: Container orchestration
- **Phase 3**: Kubernetes cluster

### Environments
1. **Development** - Local Docker
2. **Staging** - Test VPS
3. **Production** - Production VPS

## 2. Local Development

### 2.1 Docker Setup

#### Dockerfile для Backend
```dockerfile
# Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production
RUN npm install -g prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### Dockerfile для Frontend
```dockerfile
# Frontend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### docker-compose.yml для розробки
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: urlshortener-db
    environment:
      POSTGRES_USER: ${DB_USER:-urlshortener}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-password}
      POSTGRES_DB: ${DB_NAME:-urlshortener}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U urlshortener"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: urlshortener-redis
    command: redis-server --appendonly yes
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: urlshortener-backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USER:-urlshortener}:${DB_PASSWORD:-password}@postgres:5432/${DB_NAME:-urlshortener}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-development-secret-change-in-production}
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: urlshortener-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

### 2.2 Environment Variables

#### .env.example
```bash
# Database
DB_USER=urlshortener
DB_PASSWORD=secure-password-here
DB_NAME=urlshortener
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your-32-character-access-secret-here
JWT_REFRESH_SECRET=your-32-character-refresh-secret-here

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Security
SESSION_SECRET=your-session-secret-here
ENCRYPTION_KEY=your-encryption-key-here
IP_HASH_SALT=your-ip-hash-salt-here

# GeoIP
GEOIP_LICENSE_KEY=your-maxmind-license-key

# Email (Phase 2)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 3. CI/CD Pipeline

### 3.1 GitHub Actions

#### .github/workflows/ci.yml
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'

jobs:
  lint:
    name: Lint Code
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      
      - name: Run ESLint
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Run database migrations
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
        run: npx prisma migrate deploy
      
      - name: Run backend tests
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
        run: npm test -- --coverage
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info

  build:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: [lint, test]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/urlshortener-backend:latest
            ${{ secrets.DOCKER_USERNAME }}/urlshortener-backend:${{ github.sha }}
          cache-from: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/urlshortener-backend:buildcache
          cache-to: type=registry,ref=${{ secrets.DOCKER_USERNAME }}/urlshortener-backend:buildcache,mode=max
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/urlshortener-frontend:latest
            ${{ secrets.DOCKER_USERNAME }}/urlshortener-frontend:${{ github.sha }}
```

#### .github/workflows/deploy.yml
```yaml
name: Deploy to Production

on:
  workflow_dispatch:
  push:
    tags:
      - 'v*'

jobs:
  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/urlshortener
            git pull origin main
            docker-compose pull
            docker-compose up -d --remove-orphans
            docker system prune -f
```

## 4. Production Deployment

### 4.1 VPS Setup (DigitalOcean/AWS EC2)

#### Initial Server Setup
```bash
#!/bin/bash

# Update system
apt update && apt upgrade -y

# Install required packages
apt install -y \
  curl \
  git \
  ufw \
  nginx \
  certbot \
  python3-certbot-nginx \
  fail2ban

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker $USER

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban

# Create application directory
mkdir -p /opt/urlshortener
cd /opt/urlshortener

# Clone repository
git clone https://github.com/yourusername/urlshortener.git .

# Setup environment
cp .env.example .env.production
# Edit .env.production with production values

# Start services
docker-compose -f docker-compose.production.yml up -d
```

### 4.2 Nginx Configuration

#### /etc/nginx/sites-available/urlshortener
```nginx
upstream backend {
    server 127.0.0.1:3000;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name short.ly www.short.ly;
    return 301 https://$host$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name short.ly;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/short.ly/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/short.ly/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/urlshortener.access.log;
    error_log /var/log/nginx/urlshortener.error.log;

    # Frontend static files
    location / {
        root /opt/urlshortener/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Short URL redirects
    location ~ ^/([a-zA-Z0-9]{4,10})$ {
        proxy_pass http://backend/$1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache for performance
        proxy_cache_valid 301 302 1h;
        proxy_cache_key "$scheme$request_method$host$request_uri";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml application/atom+xml image/svg+xml text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype;
}
```

### 4.3 SSL Certificate Setup

```bash
# Install SSL certificate using Let's Encrypt
certbot --nginx -d short.ly -d www.short.ly

# Auto-renewal cron job
echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

### 4.4 docker-compose.production.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: urlshortener-db-prod
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: urlshortener-redis-prod
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ${DOCKER_USERNAME}/urlshortener-backend:latest
    container_name: urlshortener-backend-prod
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      APP_URL: ${APP_URL}
    ports:
      - "127.0.0.1:3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - internal
      - external
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  internal:
    driver: bridge
  external:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

## 5. Monitoring

### 5.1 Health Checks

#### Backend health endpoint
```javascript
// /health endpoint
app.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    checks: {}
  };

  // Check database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'OK';
  } catch (error) {
    health.checks.database = 'ERROR';
    health.status = 'ERROR';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'OK';
  } catch (error) {
    health.checks.redis = 'ERROR';
    health.status = 'ERROR';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### 5.2 Uptime Monitoring

#### UptimeRobot Configuration
```json
{
  "monitors": [
    {
      "name": "URL Shortener API",
      "url": "https://short.ly/health",
      "interval": 300,
      "alert_contacts": ["email", "slack"]
    },
    {
      "name": "URL Shortener Frontend",
      "url": "https://short.ly",
      "interval": 300,
      "alert_contacts": ["email", "slack"]
    }
  ]
}
```

### 5.3 Application Monitoring

#### PM2 Setup
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Save configuration
pm2 save
pm2 startup
```

#### ecosystem.config.js
```javascript
module.exports = {
  apps: [{
    name: 'urlshortener-backend',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    autorestart: true,
    watch: false
  }]
};
```

## 6. Backup Strategy

### 6.1 Database Backup

#### backup.sh
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/urlshortener/backups"
DB_NAME="urlshortener"
DB_USER="urlshortener"
RETENTION_DAYS=30

# Create backup
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

# Perform backup
docker exec urlshortener-db-prod pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Upload to S3 (optional)
aws s3 cp $BACKUP_FILE s3://urlshortener-backups/

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "Backup completed: $BACKUP_FILE"
```

#### Cron job
```bash
# Add to crontab
0 2 * * * /opt/urlshortener/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 6.2 Restore Procedure

```bash
#!/bin/bash

# Stop application
docker-compose -f docker-compose.production.yml stop backend

# Restore database
gunzip < backup_20240115_020000.sql.gz | docker exec -i urlshortener-db-prod psql -U urlshortener

# Start application
docker-compose -f docker-compose.production.yml start backend
```

## 7. Scaling Strategy

### 7.1 Vertical Scaling
- Increase VPS resources (CPU, RAM)
- Optimize database queries
- Add more Redis memory

### 7.2 Horizontal Scaling (Phase 2)
```yaml
# docker-compose with multiple backend instances
backend:
  image: urlshortener-backend
  deploy:
    replicas: 3
  # Load balancer configuration
```

### 7.3 Database Optimization
```sql
-- Add read replica
CREATE PUBLICATION urlshortener_pub FOR ALL TABLES;

-- On replica
CREATE SUBSCRIPTION urlshortener_sub
CONNECTION 'host=primary dbname=urlshortener'
PUBLICATION urlshortener_pub;
```

## 8. Disaster Recovery

### 8.1 Recovery Plan
1. **Detection** - Monitoring alerts
2. **Assessment** - Determine impact
3. **Communication** - Notify stakeholders
4. **Recovery** - Execute recovery procedure
5. **Validation** - Verify system functionality
6. **Documentation** - Document incident

### 8.2 RTO/RPO Targets
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 24 hours

## 9. Rollback Strategy

### 9.1 Blue-Green Deployment
```bash
#!/bin/bash

# Deploy to green environment
docker-compose -f docker-compose.green.yml up -d

# Test green environment
curl http://localhost:3001/health

# Switch traffic to green
nginx -s reload

# Keep blue environment for rollback
docker-compose -f docker-compose.blue.yml stop
```

### 9.2 Database Migration Rollback
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back

# Apply specific migration
npx prisma migrate deploy --schema prisma/migrations/20240115/migration.sql
```

## 10. Performance Optimization

### 10.1 CDN Setup (Cloudflare)
- Cache static assets
- DDoS protection
- SSL termination
- Geographic distribution

### 10.2 Database Optimization
```bash
# Analyze slow queries
docker exec urlshortener-db-prod psql -U urlshortener -c "SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Update statistics
docker exec urlshortener-db-prod psql -U urlshortener -c "ANALYZE;"
```

## 11. Deployment Checklist

### Pre-deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Security scan completed
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup completed

### Deployment
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Verify health checks
- [ ] Monitor metrics

### Post-deployment
- [ ] Verify functionality
- [ ] Check error logs
- [ ] Monitor performance
- [ ] Update documentation
- [ ] Notify team