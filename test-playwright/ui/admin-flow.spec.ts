import { test, expect } from '@playwright/test';
import { setDbUserRole, getDbUserByEmail } from '../test-utils';

test.describe('Admin Control Panel E2E Flow', () => {
  test('should allow admin to assign roles, ban users, and verify ban restricts login', async ({ page }) => {
    // Listen to browser console and page errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });
    page.on('pageerror', err => {
      console.error('BROWSER PAGEERROR:', err.message);
    });

    const rand = Math.floor(Math.random() * 100000);
    const targetUser = `target_admin_${rand}`;
    const targetEmail = `${targetUser}@example.com`;
    const adminUser = `admin_user_${rand}`;
    const adminEmail = `${adminUser}@example.com`;

    // 1. Register target regular user
    console.log('Registering target user...');
    await page.goto('http://localhost:5173/');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(targetUser);
    await page.getByPlaceholder('John Doe').fill(`Target User ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(targetEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();
    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    // Log out target user
    await page.locator('button:has-text("Log Out")').click();

    // Fetch target user UUID from DB
    const targetDbUser = await getDbUserByEmail(targetEmail);
    expect(targetDbUser).toBeDefined();
    const targetUserId = targetDbUser.id;
    console.log('Fetched target user ID:', targetUserId);

    // 2. Register Admin user and elevate role in DB
    console.log('Registering Admin user...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByText('Sign up', { exact: true }).click();
    await page.getByPlaceholder('johndoe').fill(adminUser);
    await page.getByPlaceholder('John Doe').fill(`Admin User ${rand}`);
    await page.getByPlaceholder('name@domain.com').fill(adminEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Register Account")').click();
    await expect(page.locator('.profile-avatar-large')).toBeVisible();

    console.log('Elevating Admin user in DB...');
    await setDbUserRole(adminEmail, 'ADMIN');

    // Reload page to reflect role update
    await page.reload();

    // Verify "Admin" button is visible and click it
    await expect(page.locator('button:text-is("Admin")')).toBeVisible({ timeout: 10000 });
    await page.locator('button:text-is("Admin")').click();

    // 3. Assign Role MODERATOR to Target User
    console.log('Assigning MODERATOR role to target user...');
    const assignRolesForm = page.locator('form:has(label:has-text("System Role"))');
    await assignRolesForm.locator('input[placeholder*="550e8400"]').fill(targetUserId);
    await assignRolesForm.locator('select').selectOption('MODERATOR');
    await assignRolesForm.locator('button:has-text("Assign Role Permission")').click();

    // Verify success message
    await expect(page.getByText(`User ${targetUserId} role updated to MODERATOR!`, { exact: false })).toBeVisible();

    // Verify role update in database
    const updatedTargetDbUser = await getDbUserByEmail(targetEmail);
    expect(updatedTargetDbUser.role).toBe('MODERATOR');

    // 4. Ban Target User
    console.log('Banning target user...');
    const banForm = page.locator('form:has(label:has-text("Ban Reason"))');
    await banForm.locator('input[placeholder*="550e8400"]').fill(targetUserId);
    await banForm.locator('input[placeholder*="TOS"]').fill('Violated system guidelines');
    await banForm.locator('button:has-text("Restrict User Account")').click();

    // Verify success message
    await expect(page.getByText(`User ${targetUserId} has been successfully BANNED!`, { exact: false })).toBeVisible();

    // Verify audit log displays the ban action
    const auditRow = page.locator('tr').filter({ hasText: 'BAN_USER' }).filter({ hasText: targetUserId });
    await expect(auditRow).toBeVisible({ timeout: 10000 });

    // Log out Admin
    await page.locator('button:has-text("Log Out")').click();

    // 5. Try logging in as banned user to verify restriction
    console.log('Verifying login is restricted for the banned user...');
    await page.locator('button:has-text("Login / Register")').click();
    await page.getByPlaceholder('name@domain.com').fill(targetEmail);
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.locator('.modal-content-card button:has-text("Sign In")').click();

    // Verify error modal shows banned message
    await expect(page.getByText('Your account has been banned', { exact: false })).toBeVisible({ timeout: 10000 });
  });
});
