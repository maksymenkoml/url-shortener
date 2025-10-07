# Frontend Testing Guide

## Setup

Tests are configured with Vitest and React Testing Library.

### Prerequisites

- Node.js 20+
- npm dependencies installed

## Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

```
frontend/src/
├── components/__tests__/
│   └── UrlShortener.test.tsx    # URL shortener component tests
├── context/__tests__/
│   └── AuthContext.test.tsx     # Auth context tests
├── utils/__tests__/
│   └── validation.test.ts       # Validation utilities tests
└── test/
    ├── setup.ts                 # Test environment setup
    └── README.md                # This file
```

## Test Configuration

Vitest is configured in `vitest.config.ts`:
- Environment: jsdom (browser-like)
- Setup file: `src/test/setup.ts`
- Coverage provider: v8
- CSS support enabled

## Writing Tests

### Component Tests Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(
      <BrowserRouter>
        <MyComponent />
      </BrowserRouter>
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing with AuthContext

```typescript
import { AuthProvider } from '../../context/AuthContext';

const renderWithAuth = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};
```

### Mocking API Calls

```typescript
import { vi } from 'vitest';
import * as api from '../../api/client';

vi.mock('../../api/client');

it('should call API', async () => {
  vi.mocked(api.createShortLink).mockResolvedValue({
    data: { shortCode: 'abc123' }
  });

  // Test code here
});
```

## Testing Best Practices

1. **Use Testing Library queries in priority order:**
   - getByRole (most accessible)
   - getByLabelText
   - getByPlaceholderText
   - getByText
   - getByTestId (last resort)

2. **Wait for async updates:**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

3. **Clean up after tests:**
   - Automatic via `cleanup()` in setup.ts

4. **Mock external dependencies:**
   - API calls
   - Router navigation
   - Browser APIs

## Coverage Goals

Coverage is configured to track:
- All `src/**` files except:
  - node_modules
  - test directories
  - .d.ts files
  - config files
  - main.tsx

## Common Issues

### Tests not finding elements
- Check if component is wrapped with required providers
- Use `screen.debug()` to see rendered output

### Async issues
- Use `waitFor` for async state updates
- Use `findBy*` queries which wait automatically

### Mock issues
- Clear mocks between tests with `vi.clearAllMocks()`
- Verify mock is called with correct arguments
