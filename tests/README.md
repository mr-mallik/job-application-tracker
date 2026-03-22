# Test Suite

This directory contains tests for the Job Application Tracker API.

## Testing Framework

This project uses **Jest** with **@testing-library/react** for unit and integration tests.

## Reminder Check Tests

Tests for the `/api/reminders/check` endpoint are located in:

- **Unit tests**: `app/api/[[...path]]/route.test.js` - Jest-based unit tests
- **Integration tests**: `tests/test_reminder_check.js` - Live API integration tests

### What Is Tested

#### Unit Tests (Jest)

- ✅ Endpoint accepts POST requests
- ✅ Returns correct response structure (`success`, `remindersSent`, `reminders`)
- ✅ Field types are valid
- ✅ `remindersSent` count matches the reminders array length
- ✅ CORS headers are present
- ✅ Reminder objects have required fields when present
- ✅ Success flag is set correctly

#### Integration Tests

- ✅ Live endpoint connectivity
- ✅ Real database interaction
- ✅ Actual email sending (when configured)

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

Automatically re-runs tests when files change:

```bash
npm run test:watch
```

### Run with Coverage Report

```bash
npm run test:coverage
```

### Run Specific Test Suites

**Unit tests for reminder endpoint:**

```bash
npm run test:reminders
```

**Live integration test:**

```bash
npm run test:integration
```

## Test Structure

```
job-application-tracker/
├── app/
│   └── api/
│       └── [[...path]]/
│           ├── route.js           # API implementation
│           └── route.test.js      # Unit tests
├── tests/
│   ├── test_reminder_check.js     # Integration test
│   └── README.md                  # This file
├── jest.config.js                 # Jest configuration
└── jest.setup.js                  # Test setup
```

## Writing New Tests

### Unit Test Example

Create a file with `.test.js` or `.spec.js` extension:

```javascript
describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### API Route Test Example

```javascript
/**
 * @jest-environment node
 */

import { POST } from '@/app/api/[[...path]]/route';

describe('/api/my-endpoint', () => {
  it('should return 200', async () => {
    const request = new Request('http://localhost:3000/api/my-endpoint', {
      method: 'POST',
    });

    const response = await POST(request, { params: { path: ['my-endpoint'] } });

    expect(response.status).toBe(200);
  });
});
```

## Expected Output

### Unit Tests (Jest)

```
 PASS  app/api/[[...path]]/route.test.js
  /api/reminders/check
    ✓ should accept POST requests (45ms)
    ✓ should return valid response structure (12ms)
    ✓ should have remindersSent count match reminders array length (8ms)
    ✓ should set success to true when no errors occur (7ms)
    ✓ should include CORS headers (6ms)
    ✓ should validate reminder object structure when reminders exist (15ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        2.456s
```

### Integration Tests

```
╔════════════════════════════════════════════════════════════╗
║         Reminder Check Endpoint Test Suite                ║
╚════════════════════════════════════════════════════════════╝

API URL: http://localhost:3000/api/reminders/check

🧪 Test: Endpoint accepts POST method
────────────────────────────────────────────────────────────
✅ POST method accepted

📊 Results:
   Reminders sent: 0
   Errors: 0
   Success: true

✅ TEST PASSED
```

## Troubleshooting

### MongoDB Connection Errors

If tests fail with MongoDB errors:

- Ensure `MONGO_URL` is set in `.env.local`
- The tests use mocked MongoDB by default for unit tests
- Integration tests require a running MongoDB instance

### Module Resolution Errors

If you see import errors:

```bash
# Clear Jest cache
npx jest --clearCache

# Reinstall dependencies
npm install
```

### Test Timeout

For slow operations, increase timeout:

```javascript
it('should complete slow operation', async () => {
  // ... test code
}, 10000); // 10 second timeout
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  run: npm run test:coverage
```

## Coverage Goals

- Unit tests: Aim for >80% coverage on critical paths
- API routes: Test all endpoints and error cases
- Integration: Validate end-to-end workflows
