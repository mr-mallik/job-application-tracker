# Jest Testing Setup - Quick Start Guide

## ✅ What Was Configured

You now have a complete Jest testing framework set up following JavaScript best practices!

### Installed Packages

- **jest** - Test runner
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom DOM matchers
- **jest-environment-jsdom** - Browser-like environment for tests
- **node-mocks-http** - HTTP request/response mocking

### Configuration Files

- **jest.config.js** - Main Jest configuration
- **jest.setup.js** - Global test setup and environment variables

### Test Files Created

- **app/api/[[...path]]/route.test.js** - Reminder endpoint unit tests (6 tests)
- **lib/utils.test.js** - Example for testing utility functions
- **tests/helpers.js** - Reusable test helper functions

## 🚀 Quick Start

### Run all tests

```bash
npm test
```

### Run tests in watch mode (auto-re-run on file changes)

```bash
npm run test:watch
```

### Run tests with coverage report

```bash
npm run test:coverage
```

### Run specific test file

```bash
npm test -- route.test.js
```

### Run tests matching a pattern

```bash
npm test -- --testPathPattern=api
```

## 📝 Test Results

The reminder check endpoint tests are currently passing:

```
 PASS  app/api/[[...path]]/route.test.js
  /api/reminders/check
    ✓ should accept POST requests (11 ms)
    ✓ should return valid response structure (3 ms)
    ✓ should have remindersSent count match reminders array length (2 ms)
    ✓ should set success to true when no errors occur (1 ms)
    ✓ should include CORS headers (2 ms)
    ✓ should validate reminder object structure when reminders exist (1 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

## ✍️ Writing Tests - Examples

### 1. API Route Test

```javascript
/**
 * @jest-environment node
 */
import { POST } from '@/app/api/[[...path]]/route';

describe('/api/my-endpoint', () => {
  it('should return success', async () => {
    const request = new Request('http://localhost:3000/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' }),
    });

    const response = await POST(request, { params: { path: ['my-endpoint'] } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('success');
  });
});
```

### 2. Utility Function Test

```javascript
import { myFunction } from '@/lib/myLib';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### 3. Using Test Helpers

```javascript
import { createMockRequest, createMockUser } from '@/tests/helpers';

describe('My Test', () => {
  it('should use mock data', () => {
    const user = createMockUser({ email: 'custom@test.com' });
    const request = createMockRequest('http://localhost:3000/api/test');

    expect(user.email).toBe('custom@test.com');
  });
});
```

### 4. Testing with Mock MongoDB

```javascript
// MongoDB is automatically mocked in route.test.js
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => ({
    connect: jest.fn(),
    db: jest.fn(() => ({
      collection: jest.fn(() => ({
        find: jest.fn(() => ({
          toArray: jest.fn(() => Promise.resolve([])),
        })),
      })),
    })),
  })),
}));
```

## 🎯 Common Commands

| Command                     | Description              |
| --------------------------- | ------------------------ |
| `npm test`                  | Run all tests once       |
| `npm run test:watch`        | Run tests in watch mode  |
| `npm run test:coverage`     | Generate coverage report |
| `npm test -- route.test.js` | Run specific file        |
| `npm test -- --verbose`     | Run with detailed output |
| `npm test -- --silent`      | Run with minimal output  |

## 📊 Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **coverage/lcov-report/index.html** - Visual HTML report (open in browser)
- **coverage/coverage-summary.json** - JSON summary
- **coverage/lcov.info** - LCOV format for CI tools

View coverage in browser:

```bash
npm run test:coverage
# Then open: coverage/lcov-report/index.html
```

## 🔧 Troubleshooting

### Jest can't find modules

```bash
# Clear cache
npx jest --clearCache
```

### Tests timeout

```javascript
it('long running test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Skip a test

```javascript
it.skip('not ready yet', () => {
  // This test will be skipped
});
```

### Run only one test

```javascript
it.only('focus on this', () => {
  // Only this test will run
});
```

## 📁 Project Structure

```
job-application-tracker/
├── app/
│   └── api/
│       └── [[...path]]/
│           ├── route.js           # API implementation
│           └── route.test.js      # Unit tests ✅
├── lib/
│   ├── utils.js
│   └── utils.test.js              # Utility tests ✅
├── tests/
│   ├── helpers.js                 # Shared test utilities ✅
│   ├── test_reminder_check.js     # Integration test
│   └── README.md                  # Test documentation
├── coverage/                       # Generated (gitignored)
├── jest.config.js                 # Jest config ✅
├── jest.setup.js                  # Test setup ✅
└── package.json                   # Test scripts ✅
```

## 🎓 Next Steps

1. **Add more tests** - Create `.test.js` files next to your code
2. **Set coverage goals** - Aim for 80%+ on critical paths
3. **CI Integration** - Add `npm test` to your CI pipeline
4. **Test before commits** - Add to git hooks with Husky

## 📚 Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing/jest)

---

**All tests are passing! ✅** You can now write and run tests using standard JavaScript testing practices.
