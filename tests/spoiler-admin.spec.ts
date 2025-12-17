import { test, expect } from '@playwright/test';
import { promises as fs } from 'fs';

test.describe('SpoilMe Web Interactions', () => {
  test('APK Download and Admin Moderation', async ({ page }) => {
    // Part 1: APK Download Verification
    await page.goto('https://spoilme-edee0.web.app');
    const downloadLink = page.locator('a[href$=".apk"], button:has-text("Download for Android"), button:has-text("Get APK")');
    const downloadPromise = page.waitForEvent('download');
    await downloadLink.click();
    const download = await downloadPromise;
    const apkPath = await download.path();
    console.log(`Downloaded APK path: ${apkPath}`);
    expect(apkPath).toBeTruthy();
    await download.saveAs('C:\\tmp\\spoilme.apk'); // Use Windows path
    const stats = await fs.stat('C:\\tmp\\spoilme.apk');
    const apkSize = stats.size;
    expect(apkSize).toBeGreaterThan(0);

    // Part 2: Administrator Login and Spoiler Moderation
    const spoilerTitle = 'Test Spoiler - Matrix Resurrections Plot Twist - ' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
    await page.goto('https://spoilme-edee0.web.app'); // Assume admin login is on main page or /admin redirects
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', 'admin_user@example.com');
    await page.fill('input[type="password"], input[name="password"], input[placeholder*="password"]', 'admin_password');
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle'); // Wait for page to load after login
    // Check for admin dashboard element, e.g., a heading or specific text
    await expect(page.locator('text=Admin Dashboard')).toBeVisible(); // Adjust based on actual text
    const spoilerLocator = page.locator(`text=${spoilerTitle}`);
    await expect(spoilerLocator).toBeVisible();
    // Assume description is in a sibling or child element
    await expect(page.locator(`text=Neo was actually a program all along! Just kidding, it's about the blue pill.`)).toBeVisible();
    await page.click('button:has-text("Delete")'); // Or "Mark as Reviewed"
    await expect(page.locator('text=Success')).toBeVisible(); // Or check for disappearance/status change
  });
});
