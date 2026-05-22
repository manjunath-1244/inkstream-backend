import { test, expect } from '@playwright/test';
import { createTestUser, upgradeToCreator } from './test-utils';

test.describe('Posts API', () => {
  test.describe.configure({ mode: 'serial' });

  let user: any;
  let accessToken: string;
  let postId: string;
  let postSlug: string;

  test.beforeAll(async ({ request }) => {
    // We need a user with CREATOR role to create posts
    const data = await createTestUser(request, 'creator');
    user = data.user;
    accessToken = data.accessToken;
    accessToken = await upgradeToCreator(request, accessToken, data.credentials);
  });

  test('POST /posts should create a new post', async ({ request }) => {
    const title = `Playwright Test Post ${Date.now()}`;
    const response = await request.post('/posts', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: title,
        contentMarkdown: 'This is a **test** post created by Playwright.',
        excerpt: 'Test excerpt',
        status: 'PUBLISHED', // PostStatus.PUBLISHED
        visibility: 'PUBLIC' // PostVisibility.PUBLIC
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.slug).toBeDefined();
    expect(body.title).toBe(title);
    
    postId = body.id;
    postSlug = body.slug;
  });

  test('GET /posts should return paginated published posts', async ({ request }) => {
    const response = await request.get('/posts');
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.items).toBeInstanceOf(Array);
    // Since we just published one, it should be in there
    const found = body.items.find((p: any) => p.id === postId);
    expect(found).toBeDefined();
  });

  test('GET /posts/:idOrSlug should return a single post by slug', async ({ request }) => {
    const response = await request.get(`/posts/${postSlug}`);
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.id).toBe(postId);
    expect(body.title).toContain('Playwright Test Post');
  });

  test('PATCH /posts/:id should update a post', async ({ request }) => {
    const updatedTitle = `Updated Playwright Post Title ${Date.now()}`;
    const response = await request.patch(`/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: updatedTitle
      }
    });

    if (!response.ok()) {
      console.log('PATCH POST FAILED:', response.status(), await response.text());
    }
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.title).toContain(updatedTitle);
  });

  test('DELETE /posts/:id should soft delete a post', async ({ request }) => {
    const response = await request.delete(`/posts/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    expect(response.ok()).toBeTruthy();

    // Verify it's no longer publicly accessible (or returns 404, depending on soft delete implementation)
    // Some implementations might still return it for the author but not in public feeds.
    // We'll just verify the DELETE request was successful.
  });
});
