import { test, expect } from '@playwright/test';
import { setDbUserRole } from '../test-utils';

test.describe('Moderation and Notifications Flow', () => {
  test('should trigger notifications and allow moderators to manage reported posts', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    // Handle alert dialogs
    page.on('dialog', async dialog => {
      console.log('Dialog shown:', dialog.message());
      await dialog.accept();
    });

    const rand = Math.floor(Math.random() * 100000);
    const creatorUser = `creator_notif_${rand}`;
    const creatorEmail = `${creatorUser}@example.com`;
    const readerUser = `reader_notif_${rand}`;
    const readerEmail = `${readerUser}@example.com`;
    const modUser = `mod_user_${rand}`;
    const modEmail = `${modUser}@example.com`;

    let postId = '';
    // Intercept post creation to get the post UUID
    page.on('response', async response => {
      if (response.url().includes('/posts') && !response.url().includes('/comments') && response.request().method() === 'POST') {
        try {
          const data = await response.json();
          if (data && data.id) {
            postId = data.id;
            console.log('Intercepted created postId:', postId);
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });

    // 1. Register Creator
    console.log('Registering Creator...');
    await page.goto('http://localhost:5173/');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(creatorUser);
    await page.getByPlaceholder('John Doe').fill(`Creator Notif ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(creatorEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Upgrade to Creator role
    await page.locator('button:has-text("Dashboard")').click();
    await page.locator('button:has-text("Upgrade to Creator")').click();
    await expect(page.locator('span.badge-creator:has-text("CREATOR")').first()).toBeVisible();

    // Publish a story
    await page.locator('button:has-text("Write")').click();
    const storyTitle = `NestJS Architectures - ${rand}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(storyTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('A detailed post about NestJS design patterns.');
    await page.getByPlaceholder('Write your amazing story here...').fill('Writing clean and modular NestJS controllers makes scaling easy.');
    
    // Choose Technology category
    await page.locator('div.form-group:has(label:has-text("Category")) select').selectOption({ label: 'Technology' });
    // Tags input
    await page.getByPlaceholder('nest, websocket, realtime').fill('architecture, nestjs');
    // Publish
    await page.locator('button:has-text("Publish Story")').click();
    await expect(page.locator(`h3:has-text("${storyTitle}")`)).toBeVisible();

    // Log out creator
    await page.locator('button:has-text("Log Out")').click();

    // 2. Register Reader
    console.log('Registering Reader...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(readerUser);
    await page.getByPlaceholder('John Doe').fill(`Reader Notif ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(readerEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Open the Creator's story
    await page.locator(`h3:has-text("${storyTitle}")`).click();
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });

    // Like the story
    console.log('Liking the story...');
    await page.locator('button:has-text("Like Story")').click();

    // Add a comment
    console.log('Commenting on the story...');
    await page.getByPlaceholder('What are your thoughts on this story? Write a comment...').fill('This is an awesome post!');
    await page.locator('button:has-text("Comment")').click();
    await expect(page.locator(`span.comment-author-name`)).toBeVisible();

    // Report the story
    console.log('Reporting the story...');
    await page.locator('button:has-text("Report")').click();
    await page.getByPlaceholder('Please explain why this post violates community guidelines...').fill('Offensive / inappropriate content.');
    await page.locator('button:has-text("Submit Report")').click();

    // Log out reader
    await page.locator('button:has-text("Log Out")').click();

    // 3. Log back in as Creator to verify notifications
    console.log('Logging in as Creator to check notifications...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByPlaceholder('name@domain.com').fill(creatorEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Sign In")').click();

    // Verify notifications icon shows unread indicator
    await page.locator('button.btn-icon:has-text("🔔")').click();
    
    // Check that notifications contain actions from reader
    await expect(page.locator(`div.notif-item:has-text("NEW_COMMENT_ON_YOUR_POST")`)).toBeVisible();
    await expect(page.locator(`div.notif-item:has-text("NEW_LIKE_ON_YOUR_POST")`)).toBeVisible();

    // Log out creator
    await page.locator('button:has-text("Log Out")').click();

    // 4. Register Mod user and elevate role via DB
    console.log('Registering Mod...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(modUser);
    await page.getByPlaceholder('John Doe').fill(`Mod User ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(modEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    console.log('Elevating Mod role in DB...');
    await setDbUserRole(modEmail, 'MODERATOR');

    // Reload page to reflect role update
    await page.reload();

    // Verify "Mod Space" button is visible
    await expect(page.locator('button:has-text("Mod Space")')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("Mod Space")').click();

    // Verify reports queue shows the reported post reason
    console.log('Verifying reports queue...');
    await expect(page.locator('table')).toContainText('Offensive / inappropriate content.');

    // Resolve the report
    console.log('Resolving the report...');
    await page.locator(`tr:has-text("${postId}") button:has-text("Resolve")`).click();
    await expect(page.locator(`tr:has-text("${postId}")`)).toContainText('RESOLVED');

    // Hide the post using intercepted postId
    console.log('Hiding post: ', postId);
    await page.getByPlaceholder('e.g. 889e8400-e29b-41d4-a716-446655440000').fill(postId);
    await page.locator('button:has-text("Hide Publication")').click();
    await expect(page.getByText('is now HIDDEN from the feed!', { exact: false })).toBeVisible({ timeout: 10000 });

    // Go to Explore and verify the post is hidden
    await page.locator('button:has-text("Explore")').click();
    await expect(page.locator(`h3:has-text("${storyTitle}")`)).not.toBeVisible();

    // Log out Mod
    await page.locator('button:has-text("Log Out")').click();
  });
});
