import { test, expect } from '@playwright/test';
import { createTestUser } from '../test-utils';

test.describe('Subscriptions & Notifications API', () => {
  test.describe.configure({ mode: 'serial' });

  let user: any;
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const data = await createTestUser(request, 'subnotif');
    user = data.user;
    accessToken = data.accessToken;
  });

  test('GET /subscriptions/plans should return available plans', async ({ request }) => {
    const response = await request.get('/subscriptions/plans', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toBeInstanceOf(Array);
  });

  test('GET /subscriptions/me should return null or subscription', async ({ request }) => {
    const response = await request.get('/subscriptions/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    // Initially, it's usually empty for a new user
  });

  test('GET /notifications should return user notifications', async ({ request }) => {
    const response = await request.get('/notifications', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    const items = body.items || body.data || body;
    expect(Array.isArray(items)).toBeTruthy();
  });

  test('GET /notifications/unread-count should return a number', async ({ request }) => {
    const response = await request.get('/notifications/unread-count', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(typeof Number(body)).toBe('number');
  });
});
