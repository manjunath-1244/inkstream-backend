import { test, expect } from '@playwright/test';

test.describe('User Content Management Flow', () => {
  test('should allow user to update profile, and like/delete comments', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    // 1. Register a new user
    console.log('Registering user...');
    await page.goto('http://localhost:5173/');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    
    const rand = Math.floor(Math.random() * 100000);
    const username = `mgmt_user_${rand}`;
    const email = `${username}@example.com`;
    const password = 'Password123!';

    await page.getByPlaceholder('johndoe').fill(username);
    await page.getByPlaceholder('John Doe').fill(`Initial Name ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.locator('.modal-content-card button:has-text("Register Account")').click();
    
    // Verify login success
    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // 2. Update Profile Details
    console.log('Navigating to dashboard to update profile...');
    await page.locator('button:has-text("Dashboard")').click();
    
    const newDisplayName = `Updated Name ${rand}`;
    const newBio = 'This is an updated bio for testing.';
    const newWebsite = 'https://updated-website.com';

    const profileForm = page.locator('form', { hasText: 'Display Name' });
    await profileForm.locator('input[type="text"]').fill(newDisplayName);
    await profileForm.locator('input[type="url"]').fill(newWebsite);
    await profileForm.locator('textarea').fill(newBio);
    
    await page.locator('button:has-text("Save Changes")').click();
    
    // Verify success message
    await expect(page.getByText('Profile updated successfully!')).toBeVisible({ timeout: 10000 });
    
    // Verify the name updated on the sidebar/dashboard header
    await expect(page.locator('.sidebar-container')).toContainText(newDisplayName);

    // 3. Upgrade to Creator to publish a post (so we can comment on it)
    console.log('Upgrading to creator and publishing a post...');
    await page.locator('button:has-text("Upgrade to Creator")').click();
    await expect(page.locator('span.badge-creator:has-text("CREATOR")').first()).toBeVisible();

    // Publish a story
    await page.locator('button:has-text("Write")').click();
    const postTitle = `Management Post ${rand}`;
    await page.getByPlaceholder('Discovering WebSockets inside NestJS...').fill(postTitle);
    await page.getByPlaceholder('In this blog we explore WebSockets in').fill('Excerpt');
    await page.getByPlaceholder('Write your amazing story here...').fill('Content');
    await page.locator('button:has-text("Publish Story")').click();
    
    // Open the story
    await expect(page.locator(`h3:has-text("${postTitle}")`)).toBeVisible();
    await page.locator(`h3:has-text("${postTitle}")`).click();
    await expect(page.getByText('Loading Story details...')).not.toBeVisible({ timeout: 10000 });

    // 4. Add a comment
    console.log('Adding a comment...');
    const commentText = `Test comment ${rand}`;
    await page.getByPlaceholder('What are your thoughts on this story?').fill(commentText);
    await page.locator('button[type="submit"]:has-text("Comment")').click();
    
    const commentRow = page.locator('.comment-card', { hasText: commentText });
    await expect(commentRow).toBeVisible();

    // 5. Like the comment
    console.log('Liking the comment...');
    const likeBtn = commentRow.locator('button', { hasText: '👍 Like' });
    await likeBtn.click();
    await expect(likeBtn).toContainText('Like (1)');

    // 6. Delete the comment
    console.log('Deleting the comment...');
    // Handle the browser confirm dialog automatically
    page.on('dialog', dialog => dialog.accept());
    
    const deleteBtn = commentRow.locator('button:has-text("Delete")');
    await deleteBtn.click();
    
    // Verify comment is removed
    await expect(commentRow).not.toBeVisible();

    console.log('User content management flow executed successfully!');
  });
});
