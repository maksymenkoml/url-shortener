# Безпека системи MVP

## 1. Загальні принципи безпеки

### Defense in Depth
Багаторівневий захист на всіх рівнях системи:
- Network layer (firewall, DDoS protection)
- Application layer (authentication, authorization)
- Data layer (encryption, hashing)
- Infrastructure layer (secure configuration)

### Security by Design
- Принцип найменших привілеїв
- Безпечні значення за замовчуванням
- Валідація всіх вхідних даних
- Аудит та логування критичних операцій

## 2. Автентифікація та авторизація

### 2.1 JWT (JSON Web Tokens)

#### Структура токена
```javascript
// Payload structure
{
  "sub": "user_id_12345",        // Subject (user ID)
  "email": "user@example.com",
  "iat": 1642082400,             // Issued at
  "exp": 1642086000,             // Expiration (1 hour)
  "jti": "unique_token_id",      // JWT ID for revocation
  "type": "access"                // Token type
}
```

#### Конфігурація
```javascript
// JWT Configuration
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET, // Min 32 characters
    expiresIn: '1h',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET, // Different from access
    expiresIn: '7d',
  },
  algorithm: 'HS256',
};
```

#### Token Refresh Strategy
1. Access token: 1 година
2. Refresh token: 7 днів
3. Refresh rotation: новий refresh token при кожному оновленні
4. Blacklist для revoked tokens

### 2.2 Хешування паролів

#### Bcrypt Configuration
```javascript
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12; // 2^12 iterations

// Hashing
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verification
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
```

#### Password Policy
- Мінімум 8 символів
- Мінімум 1 велика літера
- Мінімум 1 цифра
- Мінімум 1 спеціальний символ
- Не більше 128 символів
- Перевірка на common passwords

```javascript
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .messages({
    'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
  });
```

### 2.3 Session Management

#### Redis Session Store
```javascript
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',
    ttl: 3600, // 1 hour
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 3600000, // 1 hour
    sameSite: 'strict'
  }
}));
```

## 3. Захист від атак

### 3.1 SQL Injection

#### Prisma ORM Protection
```javascript
// SAFE - Parameterized query
const user = await prisma.user.findUnique({
  where: { email: userInput }
});

// UNSAFE - Raw query (avoid!)
// const user = await prisma.$queryRawUnsafe(
//   `SELECT * FROM users WHERE email = '${userInput}'`
// );

// If raw query needed - use parameterized
const user = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

### 3.2 XSS (Cross-Site Scripting)

#### Content Security Policy
```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));
```

#### Input Sanitization
```javascript
const DOMPurify = require('isomorphic-dompurify');

function sanitizeInput(input) {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}
```

### 3.3 CSRF (Cross-Site Request Forgery)

#### CSRF Tokens
```javascript
const csrf = require('csurf');

const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict'
  }
});

app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

### 3.4 Rate Limiting

#### Configuration
```javascript
const rateLimit = require('express-rate-limit');

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
});

// URL creation limit
const createLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 links per hour for authenticated
  skip: (req) => req.user?.isPremium,
});

// Anonymous limit
const anonymousLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // 10 links per hour for anonymous
});
```

### 3.5 DDoS Protection

#### Cloudflare Configuration
- Rate limiting rules
- Challenge suspicious traffic
- Block known attack patterns
- Geographic restrictions if needed

#### Application Level
```javascript
// Request size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Timeout handling
const timeout = require('connect-timeout');
app.use(timeout('5s'));
```

## 4. Безпека даних

### 4.1 Encryption at Rest

#### Database Encryption
```sql
-- PostgreSQL Transparent Data Encryption (TDE)
-- Configured at infrastructure level
```

#### Environment Variables
```bash
# .env.production
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=your-256-bit-secret-key-here
ENCRYPTION_KEY=another-256-bit-key-for-sensitive-data
```

### 4.2 Encryption in Transit

#### TLS/SSL Configuration
```javascript
// Force HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### 4.3 Sensitive Data Handling

#### PII Anonymization
```javascript
// Hash IP addresses for GDPR compliance
const crypto = require('crypto');

function hashIP(ip) {
  const salt = process.env.IP_HASH_SALT;
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

// Store only hash, not actual IP
await prisma.click.create({
  data: {
    ipHash: hashIP(req.ip),
    // Not storing: ipAddress: req.ip
  }
});
```

## 5. Валідація та санітизація

### 5.1 Input Validation

#### URL Validation
```javascript
const urlSchema = Joi.string()
  .uri({
    scheme: ['http', 'https'],
    allowRelative: false,
    allowQuerySquareBrackets: true,
  })
  .max(2048)
  .required();

// Additional checks
function validateURL(url) {
  try {
    const parsed = new URL(url);
    
    // Block internal IPs
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.')) {
      return false;
    }
    
    // Block certain protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
```

#### Malicious URL Detection
```javascript
// Check against known phishing/malware databases
const MALWARE_DOMAINS = new Set([
  // Load from threat intelligence feeds
]);

async function checkMaliciousURL(url) {
  const domain = new URL(url).hostname;
  
  // Check blacklist
  if (MALWARE_DOMAINS.has(domain)) {
    return true;
  }
  
  // Google Safe Browsing API (Phase 2)
  // const isMalicious = await checkGoogleSafeBrowsing(url);
  
  return false;
}
```

### 5.2 Output Encoding

```javascript
// HTML encoding for user-generated content
function encodeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
```

## 6. Аудит та логування

### 6.1 Security Events Logging

```javascript
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ 
      filename: 'security.log',
      level: 'warning'
    }),
  ],
});

// Log security events
function logSecurityEvent(event, userId, details) {
  securityLogger.warn({
    event,
    userId,
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
    ...details
  });
}

// Usage
logSecurityEvent('FAILED_LOGIN', email, {
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  reason: 'Invalid password'
});
```

### 6.2 Audit Trail

```javascript
// Critical operations audit
const auditEvents = [
  'USER_REGISTRATION',
  'USER_LOGIN',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'LINK_CREATED',
  'LINK_DELETED',
  'ACCOUNT_DELETED'
];

async function createAuditLog(event, userId, metadata) {
  await prisma.auditLog.create({
    data: {
      event,
      userId,
      metadata: JSON.stringify(metadata),
      timestamp: new Date(),
      ip: metadata.ip
    }
  });
}
```

## 7. GDPR Compliance

### 7.1 Privacy by Design

```javascript
// Data minimization
const userPublicFields = [
  'id',
  'email',
  'fullName',
  'createdAt'
];

// Don't expose sensitive data
function sanitizeUser(user) {
  return pick(user, userPublicFields);
}
```

### 7.2 Right to be Forgotten

```javascript
async function deleteUserData(userId) {
  // Anonymize rather than delete for statistics
  await prisma.link.updateMany({
    where: { userId },
    data: { 
      userId: null,
      // Keep aggregated stats
    }
  });
  
  // Delete personal data
  await prisma.user.delete({
    where: { id: userId }
  });
  
  // Clear from cache
  await redis.del(`user:${userId}:*`);
}
```

### 7.3 Data Export

```javascript
async function exportUserData(userId) {
  const userData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      links: true,
      sessions: true
    }
  });
  
  return {
    profile: sanitizeUser(userData),
    links: userData.links.map(link => ({
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      createdAt: link.createdAt,
      clicks: link.clickCount
    })),
    exportedAt: new Date().toISOString()
  };
}
```

## 8. Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional headers
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});
```

## 9. Dependency Security

### 9.1 Vulnerability Scanning

```bash
# npm audit
npm audit
npm audit fix

# Snyk
npx snyk test
npx snyk monitor

# GitHub Dependabot
# Configure in .github/dependabot.yml
```

### 9.2 Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "daily"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
```

## 10. Incident Response Plan

### 10.1 Security Incident Types
1. Data breach
2. DDoS attack
3. Malicious URL spreading
4. Account takeover
5. SQL injection attempt

### 10.2 Response Steps
1. **Detect** - Monitoring and alerts
2. **Contain** - Isolate affected systems
3. **Investigate** - Analyze logs and impact
4. **Remediate** - Fix vulnerability
5. **Recover** - Restore normal operations
6. **Review** - Post-incident analysis

### 10.3 Contact Points
- Security Team: security@urlshortener.com
- DPO (Data Protection Officer): dpo@urlshortener.com
- Incident Hotline: +1-xxx-xxx-xxxx

## 11. Security Checklist для Deployment

### Pre-deployment
- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Error messages sanitized
- [ ] Logging configured
- [ ] Backup strategy tested

### Post-deployment
- [ ] SSL certificate valid
- [ ] Security scan passed
- [ ] Penetration testing scheduled
- [ ] Monitoring alerts active
- [ ] Incident response plan shared