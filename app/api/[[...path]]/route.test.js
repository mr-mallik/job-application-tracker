/**
 * @jest-environment node
 */

import { POST } from '@/app/api/[[...path]]/route';
import { createMocks } from 'node-mocks-http';

// Mock MongoDB
jest.mock('mongodb', () => ({
  MongoClient: jest.fn(() => ({
    connect: jest.fn(),
    db: jest.fn(() => ({
      collection: jest.fn((name) => {
        // Mock collections
        if (name === 'jobs') {
          return {
            find: jest.fn(() => ({
              toArray: jest.fn(() => Promise.resolve([])),
            })),
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

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(() => Promise.resolve({ messageId: 'test-id' })),
  })),
}));

describe('/api/reminders/check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept POST requests', async () => {
    const { req } = createMocks({
      method: 'POST',
      url: '/api/reminders/check',
    });

    // Create NextRequest from mock
    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
      headers: req.headers,
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });

    expect(response.status).toBe(200);
  });

  it('should return valid response structure', async () => {
    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });
    const data = await response.json();

    // Check required fields
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('remindersSent');
    expect(data).toHaveProperty('reminders');

    // Check field types
    expect(typeof data.success).toBe('boolean');
    expect(typeof data.remindersSent).toBe('number');
    expect(Array.isArray(data.reminders)).toBe(true);
  });

  it('should have remindersSent count match reminders array length', async () => {
    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });
    const data = await response.json();

    expect(data.remindersSent).toBe(data.reminders.length);
  });

  it('should set success to true when no errors occur', async () => {
    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });
    const data = await response.json();

    expect(data.success).toBe(true);
  });

  it('should include CORS headers', async () => {
    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
  });

  it('should validate reminder object structure when reminders exist', async () => {
    // Mock jobs collection to return a job with reminder
    const mongodb = require('mongodb');
    const mockDate = new Date();
    mockDate.setDate(mockDate.getDate() + 1); // Tomorrow

    mongodb.MongoClient.mockImplementation(() => ({
      connect: jest.fn(),
      db: jest.fn(() => ({
        collection: jest.fn((name) => {
          if (name === 'jobs') {
            return {
              find: jest.fn(() => ({
                toArray: jest.fn(() =>
                  Promise.resolve([
                    {
                      id: 'test-job-id',
                      userId: 'test-user-id',
                      title: 'Test Job',
                      company: 'Test Company',
                      closingDate: mockDate.toISOString().split('T')[0],
                      reminder: {
                        enabled: true,
                        daysBefore: 1,
                      },
                    },
                  ])
                ),
              })),
            };
          }
          if (name === 'users') {
            return {
              findOne: jest.fn(() =>
                Promise.resolve({
                  id: 'test-user-id',
                  email: 'test@example.com',
                  name: 'Test User',
                })
              ),
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
    }));

    const nextRequest = new Request('http://localhost:3000/api/reminders/check', {
      method: 'POST',
    });

    const response = await POST(nextRequest, { params: { path: ['reminders', 'check'] } });
    const data = await response.json();

    if (data.reminders.length > 0) {
      const reminder = data.reminders[0];

      // Check reminder object structure
      expect(reminder).toHaveProperty('jobId');
      expect(reminder).toHaveProperty('jobTitle');
      expect(reminder).toHaveProperty('company');
      expect(reminder).toHaveProperty('daysUntilDeadline');
      expect(reminder).toHaveProperty('userEmail');
    }
  });
});
