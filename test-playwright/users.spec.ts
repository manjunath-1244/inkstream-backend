import { test, expect } from '@playwright/test';
import { createTestUser } from './test-utils';

test.describe('Users API', () => {
  test.describe.configure({ mode: 'serial' });

  let user: any;
  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const data = await createTestUser(request, 'userapi');
    user = data.user;
    accessToken = data.accessToken;
  });

  test('GET /users/me should return the logged-in user profile', async ({ request }) => {
    const response = await request.get('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.id).toBe(user.id);
    expect(body.email).toBe(user.email);
  });

  test('PATCH /users/me should update user profile', async ({ request }) => {
    const newBio = 'This is my newly updated bio';
    const response = await request.patch('/users/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        bio: newBio,
        displayName: 'Updated Name'
      }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.bio).toBe(newBio);
    expect(body.displayName).toBe('Updated Name');
  });

  test('POST /users/me/upgrade-to-creator should upgrade user role', async ({ request }) => {
    const response = await request.post('/users/me/upgrade-to-creator', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.role).toBe('CREATOR'); // Assuming Role enum has 'CREATOR'
  });

  test('GET /users/:username should return public profile', async ({ request }) => {
    const response = await request.get(`/users/${user.username}`);

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.id).toBe(user.id);
    expect(body.username).toBe(user.username);
  });
});
