import { test, expect } from '@playwright/test';
import { createTestUser, upgradeToCreator } from './test-utils';

test.describe('Comments API', () => {
  test.describe.configure({ mode: 'serial' });

  let user: any;
  let accessToken: string;
  let postId: string;
  let commentId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Create a user and upgrade to creator
    const data = await createTestUser(request, 'commenter');
    user = data.user;
    accessToken = data.accessToken;
    accessToken = await upgradeToCreator(request, accessToken, data.credentials);

    // 2. Create a post to comment on
    const postResponse = await request.post('/posts', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        title: `Post for Comments ${Date.now()}`,
        contentMarkdown: 'Testing comments...',
        status: 'PUBLISHED',
        visibility: 'PUBLIC'
      }
    });
    
    if (!postResponse.ok()) {
      throw new Error('Failed to setup post for comment tests');
    }
    const postBody = await postResponse.json();
    postId = postBody.id;
  });

  test('POST /posts/:postId/comments should create a comment', async ({ request }) => {
    const response = await request.post(`/posts/${postId}/comments`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        body: 'This is a test comment.'
      }
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.body).toBe('This is a test comment.');
    expect(body.authorId).toBe(user.id);
    expect(body.postId).toBe(postId);
    
    commentId = body.id;
  });

  test('GET /posts/:postId/comments should return paginated comments', async ({ request }) => {
    const response = await request.get(`/posts/${postId}/comments`);
    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.items).toBeInstanceOf(Array);
    const found = body.items.find((c: any) => c.id === commentId);
    expect(found).toBeDefined();
  });

  test('PATCH /comments/:id should update a comment', async ({ request }) => {
    const response = await request.patch(`/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        body: 'This is an updated test comment.'
      }
    });

    expect(response.ok()).toBeTruthy();
    
    const body = await response.json();
    expect(body.body).toBe('This is an updated test comment.');
    const isEdited = new Date(body.updatedAt).getTime() > new Date(body.createdAt).getTime();
    expect(isEdited).toBe(true);
  });

  test('DELETE /comments/:id should delete a comment', async ({ request }) => {
    const response = await request.delete(`/comments/${commentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    expect(response.ok()).toBeTruthy();

    // Verify it's gone
    const getResponse = await request.get(`/posts/${postId}/comments`);
    const body = await getResponse.json();
    const found = body.items?.find((c: any) => c.id === commentId);
    expect(found).toBeUndefined();
  });
});
