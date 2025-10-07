# Backend Testing Guide

## Overview

All backend tests are **pure unit tests** with mocked dependencies. No database or external services required.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
backend/src/
├── services/__tests__/
│   └── linkService.test.ts      # Link service unit tests
├── test/
│   ├── setup.ts                 # Test environment setup
│   ├── mocks/
│   │   └── prisma.ts            # Mocked Prisma client
│   └── README.md                # This file
```

## Test Strategy

### Unit Tests Only
- Test individual service methods in isolation
- **All dependencies are mocked** (Prisma, JWT utilities, etc.)
- No database required
- Fast execution (< 5 seconds)

### What's Mocked

**Prisma Client:**
- All database operations mocked via `mockPrismaClient`
- Located in `test/mocks/prisma.ts`
- Automatically reset between tests

**External Utilities:**
- URL validation and generation (`urlUtils`)
- JWT token handling (`jwtUtils`)

## Writing New Tests

### Service Test Example

```typescript
import { LinkService } from '../linkService';
import { mockPrismaClient, resetMocks } from '../../test/mocks/prisma';
import * as urlUtils from '../../utils/urlUtils';

jest.mock('../../config/database', () => mockPrismaClient);
jest.mock('../../utils/urlUtils');

describe('LinkService', () => {
  let service: LinkService;

  beforeEach(() => {
    service = new LinkService();
    resetMocks();
    jest.clearAllMocks();
  });

  it('should create a short link', async () => {
    // Setup mocks
    (urlUtils.validateUrl as jest.Mock).mockReturnValue(true);
    mockPrismaClient.link.create.mockResolvedValue({
      id: BigInt(1),
      shortCode: 'abc123',
      // ... other fields
    });

    // Execute
    const result = await service.createShortLink({
      url: 'https://example.com',
    });

    // Assert
    expect(result.shortCode).toBe('abc123');
    expect(mockPrismaClient.link.create).toHaveBeenCalled();
  });
});
```

## Coverage Goals

Target coverage: **70%** for:
- Branches
- Functions
- Lines
- Statements

## Advantages of Pure Unit Tests

✅ **No setup required** - just run `npm test`
✅ **Fast** - complete in seconds
✅ **Reliable** - no flaky tests from database state
✅ **CI/CD friendly** - no external services needed
✅ **Portable** - run anywhere, anytime

## Running in CI/CD

GitHub Actions runs tests automatically with:
- No PostgreSQL service
- No Redis service
- No migrations
- Just `npm install` and `npm test`

## Troubleshooting

### Mock not working?
Ensure the module is mocked before importing:
```typescript
jest.mock('../../config/database', () => mockPrismaClient);
```

### Tests interfering with each other?
Use `resetMocks()` in `beforeEach`:
```typescript
beforeEach(() => {
  resetMocks();
  jest.clearAllMocks();
});
```

### BigInt serialization errors?
Convert BigInt to string in test expectations:
```typescript
expect(result.id).toBe('1'); // not BigInt(1)
```
