# Технологічний стек MVP

## 1. Огляд технологій

### Принципи вибору
- **Швидкість розробки** - використання перевірених технологій
- **Масштабованість** - можливість горизонтального масштабування
- **Підтримка спільноти** - популярні технології з великою спільнотою
- **Вартість** - мінімізація витрат на інфраструктуру для MVP

## 2. Backend

### 2.1 Runtime & Framework

#### Node.js 20 LTS
- **Версія**: 20.11.0 LTS
- **Причини вибору**:
  - Єдина мова (JavaScript/TypeScript) для frontend і backend
  - Асинхронна природа ідеальна для I/O операцій
  - Великий вибір пакетів в npm
  - Швидкий старт розробки

#### Express.js 4.18
- **Версія**: 4.18.2
- **Причини вибору**:
  - Мінімалістичний та гнучкий
  - Велика екосистема middleware
  - Простота навчання та використання
  - Добре документований

#### TypeScript 5.3
- **Версія**: 5.3.3
- **Конфігурація**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### 2.2 Основні пакети

#### Автентифікація та безпека
- **jsonwebtoken** (9.0.2) - JWT токени
- **bcrypt** (5.1.1) - хешування паролів
- **helmet** (7.1.0) - безпека HTTP headers
- **cors** (2.8.5) - CORS політики
- **express-rate-limit** (7.1.5) - rate limiting

#### Валідація та парсинг
- **joi** (17.11.0) - валідація даних
- **express-validator** (7.0.1) - альтернатива для валідації
- **body-parser** (1.20.2) - парсинг request body
- **multer** (1.4.5) - обробка файлів (для майбутніх функцій)

#### База даних
- **@prisma/client** (5.8.0) - ORM
- **pg** (8.11.3) - PostgreSQL драйвер
- **redis** (4.6.12) - Redis клієнт
- **ioredis** (5.3.2) - альтернативний Redis клієнт

#### Утиліти
- **nanoid** (5.0.4) - генерація коротких ID
- **dayjs** (1.11.10) - робота з датами
- **lodash** (4.17.21) - утиліти
- **dotenv** (16.3.1) - environment variables
- **winston** (3.11.0) - логування
- **morgan** (1.10.0) - HTTP request logger

#### Аналітика
- **maxmind** (4.3.11) - GeoIP lookup
- **ua-parser-js** (1.0.37) - User-Agent парсинг
- **geoip-lite** (1.4.10) - альтернатива для GeoIP

### 2.3 Dev Dependencies

```json
{
  "@types/node": "^20.11.0",
  "@types/express": "^4.17.21",
  "@types/bcrypt": "^5.0.2",
  "@types/jsonwebtoken": "^9.0.5",
  "@typescript-eslint/eslint-plugin": "^6.18.0",
  "@typescript-eslint/parser": "^6.18.0",
  "eslint": "^8.56.0",
  "prettier": "^3.2.2",
  "nodemon": "^3.0.2",
  "ts-node": "^10.9.2",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.11",
  "supertest": "^6.3.3"
}
```

## 3. Frontend

### 3.1 Framework & Build Tools

#### React 18
- **Версія**: 18.2.0
- **Причини вибору**:
  - Найпопулярніший frontend framework
  - Велика спільнота та екосистема
  - Хороша продуктивність
  - React Server Components для SSR

#### Vite 5
- **Версія**: 5.0.10
- **Причини вибору**:
  - Швидкий HMR (Hot Module Replacement)
  - Оптимізований production build
  - Native ESM support
  - Вбудована підтримка TypeScript

### 3.2 Основні пакети

#### Routing & State
- **react-router-dom** (6.21.1) - routing
- **@tanstack/react-query** (5.17.0) - server state management
- **zustand** (4.4.7) - client state management
- **react-hook-form** (7.48.2) - форми

#### UI & Styling
- **tailwindcss** (3.4.0) - utility-first CSS
- **@headlessui/react** (1.7.17) - UI компоненти
- **@heroicons/react** (2.1.1) - іконки
- **framer-motion** (10.18.0) - анімації
- **react-hot-toast** (2.4.1) - notifications

#### Utilities
- **axios** (1.6.5) - HTTP client
- **dayjs** (1.11.10) - дати
- **qrcode** (1.5.3) - генерація QR кодів
- **recharts** (2.10.3) - графіки
- **react-copy-to-clipboard** (5.1.0) - копіювання в буфер

### 3.3 Dev Dependencies

```json
{
  "@types/react": "^18.2.47",
  "@types/react-dom": "^18.2.18",
  "@vitejs/plugin-react": "^4.2.1",
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.33",
  "eslint-plugin-react": "^7.33.2",
  "eslint-plugin-react-hooks": "^4.6.0"
}
```

## 4. База даних

### 4.1 PostgreSQL 15

#### Конфігурація
```conf
# postgresql.conf
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

#### Індекси та оптимізація
- B-tree індекси для primary keys
- Hash індекси для short_code lookup
- Partial індекси для активних посилань
- Автоматичний VACUUM та ANALYZE

### 4.2 Redis 7

#### Використання
- Session storage
- URL metadata cache
- Rate limiting counters
- Real-time analytics buffer

#### Конфігурація
```conf
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 4.3 Prisma ORM

#### Переваги
- Type-safe database queries
- Автоматична генерація типів
- Міграції
- Database introspection

#### CLI команди
```bash
# Ініціалізація
npx prisma init

# Міграції
npx prisma migrate dev
npx prisma migrate deploy

# Генерація клієнта
npx prisma generate

# Studio (GUI)
npx prisma studio
```

## 5. Інфраструктура

### 5.1 Docker

#### docker-compose.yml
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/urlshortener
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=urlshortener
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 5.2 Nginx

#### Конфігурація
```nginx
upstream backend {
    server app:3000;
}

server {
    listen 80;
    server_name short.ly;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 6. Моніторинг та логування

### 6.1 Application Monitoring

#### PM2 (Process Manager)
```json
{
  "apps": [{
    "name": "url-shortener",
    "script": "./dist/index.js",
    "instances": "max",
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

#### Winston Logger
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 6.2 Metrics

#### Prometheus (Phase 2)
- Request duration
- Response status codes
- Active connections
- Database query time

#### Grafana Dashboard (Phase 2)
- Real-time metrics visualization
- Alert configuration
- Custom dashboards

## 7. CI/CD

### 7.1 GitHub Actions

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - run: npm ci
    - run: npm run lint
    - run: npm run test
    - run: npm run build
```

### 7.2 Deployment

#### DigitalOcean App Platform
```yaml
name: url-shortener
services:
- name: web
  github:
    repo: username/url-shortener
    branch: main
  build_command: npm run build
  run_command: npm start
  environment_slug: node-js
  instance_size_slug: basic-xs
  instance_count: 1
  http_port: 3000
```

## 8. Development Tools

### 8.1 IDE та Extensions

#### VS Code Extensions
- ESLint
- Prettier
- Prisma
- Thunder Client (API testing)
- GitLens
- Docker
- Tailwind CSS IntelliSense

### 8.2 Testing

#### Jest Configuration
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
```

#### Testing Libraries
- **jest** - unit testing
- **supertest** - API testing
- **@testing-library/react** - React component testing
- **cypress** - E2E testing (Phase 2)

## 9. Package.json Scripts

### Backend
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "studio": "prisma studio"
  }
}
```

### Frontend
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
    "test": "jest",
    "test:e2e": "cypress open"
  }
}
```

## 10. Версії та сумісність

### Compatibility Matrix

| Component | Version | Node.js | Notes |
|-----------|---------|---------|-------|
| Node.js | 20.11.0 | - | LTS until 2026 |
| TypeScript | 5.3.3 | >=16.0 | Latest stable |
| React | 18.2.0 | >=14.0 | Latest stable |
| PostgreSQL | 15 | - | Latest stable |
| Redis | 7.2 | - | Latest stable |
| Docker | 24.0 | - | Latest stable |
| Nginx | 1.24 | - | Latest stable |