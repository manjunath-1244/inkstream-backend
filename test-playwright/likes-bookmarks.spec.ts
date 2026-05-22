import { test, expect } from '@playwright/test';
import { createTestUser, upgradeToCreator } from './test-utils';

test.describe('Likes & Bookmarks API', () => {
  test.describe.configure({ mode: 'serial' });

  let user: any;
  let accessToken: string;
  let postId: string;
  let commentId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Setup user and creator role
    const data = await createTestUser(request, 'engagement');
    user = data.user;
    accessToken = data.accessToken;
    accessToken = await upgradeToCreator(request, accessToken, data.credentials);

    // 2. Create a post
    const postRes = await request.post('/posts', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: `Post for Likes and Bookmarks ${Date.now()}`,
        contentMarkdown: 'This is a test post.',
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      }
    });
    const postBody = await postRes.json();
    postId = postBody.id;

    // 3. Create a comment
    const commentRes = await request.post(`/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { body: 'Test comment for likes test' }
    });
    if (!commentRes.ok()) {
      console.error('Comment creation failed', await commentRes.text());
    }
    const commentBody = await commentRes.json();
    commentId = commentBody.id;
  });

  test('POST /posts/:id/like should toggle like on a post', async ({ request }) => {
    // Like the post
    let response = await request.post(`/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(response.ok()).toBeTruthy();
    let body = await response.json();
    expect(body.liked).toBe(true);

    // Unlike the post
    response = await request.post(`/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(response.ok()).toBeTruthy();
    body = await response.json();
    expect(body.liked).toBe(false);
  });

  test('POST /comments/:id/like should toggle like on a comment', async ({ request }) => {
    let response = await request.post(`/comments/${commentId}/like`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(response.ok()).toBeTruthy();
    let body = await response.json();
    expect(body.liked).toBe(true);
  });

  test('POST /bookmarks/:postId should toggle bookmark on a post', async ({ request }) => {
    // Bookmark the post
    let response = await request.post(`/bookmarks/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(response.ok()).toBeTruthy();
    let body = await response.json();
    expect(body.bookmarked).toBe(true);

    // Get bookmarks to verify
    let getResponse = await request.get('/bookmarks', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    let getBody = await getResponse.json();
    const items = getBody.items || getBody;
    expect(Array.isArray(items)).toBeTruthy();
    const found = items.find((b: any) => b.id === postId);
    expect(found).toBeDefined();

    // Unbookmark the post
    response = await request.post(`/bookmarks/${postId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    expect(response.ok()).toBeTruthy();
  });
});
