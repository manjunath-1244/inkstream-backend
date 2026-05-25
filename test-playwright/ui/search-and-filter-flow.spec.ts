import { test, expect } from '@playwright/test';

test.describe('Search and Discovery Flow', () => {
  test('should allow users to filter posts by category, tag, and search query', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    const rand = Math.floor(Math.random() * 100000);
    const creatorUser = `creator_search_${rand}`;
    const creatorEmail = `${creatorUser}@example.com`;

    // 1. Register Creator
    await page.goto('http://localhost:5173/');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(creatorUser);
    await page.getByPlaceholder('John Doe').fill(`Creator Search ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(creatorEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Upgrade to Creator role
    await page.locator('button:has-text("Dashboard")').click();
    await page.locator('button:has-text("Upgrade to Creator")').click();
    await expect(page.locator('span.badge-creator:has-text("CREATOR")').first()).toBeVisible();

    // 2. Publish Post 1 (Category: Technology, Tags: realtime)
    await page.locator('button:has-text("Write")').click();
    const techTitle = `NestJS Realtime WebSockets - ${rand}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(techTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('A detailed post about realtime updates.');
    await page.getByPlaceholder('Write your amazing story here...').fill('NestJS has native WebSockets integration using gateway handlers.');
    
    // Choose Technology category
    await page.locator('div.form-group:has(label:has-text("Category")) select').selectOption({ label: 'Technology' });
    // Tags input
    await page.getByPlaceholder('nest, websocket, realtime').fill('realtime, nestsock');
    // Publish
    await page.locator('button:has-text("Publish Story")').click();
    await expect(page.locator(`h3:has-text("${techTitle}")`)).toBeVisible();

    // 3. Publish Post 2 (Category: Lifestyle, Tags: health)
    await page.locator('button:has-text("Write")').click();
    const lifestyleTitle = `Healthy Lifestyle Guide - ${rand}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(lifestyleTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('A guide for clean living and mindset.');
    await page.getByPlaceholder('Write your amazing story here...').fill('Living a healthy life requires consistency and eating balanced meals.');
    
    // Choose Lifestyle category
    await page.locator('div.form-group:has(label:has-text("Category")) select').selectOption({ label: 'Lifestyle' });
    // Tags input
    await page.getByPlaceholder('nest, websocket, realtime').fill('health, balance');
    // Publish
    await page.locator('button:has-text("Publish Story")').click();
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).toBeVisible();

    // 4. Test Category Sidebar Filtering
    console.log('Testing category sidebar filtering...');
    await page.locator('.category-item:has-text("Technology")').click();
    
    // Tech post should be visible, Lifestyle post should NOT
    await expect(page.locator(`h3:has-text("${techTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).not.toBeVisible();

    // Click "Lifestyle" to switch category filter
    await page.locator('.category-item:has-text("Lifestyle")').click();
    
    // Lifestyle post should be visible, Tech post should NOT
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${techTitle}")`)).not.toBeVisible();

    // De-select category to clear filters
    await page.locator('.category-item:has-text("Lifestyle")').click();
    await expect(page.locator(`h3:has-text("${techTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).toBeVisible();

    // 5. Test Search Filtering
    console.log('Testing search bar filtering...');
    const searchInput = page.getByPlaceholder('Search stories, tags...');
    await searchInput.fill('Realtime');
    await searchInput.press('Enter');

    // Tech post should be visible, Lifestyle post should NOT
    await expect(page.locator(`h3:has-text("${techTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).not.toBeVisible();

    // Search tag specifically
    console.log('Testing search tag filtering...');
    await searchInput.fill('balance');
    await searchInput.press('Enter');

    // Lifestyle post should be visible, Tech post should NOT
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${techTitle}")`)).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await searchInput.press('Enter');
    await expect(page.locator(`h3:has-text("${techTitle}")`)).toBeVisible();
    await expect(page.locator(`h3:has-text("${lifestyleTitle}")`)).toBeVisible();

    // Log out
    await page.locator('button:has-text("Log Out")').click();
  });
});
