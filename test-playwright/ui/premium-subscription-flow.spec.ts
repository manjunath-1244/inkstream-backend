import { test, expect } from '@playwright/test';

test.describe('Premium Subscription Paywall Flow', () => {
  test('should block free user and grant access after premium upgrade', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    const randCreator = Math.floor(Math.random() * 100000);
    const creatorUser = `creator_${randCreator}`;
    const creatorEmail = `${creatorUser}@example.com`;

    // 1. Register Creator and publish a PREMIUM post
    console.log('Navigating to homepage for Creator...');
    await page.goto('http://localhost:5173/');

    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(creatorUser);
    await page.getByPlaceholder('John Doe').fill(`Creator ${randCreator}`);
    await page.getByPlaceholder('name@domain.com').fill(creatorEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Upgrade to Creator role
    await page.locator('button:has-text("Dashboard")').click();
    await page.locator('button:has-text("Upgrade to Creator")').click();
    await expect(page.locator('span.badge-creator:has-text("CREATOR")').first()).toBeVisible();

    // Write a Premium post
    await page.locator('button:has-text("Write")').click();
    const premiumTitle = `Exclusive Insights - ${randCreator}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(premiumTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('Short summary.');
    await page.getByPlaceholder('Write your amazing story here...').fill('This is secret premium content.');
    
    // Select PREMIUM visibility
    await page.locator('div.form-group:has(label:has-text("Visibility")) select').selectOption('PREMIUM');
    
    await page.locator('button:has-text("Publish Story")').click();

    // Verify post is published and visible on the feed list
    await expect(page.locator(`h3:has-text("${premiumTitle}")`)).toBeVisible();

    // Log out creator
    await page.locator('button:has-text("Log Out")').click();

    // 2. Register Reader (Free tier by default)
    const randReader = Math.floor(Math.random() * 100000);
    const readerUser = `reader_${randReader}`;
    const readerEmail = `${readerUser}@example.com`;

    console.log('Registering free reader...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(readerUser);
    await page.getByPlaceholder('John Doe').fill(`Reader ${randReader}`);
    await page.getByPlaceholder('name@domain.com').fill(readerEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Try to open the PREMIUM story
    console.log('Attempting to read premium story as free user...');
    await page.locator(`h3:has-text("${premiumTitle}")`).click();

    // Wait for the loading state to disappear
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });

    // Verify Access Denied paywall page is rendered
    await expect(page.locator('h3:has-text("Access Denied")')).toBeVisible();

    // Go to Dashboard and subscribe to Premium plan
    console.log('Upgrading reader to Premium...');
    await page.locator('button:has-text("Dashboard")').click();
    await page.locator('button.tab:has-text("Subscription")').click();
    
    // Click Upgrade to Premium
    await page.locator('button:has-text("Upgrade to Premium")').click();
    
    // Verify subscription is active badge
    await expect(page.locator('.badge-premium:has-text("ACTIVE SUBSCRIPTION")')).toBeVisible();

    // Return to Explore and open the story
    console.log('Accessing premium story as premium subscriber...');
    await page.locator('button:has-text("Explore")').click();
    await page.locator(`h3:has-text("${premiumTitle}")`).click();

    // Wait for loading to finish
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });

    // Verify we can now view the premium content!
    await expect(page.locator('h1')).toHaveText(premiumTitle);
    await expect(page.getByText('This is secret premium content.')).toBeVisible();

    // Clean up: Cancel subscription
    console.log('Cancelling subscription...');
    await page.locator('button:has-text("Dashboard")').click();
    await page.locator('button.tab:has-text("Subscription")').click();
    await page.locator('button:has-text("Cancel Subscription")').click();

    // Log out
    await page.locator('button:has-text("Log Out")').click();
  });
});
