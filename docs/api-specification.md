# API Специфікація MVP

## 1. Загальна інформація

### Base URL
```
Production: https://api.shorturl.pro
Development: http://localhost:3000/api
```

### Версіонування
API версія вказується в URL: `/api/v1/`

### Формат даних
- Request: `application/json`
- Response: `application/json`
- Encoding: `UTF-8`

### Автентифікація
JWT Bearer token в header:
```
Authorization: Bearer <token>
```

## 2. Стандарти відповідей

### Успішна відповідь
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

### Помилка
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid URL format",
    "details": [
      {
        "field": "url",
        "message": "Must be a valid HTTP/HTTPS URL"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200 OK` - Успішний запит
- `201 Created` - Ресурс створено
- `204 No Content` - Успішно, без контенту
- `400 Bad Request` - Невалідний запит
- `401 Unauthorized` - Неавторизований
- `403 Forbidden` - Заборонено
- `404 Not Found` - Не знайдено
- `429 Too Many Requests` - Rate limit
- `500 Internal Server Error` - Помилка сервера

## 3. Endpoints

### 3.1 Публічні endpoints (без автентифікації)

#### POST /api/v1/shorten
Створити коротке посилання (анонімно).

**Request:**
```json
{
  "url": "https://example.com/very/long/url/that/needs/shortening"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "abc123def",
    "shortCode": "xY3kL9",
    "shortUrl": "https://short.ly/xY3kL9",
    "originalUrl": "https://example.com/very/long/url/that/needs/shortening",
    "qrCode": "data:image/png;base64,iVBORw0...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400` - Invalid URL format
- `429` - Rate limit exceeded

#### GET /api/v1/links/:shortCode
Отримати інформацію про посилання.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shortCode": "xY3kL9",
    "originalUrl": "https://example.com/...",
    "clickCount": 150,
    "createdAt": "2024-01-15T10:30:00Z",
    "isActive": true
  }
}
```

**Errors:**
- `404` - Link not found

#### GET /api/v1/links/:shortCode/stats
Базова статистика посилання.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "shortCode": "xY3kL9",
    "clickCount": 150,
    "uniqueClicks": 89,
    "lastClickedAt": "2024-01-15T09:15:00Z",
    "topCountries": [
      {"country": "US", "clicks": 45},
      {"country": "UA", "clicks": 30},
      {"country": "DE", "clicks": 20}
    ],
    "clicksByDay": [
      {"date": "2024-01-15", "clicks": 25},
      {"date": "2024-01-14", "clicks": 30}
    ]
  }
}
```

### 3.2 Автентифікація

#### POST /api/v1/auth/register
Реєстрація нового користувача.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 12345,
      "email": "user@example.com",
      "fullName": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

**Validation:**
- Email: valid format, unique
- Password: min 8 chars, 1 uppercase, 1 number, 1 special char
- Full name: max 255 chars

**Errors:**
- `400` - Validation error
- `409` - Email already exists

#### POST /api/v1/auth/login
Вхід в систему.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 12345,
      "email": "user@example.com",
      "fullName": "John Doe"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 3600
    }
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account disabled

#### POST /api/v1/auth/refresh
Оновити access token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

#### POST /api/v1/auth/logout
Вихід з системи.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204):**
No content

#### POST /api/v1/auth/forgot-password
Запит на відновлення паролю.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

#### POST /api/v1/auth/reset-password
Скидання паролю.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset"
  }
}
```

### 3.3 Захищені endpoints (потребують автентифікації)

#### GET /api/v1/user/profile
Отримати профіль користувача.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "email": "user@example.com",
    "fullName": "John Doe",
    "linksCount": 42,
    "totalClicks": 1250,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT /api/v1/user/profile
Оновити профіль.

**Request:**
```json
{
  "fullName": "John Smith",
  "email": "newemail@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "email": "newemail@example.com",
    "fullName": "John Smith"
  }
}
```

#### POST /api/v1/links
Створити посилання (авторизований).

**Request:**
```json
{
  "url": "https://example.com/page",
  "title": "My Page",
  "description": "Description of the page"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 67890,
    "shortCode": "aB3cD5",
    "shortUrl": "https://short.ly/aB3cD5",
    "originalUrl": "https://example.com/page",
    "title": "My Page",
    "description": "Description of the page",
    "userId": 12345,
    "clickCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET /api/v1/links
Отримати список посилань користувача.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `sort` (createdAt, clickCount, default: -createdAt)
- `search` - пошук по URL або title
- `active` - фільтр по статусу (true/false)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": 67890,
        "shortCode": "aB3cD5",
        "shortUrl": "https://short.ly/aB3cD5",
        "originalUrl": "https://example.com/page",
        "title": "My Page",
        "clickCount": 150,
        "lastClickedAt": "2024-01-15T09:00:00Z",
        "isActive": true,
        "createdAt": "2024-01-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "pages": 3
    }
  }
}
```

#### GET /api/v1/links/:id
Детальна інформація про посилання.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 67890,
    "shortCode": "aB3cD5",
    "shortUrl": "https://short.ly/aB3cD5",
    "originalUrl": "https://example.com/page",
    "title": "My Page",
    "description": "Description",
    "clickCount": 150,
    "uniqueClickCount": 89,
    "lastClickedAt": "2024-01-15T09:00:00Z",
    "isActive": true,
    "createdAt": "2024-01-10T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### PUT /api/v1/links/:id
Оновити посилання.

**Request:**
```json
{
  "originalUrl": "https://newexample.com/page",
  "title": "Updated Title",
  "description": "Updated description",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 67890,
    "shortCode": "aB3cD5",
    "originalUrl": "https://newexample.com/page",
    "title": "Updated Title",
    "description": "Updated description",
    "isActive": true,
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### DELETE /api/v1/links/:id
Видалити посилання.

**Response (204):**
No content

#### GET /api/v1/links/:id/analytics
Детальна аналітика посилання.

**Query Parameters:**
- `period` - 7d, 30d, 90d (default: 30d)
- `timezone` - timezone для агрегації (default: UTC)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalClicks": 500,
      "uniqueClicks": 250,
      "avgClicksPerDay": 16.7
    },
    "clicksByDate": [
      {"date": "2024-01-15", "clicks": 45, "unique": 30},
      {"date": "2024-01-14", "clicks": 38, "unique": 25}
    ],
    "clicksByHour": [
      {"hour": 0, "clicks": 5},
      {"hour": 1, "clicks": 3}
    ],
    "topCountries": [
      {"code": "US", "name": "United States", "clicks": 150, "percentage": 30},
      {"code": "UA", "name": "Ukraine", "clicks": 100, "percentage": 20}
    ],
    "topCities": [
      {"city": "New York", "country": "US", "clicks": 50},
      {"city": "Kyiv", "country": "UA", "clicks": 45}
    ],
    "devices": {
      "desktop": 300,
      "mobile": 150,
      "tablet": 50
    },
    "browsers": [
      {"name": "Chrome", "clicks": 250, "percentage": 50},
      {"name": "Safari", "clicks": 100, "percentage": 20}
    ],
    "referrers": [
      {"source": "facebook.com", "clicks": 100},
      {"source": "twitter.com", "clicks": 80},
      {"source": "direct", "clicks": 70}
    ]
  }
}
```

#### GET /api/v1/links/:id/clicks
Історія кліків.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `from` - дата початку (ISO 8601)
- `to` - дата кінця (ISO 8601)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clicks": [
      {
        "id": 12345,
        "clickedAt": "2024-01-15T10:30:00Z",
        "country": "US",
        "city": "New York",
        "browser": "Chrome",
        "os": "Windows",
        "device": "desktop",
        "referer": "facebook.com"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500
    }
  }
}
```

## 4. Rate Limiting

### Ліміти по endpoints

| Endpoint | Anonymous | Authenticated | 
|----------|-----------|---------------|
| POST /shorten | 10/hour | 100/hour |
| GET /links | - | 1000/hour |
| POST /links | - | 100/hour |
| GET /analytics | 100/hour | 1000/hour |

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642082400
```

### Rate Limit Response (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please retry after 60 seconds.",
    "retryAfter": 60
  }
}
```

## 5. Webhooks (Phase 2)

### Webhook Events
- `link.created` - Посилання створено
- `link.clicked` - Клік по посиланню
- `link.deleted` - Посилання видалено
- `link.expired` - Посилання експайрнулось

### Webhook Payload
```json
{
  "event": "link.clicked",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "linkId": 67890,
    "shortCode": "aB3cD5",
    "click": {
      "id": 12345,
      "country": "US",
      "city": "New York",
      "clickedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 6. Приклади використання

### cURL

#### Створення короткого посилання
```bash
curl -X POST https://api.shorturl.pro/api/v1/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'
```

#### Авторизація
```bash
curl -X POST https://api.shorturl.pro/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

#### Отримання списку посилань
```bash
curl -X GET https://api.shorturl.pro/api/v1/links \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### JavaScript (Axios)

```javascript
// Створення короткого посилання
const response = await axios.post('/api/v1/shorten', {
  url: 'https://example.com/long-url'
});

// Авторизація
const login = await axios.post('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Збереження токена
localStorage.setItem('token', login.data.data.tokens.accessToken);

// Використання токена
const links = await axios.get('/api/v1/links', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

### Python

```python
import requests

# Створення короткого посилання
response = requests.post(
    'https://api.shorturl.pro/api/v1/shorten',
    json={'url': 'https://example.com/long-url'}
)

short_url = response.json()['data']['shortUrl']
```

## 7. Помилки та їх коди

### Коди помилок

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Невалідні дані запиту |
| `UNAUTHORIZED` | Відсутня або невалідна автентифікація |
| `FORBIDDEN` | Недостатньо прав |
| `NOT_FOUND` | Ресурс не знайдено |
| `CONFLICT` | Конфлікт даних (дублікат) |
| `RATE_LIMIT_EXCEEDED` | Перевищено ліміт запитів |
| `INTERNAL_ERROR` | Внутрішня помилка сервера |
| `SERVICE_UNAVAILABLE` | Сервіс тимчасово недоступний |

## 8. Changelog

### Version 1.0.0 (MVP)
- Initial release
- Basic URL shortening
- User authentication
- Basic analytics
- Dashboard functionality