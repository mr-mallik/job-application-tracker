/**
 * @jest-environment node
 */

import { POST } from '@/app/api/[[...path]]/route';

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => ({
    connect: jest.fn(),
    db: jest.fn(() => ({
      collection: jest.fn((name) => {
        if (name === 'users') {
          return {
            find: jest.fn(() => ({
              toArray: jest.fn(() =>
                Promise.resolve([
                  {
                    id: 'test-user',
                    email: 'test@example.com',
                    name: 'Test User',
                    autoJobSearchEnabled: true,
                    jobSearchKeywords: ['React Developer', 'Full Stack'],
                  },
                ])
              ),
            })),
          };
        }
        if (name === 'discovered_jobs') {
          return {
            findOne: jest.fn(() => Promise.resolve(null)),
            insertOne: jest.fn(() => Promise.resolve({ insertedId: 'test-id' })),
            updateMany: jest.fn(() => Promise.resolve({ modifiedCount: 1 })),
            find: jest.fn(() => ({
              sort: jest.fn(() => ({
                limit: jest.fn(() => ({
                  toArray: jest.fn(() => Promise.resolve([])),
                })),
              })),
            })),
            deleteOne: jest.fn(() => Promise.resolve({ deletedCount: 1 })),
          };
        }
        return {
          findOne: jest.fn(),
          find: jest.fn(() => ({
            toArray: jest.fn(() => Promise.resolve([])),
          })),
        };
      }),
    })),
  })),
}));

// Mock scraper
jest.mock('@/lib/scraper', () => ({
  scrapeWithPlaywright: jest.fn(() =>
    Promise.resolve({
      html: '<html><body>Test job listing</body></html>',
      visibleText: 'Software Engineer at Test Company',
    })
  ),
  parseWithCheerio: jest.fn(() => ({})),
}));

// Mock Gemini AI
jest.mock('@/lib/gemini', () => ({
  generateWithFallback: jest.fn(() =>
    Promise.resolve(
      JSON.stringify([
        {
          title: 'Senior React Developer',
          company: 'Tech Corp',
          location: 'Remote',
          url: 'https://example.com/job',
          description: 'Exciting opportunity',
          salary: '$80k-120k',
        },
      ])
    )
  ),
}));

// Mock email
jest.mock('@/lib/auth', () => ({
  getUserFromToken: jest.fn(() =>
    Promise.resolve({
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
    })
  ),
  sendEmail: jest.fn(() => Promise.resolve()),
}));

// Import GET handler
import { GET } from '@/app/api/[[...path]]/route';

describe('/api/jobs/discover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept POST requests', async () => {
    const nextRequest = new Request('http://localhost:3000/api/jobs/discover', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['jobs', 'discover'] } });

    expect(response.status).toBe(200);
  }, 30000); // 30 second timeout for slow operations

  it('should return success summary', async () => {
    const nextRequest = new Request('http://localhost:3000/api/jobs/discover', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['jobs', 'discover'] } });
    const data = await response.json();

    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('summary');
    expect(data.success).toBe(true);
  }, 30000); // 30 second timeout for slow operations

  it('should have valid summary structure', async () => {
    const nextRequest = new Request('http://localhost:3000/api/jobs/discover', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['jobs', 'discover'] } });
    const data = await response.json();

    expect(data.summary).toHaveProperty('totalUsers');
    expect(data.summary).toHaveProperty('usersProcessed');
    expect(data.summary).toHaveProperty('totalJobsDiscovered');
    expect(data.summary).toHaveProperty('emailsSent');
  }, 30000); // 30 second timeout for slow operations
});

describe('/api/jobs/discovered', () => {
  it('should require authentication', async () => {
    const nextRequest = new Request('http://localhost:3000/api/jobs/discovered', {
      method: 'GET',
    });

    const response = await GET(nextRequest, { params: { path: ['jobs', 'discovered'] } });

    expect(response.status).toBe(401);
  });

  it('should return discovered jobs for authenticated user', async () => {
    const nextRequest = new Request('http://localhost:3000/api/jobs/discovered', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer test-token',
      },
    });

    const response = await GET(nextRequest, { params: { path: ['jobs', 'discovered'] } });
    const data = await response.json();

    expect(data).toHaveProperty('jobs');
    expect(Array.isArray(data.jobs)).toBe(true);
  });
});
