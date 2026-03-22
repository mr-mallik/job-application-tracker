/**
 * Test helpers and utilities
 * Shared functions for use across test files
 */

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockRequest(url, options = {}) {
  const { method = 'GET', body = null, headers = {} } = options;

  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  return new Request(url, requestOptions);
}

/**
 * Create a mock authenticated request with Bearer token
 */
export function createAuthRequest(url, token, options = {}) {
  return createMockRequest(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Mock user data factory
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    isVerified: true,
    AI_enabled: 'YES',
    ...overrides,
  };
}

/**
 * Mock job data factory
 */
export function createMockJob(overrides = {}) {
  return {
    id: 'test-job-id',
    userId: 'test-user-id',
    title: 'Software Engineer',
    company: 'Test Company',
    location: 'Remote',
    status: 'saved',
    closingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    reminder: {
      enabled: true,
      daysBefore: 7,
    },
    ...overrides,
  };
}

/**
 * Wait for async operations
 */
export function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Example usage in tests:
 *
 * import { createMockRequest, createMockUser } from '@/tests/helpers'
 *
 * const request = createMockRequest('http://localhost:3000/api/test', {
 *   method: 'POST',
 *   body: { data: 'test' }
 * })
 *
 * const user = createMockUser({ email: 'custom@test.com' })
 */
