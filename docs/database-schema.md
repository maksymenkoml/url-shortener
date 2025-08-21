# Схема бази даних MVP

## 1. Загальний опис

### Технологія
- **СУБД**: PostgreSQL 15
- **ORM**: Prisma
- **Міграції**: Prisma Migrate

### Naming Convention
- Таблиці: `snake_case`, множина (users, links)
- Колонки: `snake_case`
- Індекси: `idx_table_column`
- Foreign Keys: `fk_table_reference`
- Primary Keys: `id` (bigint)

## 2. Схема таблиць

### 2.1 Таблиця `users`
Зберігає інформацію про зареєстрованих користувачів.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### 2.2 Таблиця `links`
Основна таблиця для зберігання коротких посилань.

```sql
CREATE TABLE links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    original_url TEXT NOT NULL,
    user_id BIGINT,
    title VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    click_count INTEGER DEFAULT 0,
    unique_click_count INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_links_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT short_code_length CHECK (LENGTH(short_code) >= 4),
    CONSTRAINT valid_url CHECK (original_url ~* '^https?://')
);

CREATE UNIQUE INDEX idx_links_short_code ON links(short_code);
CREATE INDEX idx_links_user_id ON links(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_links_created_at ON links(created_at DESC);
CREATE INDEX idx_links_active ON links(is_active) WHERE is_active = true;
CREATE INDEX idx_links_expires ON links(expires_at) WHERE expires_at IS NOT NULL;
```

### 2.3 Таблиця `clicks`
Зберігає детальну інформацію про кожен клік.

```sql
CREATE TABLE clicks (
    id BIGSERIAL PRIMARY KEY,
    link_id BIGINT NOT NULL,
    ip_address INET,
    ip_hash VARCHAR(64), -- SHA256 hash для GDPR
    user_agent TEXT,
    referer TEXT,
    country_code VARCHAR(2),
    country_name VARCHAR(100),
    city VARCHAR(100),
    region VARCHAR(100),
    browser VARCHAR(50),
    browser_version VARCHAR(20),
    os VARCHAR(50),
    os_version VARCHAR(20),
    device_type VARCHAR(20), -- desktop, mobile, tablet
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_clicks_link FOREIGN KEY (link_id) 
        REFERENCES links(id) ON DELETE CASCADE
);

CREATE INDEX idx_clicks_link_id ON clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX idx_clicks_country ON clicks(country_code);
CREATE INDEX idx_clicks_link_date ON clicks(link_id, clicked_at DESC);

-- Партиціонування по місяцях для оптимізації (опційно для MVP)
-- CREATE TABLE clicks_2024_01 PARTITION OF clicks
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 2.4 Таблиця `password_resets`
Токени для відновлення паролю.

```sql
CREATE TABLE password_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_password_resets_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_password_resets_token ON password_resets(token);
CREATE INDEX idx_password_resets_expires ON password_resets(expires_at);
```

### 2.5 Таблиця `sessions` (опційно, якщо не використовуємо Redis)
Сесії користувачів.

```sql
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

## 3. Views для аналітики

### 3.1 Daily Statistics View
```sql
CREATE MATERIALIZED VIEW daily_link_stats AS
SELECT 
    l.id as link_id,
    l.short_code,
    DATE(c.clicked_at) as date,
    COUNT(*) as click_count,
    COUNT(DISTINCT c.ip_hash) as unique_clicks,
    COUNT(DISTINCT c.country_code) as countries_count
FROM links l
LEFT JOIN clicks c ON l.id = c.link_id
WHERE c.clicked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY l.id, l.short_code, DATE(c.clicked_at);

CREATE UNIQUE INDEX idx_daily_stats_link_date 
ON daily_link_stats(link_id, date);
```

### 3.2 Geographic Statistics View
```sql
CREATE MATERIALIZED VIEW geo_stats AS
SELECT 
    link_id,
    country_code,
    country_name,
    COUNT(*) as click_count,
    COUNT(DISTINCT ip_hash) as unique_visitors
FROM clicks
WHERE clicked_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY link_id, country_code, country_name;

CREATE INDEX idx_geo_stats_link 
ON geo_stats(link_id);
```

## 4. Функції та тригери

### 4.1 Автоматичне оновлення updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at 
    BEFORE UPDATE ON links 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Оновлення статистики кліків
```sql
CREATE OR REPLACE FUNCTION update_link_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE links 
    SET 
        click_count = click_count + 1,
        last_clicked_at = NEW.clicked_at
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_link_stats_on_click
    AFTER INSERT ON clicks
    FOR EACH ROW
    EXECUTE FUNCTION update_link_stats();
```

### 4.3 Видалення expired посилань
```sql
CREATE OR REPLACE FUNCTION delete_expired_links()
RETURNS void AS $$
BEGIN
    UPDATE links 
    SET is_active = false
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = true;
END;
$$ language 'plpgsql';

-- Cron job для виконання кожну годину
-- SELECT cron.schedule('delete-expired-links', '0 * * * *', 
--     'SELECT delete_expired_links();');
```

## 5. Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            BigInt    @id @default(autoincrement())
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  fullName      String?   @map("full_name") @db.VarChar(255)
  isActive      Boolean   @default(true) @map("is_active")
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  
  links         Link[]
  passwordResets PasswordReset[]
  sessions      Session[]
  
  @@map("users")
  @@index([email])
  @@index([createdAt(sort: Desc)])
}

model Link {
  id              BigInt    @id @default(autoincrement())
  shortCode       String    @unique @map("short_code") @db.VarChar(10)
  originalUrl     String    @map("original_url")
  userId          BigInt?   @map("user_id")
  title           String?   @db.VarChar(255)
  description     String?
  isActive        Boolean   @default(true) @map("is_active")
  clickCount      Int       @default(0) @map("click_count")
  uniqueClickCount Int      @default(0) @map("unique_click_count")
  lastClickedAt   DateTime? @map("last_clicked_at")
  expiresAt       DateTime? @map("expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  user            User?     @relation(fields: [userId], references: [id], onDelete: Cascade)
  clicks          Click[]
  
  @@map("links")
  @@index([shortCode])
  @@index([userId])
  @@index([createdAt(sort: Desc)])
  @@index([isActive])
}

model Click {
  id             BigInt   @id @default(autoincrement())
  linkId         BigInt   @map("link_id")
  ipAddress      String?  @map("ip_address") @db.Inet
  ipHash         String?  @map("ip_hash") @db.VarChar(64)
  userAgent      String?  @map("user_agent")
  referer        String?
  countryCode    String?  @map("country_code") @db.VarChar(2)
  countryName    String?  @map("country_name") @db.VarChar(100)
  city           String?  @db.VarChar(100)
  region         String?  @db.VarChar(100)
  browser        String?  @db.VarChar(50)
  browserVersion String?  @map("browser_version") @db.VarChar(20)
  os             String?  @db.VarChar(50)
  osVersion      String?  @map("os_version") @db.VarChar(20)
  deviceType     String?  @map("device_type") @db.VarChar(20)
  clickedAt      DateTime @default(now()) @map("clicked_at")
  
  link           Link     @relation(fields: [linkId], references: [id], onDelete: Cascade)
  
  @@map("clicks")
  @@index([linkId])
  @@index([clickedAt(sort: Desc)])
  @@index([countryCode])
}

model PasswordReset {
  id        BigInt   @id @default(autoincrement())
  userId    BigInt   @map("user_id")
  token     String   @unique @db.VarChar(255)
  used      Boolean  @default(false)
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("password_resets")
  @@index([token])
  @@index([expiresAt])
}

model Session {
  id           BigInt   @id @default(autoincrement())
  userId       BigInt   @map("user_id")
  token        String   @unique @db.VarChar(255)
  refreshToken String?  @unique @map("refresh_token") @db.VarChar(255)
  ipAddress    String?  @map("ip_address") @db.Inet
  userAgent    String?  @map("user_agent")
  expiresAt    DateTime @map("expires_at")
  createdAt    DateTime @default(now()) @map("created_at")
  
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
  @@index([token])
  @@index([userId])
  @@index([expiresAt])
}
```

## 6. Оптимізації для продуктивності

### Індекси
- Всі foreign keys автоматично індексуються
- Композитні індекси для частих запитів
- Partial індекси для фільтрованих запитів

### Партиціонування (Phase 2)
- Таблиця `clicks` по місяцях
- Автоматичне створення нових партицій

### Статистика
```sql
-- Оновлення статистики для query planner
ANALYZE users;
ANALYZE links;
ANALYZE clicks;

-- Автоматичний VACUUM
ALTER TABLE clicks SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE links SET (autovacuum_analyze_scale_factor = 0.05);
```

## 7. Backup та міграції

### Backup стратегія
```bash
# Daily backup
pg_dump -h localhost -U postgres -d urlshortener > backup_$(date +%Y%m%d).sql

# Backup with compression
pg_dump -h localhost -U postgres -d urlshortener -Fc > backup_$(date +%Y%m%d).dump
```

### Міграції через Prisma
```bash
# Створення міграції
npx prisma migrate dev --name init

# Застосування міграцій
npx prisma migrate deploy

# Генерація клієнта
npx prisma generate
```

## 8. Моніторинг БД

### Ключові метрики
```sql
-- Розмір таблиць
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Активні з'єднання
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT 
    query,
    calls,
    mean_exec_time,
    total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```