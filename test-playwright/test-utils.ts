import { APIRequestContext } from '@playwright/test';
import { Client } from 'pg';

export async function createTestUser(request: APIRequestContext, prefix = 'user') {
  const uniqueId = Date.now().toString() + Math.floor(Math.random() * 1000);
  const testUser = {
    email: `${prefix}_${uniqueId}@example.com`,
    username: `${prefix}_${uniqueId}`,
    password: 'Password123!',
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
  try {
    await setDbUserRole(credentials.email, 'ADMIN');
  } catch (err) {
    console.warn('Failed to elevate user to ADMIN in DB directly:', err);
  }

  // Re-login to get a fresh token with the new role
  const loginRes = await request.post('/auth/login', {
    data: { email: credentials.email, password: credentials.password }
  });
  if (!loginRes.ok()) {
    console.warn(`Failed to login after DB role upgrade: ${await loginRes.text()}`);
    return adminToken;
  }
  const loginBody = await loginRes.json();
  return loginBody.accessToken;
}

export async function setDbUserRole(email: string, role: string) {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'inkstream',
  });
  await client.connect();
  try {
    await client.query('UPDATE users SET role = $1 WHERE email = $2', [role, email]);
  } finally {
    await client.end();
  }
}

export async function getDbUserByEmail(email: string) {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'inkstream',
  });
  await client.connect();
  try {
    const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0];
  } finally {
    await client.end();
  }
}

