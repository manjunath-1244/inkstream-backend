import { test, expect } from '@playwright/test';

// Generate unique suffix for each test run to avoid unique constraint errors
const uniqueId = Date.now().toString();
const testUser = {
  email: `testuser_${uniqueId}@example.com`,
  username: `testuser_${uniqueId}`,
  password: 'StrongPassword123!',
  displayName: 'Test User'
};

let accessToken: string;
let refreshToken: string;

test.describe('Auth API', () => {
  test.describe.configure({ mode: 'serial' }); // Run these tests sequentially since they depend on state

  test('POST /auth/register should create a new user', async ({ request }) => {
    const response = await request.post('/auth/register', {
      data: testUser
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.username).toBe(testUser.username);
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    
    // Save tokens for subsequent tests
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test('POST /auth/login should authenticate user and return tokens', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    
    // Update tokens with the latest ones
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test('GET /auth/me should return current user profile using JWT', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.email).toBe(testUser.email);
    expect(body.id).toBeDefined();
  });

  test('POST /auth/refresh should issue new tokens', async ({ request }) => {
    const response = await request.post('/auth/refresh', {
      data: {
        refreshToken: refreshToken
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    
    accessToken = body.accessToken;
    refreshToken = body.refreshToken;
  });

  test('POST /auth/logout should invalidate the refresh token', async ({ request }) => {
    const response = await request.post('/auth/logout', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: {
        refreshToken: refreshToken
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    // Try refreshing again, it should fail now
    const refreshResponse = await request.post('/auth/refresh', {
      data: {
        refreshToken: refreshToken
      }
    });
    
    expect(refreshResponse.status()).toBe(401);
  });
});
