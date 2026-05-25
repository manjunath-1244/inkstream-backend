import { test, expect } from '@playwright/test';

test.describe('Inkstream React Frontend UI Tests', () => {
  test('should load the home page and show the welcome banner', async ({ page }) => {
    // Navigate to the React frontend running on port 5173
    await page.goto('http://localhost:5173/');

    // Assert that the page title matches
    await expect(page).toHaveTitle(/Inkstream - Premium Creator/);

    // Assert that the header welcome banner is visible
    const welcomeHeader = page.locator('h1:has-text("Welcome to Inkstream Portal")');
    await expect(welcomeHeader).toBeVisible();
    
    // Assert that "Explore" button is visible on the navbar
    const exploreBtn = page.locator('nav button:has-text("Explore")');
    await expect(exploreBtn).toBeVisible();
  });

  test('should open the auth modal when clicking Login / Register', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Click on the login / register button
    const loginBtn = page.locator('button:has-text("Login / Register")');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    // Verify that the Auth Modal overlay is visible
    const modalHeader = page.locator('.modal-content-card h2:has-text("Welcome Back")');
    await expect(modalHeader).toBeVisible();

    // Verify input fields inside the modal
    const emailInput = page.locator('input[placeholder="name@domain.com"]');
    await expect(emailInput).toBeVisible();
    
    const passwordInput = page.locator('input[placeholder="••••••••"]');
    await expect(passwordInput).toBeVisible();
    
    // Close the modal
    const closeBtn = page.locator('.modal-content-card button:has-text("×")');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    
    // Verify it is closed
    await expect(modalHeader).not.toBeVisible();
  });

  test('should display the developer API response tracker widget', async ({ page }) => {
    await page.goto('http://localhost:5173/');

    // Locate the floating debugger console panel
    const consoleHeader = page.locator('span:has-text("API RESPONSE TRACKER")');
    await expect(consoleHeader).toBeVisible();

    // Try expanding the developer console
    await consoleHeader.click();

    // Verify that the console lists log categories
    const allFilterBtn = page.locator('button:has-text("ALL")');
    await expect(allFilterBtn).toBeVisible();

    const pendingFilterBtn = page.locator('button:has-text("PENDING")');
    await expect(pendingFilterBtn).toBeVisible();
  });
});
