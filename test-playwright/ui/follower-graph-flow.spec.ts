import { test, expect } from '@playwright/test';

test.describe('Follower Graph and Feed Flow', () => {
  test('should support follow/unfollow toggle and correctly populate personalized feed', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    const rand = Math.floor(Math.random() * 100000);
    const creatorUser = `creator_follow_${rand}`;
    const creatorEmail = `${creatorUser}@example.com`;
    const readerUser = `reader_follow_${rand}`;
    const readerEmail = `${readerUser}@example.com`;

    // 1. Register Creator
    console.log('Registering Creator...');
    await page.goto('http://localhost:5173/');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(creatorUser);
    await page.getByPlaceholder('John Doe').fill(`Creator Follow ${rand}`);
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
    const storyTitle = `NestJS Follower Flow - ${rand}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(storyTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('Testing the follow graph features.');
    await page.getByPlaceholder('Write your amazing story here...').fill('Following a creator will deliver their posts to your inbox feed.');
    
    // Choose Technology category
    await page.locator('div.form-group:has(label:has-text("Category")) select').selectOption({ label: 'Technology' });
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
    await page.getByPlaceholder('John Doe').fill(`Reader Follow ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(readerEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Open the Creator's story
    await page.locator(`h3:has-text("${storyTitle}")`).click();
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });

    // Click Follow button
    console.log('Following the creator...');
    const followBtn = page.locator('button.follow-btn');
    await expect(followBtn).toHaveText('➕ Follow');
    await followBtn.click();
    await expect(followBtn).toHaveText('👤 Following');

    // Return to main Explore feed
    await page.locator('button:has-text("← Back to Stories")').click();

    // Switch to Following Feed tab
    console.log('Checking Following Feed tab...');
    await page.locator('button.tab:has-text("Following Feed")').click();
    await expect(page.locator(`h3:has-text("${storyTitle}")`)).toBeVisible({ timeout: 10000 });

    // Unfollow via the story reader
    console.log('Unfollowing the creator...');
    await page.locator(`h3:has-text("${storyTitle}")`).click();
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });
    await expect(followBtn).toHaveText('👤 Following');
    await followBtn.click();
    await expect(followBtn).toHaveText('➕ Follow');

    // Return and verify it is removed from Following Feed tab
    await page.locator('button:has-text("← Back to Stories")').click();
    await page.locator('button.tab:has-text("Following Feed")').click();
    await expect(page.locator(`h3:has-text("${storyTitle}")`)).not.toBeVisible({ timeout: 10000 });

    // Log out reader
    await page.locator('button:has-text("Log Out")').click();
  });
});
