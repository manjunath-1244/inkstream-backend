import { APIRequestContext } from '@playwright/test';

export async function createTestUser(request: APIRequestContext, prefix = 'user') {
  const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const testUser = {
    email: `${prefix}_${uniqueId}@example.com`,
    username: `${prefix}_${uniqueId}`,
    password: 'StrongPassword123!',
    displayName: `${prefix} ${uniqueId}`
  };

  const response = await request.post('/auth/register', { data: testUser });
  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${await response.text()}`);
  }

  const body = await response.json();
  return {
    user: body.user,
    accessToken: body.accessToken,
    credentials: testUser
  };
}

export async function upgradeToCreator(request: APIRequestContext, accessToken: string, credentials: any) {
  const response = await request.post('/users/me/upgrade-to-creator', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!response.ok()) {
    throw new Error(`Failed to upgrade to creator: ${await response.text()}`);
  }

  // Re-login to get a fresh token with the new role
  const loginRes = await request.post('/auth/login', {
    data: { email: credentials.email, password: credentials.password }
  });
  const loginBody = await loginRes.json();
  console.log('Login Body after upgrade:', loginBody.user);
  return loginBody.accessToken;
}

export async function upgradeToAdmin(request: APIRequestContext, userId: string, adminToken: string, credentials: any) {
  const response = await request.patch(`/users/${userId}/role`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { role: 'ADMIN' }
  });
  if (!response.ok()) {
    console.warn(`Failed to upgrade to admin: ${await response.text()}`);
    return adminToken;
  }

  // Re-login to get a fresh token with the new role
  const loginRes = await request.post('/auth/login', {
    data: { email: credentials.email, password: credentials.password }
  });
  const loginBody = await loginRes.json();
  return loginBody.accessToken;
}
