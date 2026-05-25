import { test, expect } from '@playwright/test';

test.describe('Inkstream Complete E2E Flow', () => {
  test('should execute the full user lifecycle visually in the browser', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    // Step 1: Load Homepage
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5173/');
    await expect(page).toHaveTitle(/Inkstream/);

    // Step 2: Open Auth Modal & Switch to Sign Up
    console.log('Opening auth modal...');
    const loginRegBtn = page.locator('button:has-text("Login / Register")');
    await expect(loginRegBtn).toBeVisible();
    await loginRegBtn.click();

    console.log('Switching to registration form...');
    const signUpToggle = page.getByText('Sign up', { exact: true });
    await signUpToggle.click();

    // Step 3: Register a new user
    const rand = Math.floor(Math.random() * 100000);
    const username = `e2e_user_${rand}`;
    const displayName = `E2E Tester ${rand}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';

    console.log(`Filling registration fields for ${username}...`);
    await page.getByPlaceholder('johndoe').fill(username);
    await page.getByPlaceholder('John Doe').fill(displayName);
    await page.getByPlaceholder('name@domain.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);

    console.log('Submitting registration form...');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Verify modal closes and user is logged in
    console.log('Verifying successful login...');
    await expect(page.locator('.profile-avatar-large')).toBeVisible();
    await expect(page.locator('.sidebar-container')).toContainText(displayName);

    // Step 4: Go to Dashboard & Upgrade to Creator
    console.log('Navigating to user dashboard...');
    const dashboardNavBtn = page.locator('button:has-text("Dashboard")');
    await expect(dashboardNavBtn).toBeVisible();
    await dashboardNavBtn.click();

    console.log('Triggering creator role upgrade...');
    const upgradeBtn = page.locator('button:has-text("Upgrade to Creator")');
    await expect(upgradeBtn).toBeVisible();
    await upgradeBtn.click();

    // Verify role upgrade badge changed to CREATOR
    console.log('Verifying role upgrade success badge...');
    const creatorBadge = page.locator('span.badge-creator:has-text("CREATOR")').first();
    await expect(creatorBadge).toBeVisible();

    // Step 5: Write and Publish a Story
    console.log('Navigating to write/editor workspace...');
    const writeNavBtn = page.locator('button:has-text("Write")');
    await expect(writeNavBtn).toBeVisible();
    await writeNavBtn.click();

    const postTitle = `Automated E2E Masterpiece - ${rand}`;
    const postExcerpt = 'This story was written by the Playwright automation robot.';
    const postContent = 'Welcome to the future of publications. React and NestJS form an amazing fullstack combination!';

    console.log('Filling out story forms...');
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(postTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill(postExcerpt);
    await page.getByPlaceholder('Write your amazing story here...').fill(postContent);

    // Set tag
    await page.getByPlaceholder('nest, websocket, realtime').fill('automation, playwright');

    console.log('Publishing story...');
    const publishBtn = page.locator('button:has-text("Publish Story")');
    await publishBtn.click();

    // Verify post is on the explore publications feed list
    console.log('Verifying story is listed on the publications feed...');
    await expect(page.locator(`h3:has-text("${postTitle}")`)).toBeVisible();

    // Step 6: Click and Open the Story Detail Reader
    console.log('Opening story detail reader...');
    await page.locator(`h3:has-text("${postTitle}")`).click();
    
    // Wait for the loading state to disappear
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });
    
    // Check if access is denied
    const errorCard = page.locator('h3:has-text("Access Denied")');
    if (await errorCard.isVisible()) {
      console.error('ERROR RENDERED IN UI:', await page.locator('.glass-card').textContent());
    }

    await expect(page.locator('h1')).toHaveText(postTitle);
    await expect(page.getByText(postContent)).toBeVisible();

    // Step 7: Like the Story
    console.log('Toggling like on the story...');
    const likeBtn = page.locator('button:has-text("Like Story")');
    await expect(likeBtn).toContainText('Like Story (0)');
    await likeBtn.click();
    await expect(likeBtn).toContainText('Like Story (1)');

    // Step 8: Post a Comment on the Story
    console.log('Submitting discussion comment...');
    const commentInput = page.getByPlaceholder('What are your thoughts on this story?');
    await commentInput.fill('This is a great story! Automation works flawlessly.');
    
    const commentSubmitBtn = page.locator('button[type="submit"]:has-text("Comment")');
    await commentSubmitBtn.click();

    // Verify comment is displayed
    console.log('Verifying comment appears in list...');
    await expect(page.locator('p.comment-text:has-text("This is a great story! Automation works flawlessly.")')).toBeVisible();

    // Step 9: Edit the Comment
    console.log('Editing submitted comment...');
    await page.locator('button:has-text("Edit")').click();
    await page.locator('.comment-card textarea').fill('This is a great story! Automation works flawlessly. (UPDATED)');
    await page.locator('.comment-card button:has-text("Save")').click();
    await expect(page.locator('p.comment-text:has-text("This is a great story! Automation works flawlessly. (UPDATED)")')).toBeVisible();

    // Step 10: Bookmark/Save the Story
    console.log('Bookmarking story...');
    const bookmarkBtn = page.locator('button:has-text("Save Story")');
    await bookmarkBtn.click();
    await expect(page.locator('button:has-text("Unsave")')).toBeVisible();

    // Step 11: Go to Dashboard and Verify Bookmark Lists
    console.log('Verifying bookmark tab list on Dashboard...');
    await page.locator('button:has-text("Dashboard")').click();

    // Click Bookmarks Tab
    await page.locator('button.tab:has-text("Bookmarks")').click();
    await expect(page.locator(`h4:has-text("${postTitle}")`)).toBeVisible();

    // Step 12: Logout
    console.log('Logging out from session...');
    const logoutBtn = page.locator('button:has-text("Log Out")');
    await logoutBtn.click();

    // Verify user is logged out (Login button visible again)
    await expect(loginRegBtn).toBeVisible();
    console.log('E2E lifecycle finished successfully!');
  });
});
