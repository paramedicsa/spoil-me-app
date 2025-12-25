import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker'; // For generating unique test data

// --- Configuration ---
const BASE_URL = 'http://localhost:3003';
const ADMIN_EMAIL = 'spoilmevintagediy@gmail.com';
const ADMIN_PASSWORD = 'your_admin_password'; // IMPORTANT: Replace with actual admin password
const COMMISSION_RATE = 0.10; // 10% commission

// --- Helper Functions ---
async function login(page: Page, email: string, password_val: string) {
    await page.goto(`${BASE_URL}/login`); // Adjust login path if different
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
    await page.fill('[data-testid="login-email-input"]', email);
    await page.fill('[data-testid="login-password-input"]', password_val);
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForURL(`${BASE_URL}/**`, {waitUntil: 'networkidle'}); // Wait for navigation after login
    // Add a more specific check for successful login, e.g., dashboard element
    await expect(page.locator('[data-testid="user-profile-icon"], [data-testid="admin-dashboard-link"], [data-testid="affiliate-dashboard-link"]')).toBeVisible();
}

async function logout(page: Page) {
    // Assuming a logout button exists somewhere, e.g., in a header or user menu
    // You might need to click a profile icon first to reveal the logout button
    if (await page.locator('[data-testid="user-menu-dropdown"]').isVisible()) {
        await page.click('[data-testid="user-menu-dropdown"]');
    }
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(`${BASE_URL}/**/login`, {waitUntil: 'networkidle'}); // Wait for redirection to login page
    await expect(page.locator('[data-testid="login-email-input"]')).toBeVisible();
}

test.describe('Affiliate Partnership Program E2E Flow', () => {
    let affiliateEmail: string;
    let affiliatePassword: string;
    let affiliateName: string;
    let generatedReferralCode: string;
    let productPrice: number;
    let expectedCommission: number;

    test.beforeEach(async ({ page }) => {
        // Generate unique data for each test run
        affiliateName = faker.person.fullName();
        affiliateEmail = faker.internet.email();
        affiliatePassword = faker.internet.password({ length: 10, memorable: false, pattern: /[A-Z0-9a-z!@#$%^&*()]/ });

        // Set a fixed product price for calculation
        productPrice = 50.00; // Example product price
        expectedCommission = productPrice * COMMISSION_RATE;
    });

    test('should allow an affiliate to register, earn commission, and see it in their dashboard', async ({ page, request }) => {
        test.setTimeout(120000); // Increase timeout for longer E2E flow

        // --- 1. Affiliate Registration ---
        console.log('Step 1: Registering affiliate...');
        await page.goto(`${BASE_URL}/register-affiliate`); // Adjust path
        await expect(page.locator('[data-testid="affiliate-signup-title"]')).toBeVisible();

        await page.fill('[data-testid="affiliate-name-input"]', affiliateName);
        await page.fill('[data-testid="affiliate-email-input"]', affiliateEmail);
        await page.fill('[data-testid="affiliate-password-input"]', affiliatePassword);
        await page.fill('[data-testid="affiliate-confirm-password-input"]', affiliatePassword); // Assuming confirm password field
        await page.click('[data-testid="affiliate-register-button"]');

        // Verify successful registration (e.g., redirection to login or dashboard)
        await page.waitForURL(`${BASE_URL}/**`, {waitUntil: 'networkidle'});
        await expect(page.locator('[data-testid="success-message"], [data-testid="login-email-input"]')).toBeVisible();
        console.log(`Affiliate registered: ${affiliateEmail}`);

        // --- 2. Admin Login and Verification (Optional Approval) ---
        console.log('Step 2: Admin login and verifying affiliate presence...');
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto(`${BASE_URL}/admin`); // Adjust admin dashboard path
        await expect(page.locator('[data-testid="admin-dashboard-title"]')).toBeVisible();

        await page.click('[data-testid="admin-nav-affiliates-tab"]'); // Click on Affiliates tab
        await expect(page.locator('[data-testid="affiliate-list-table"]')).toBeVisible();
        // Verify the new affiliate is in the list
        await expect(page.locator(`[data-testid="affiliate-row-${affiliateEmail}"]`)).toBeVisible();
        console.log('Admin verified affiliate presence.');

        // If there was an explicit approval button:
        // await page.click(`[data-testid="affiliate-approve-button-${affiliateEmail}"]`);
        // await expect(page.locator(`[data-testid="affiliate-status-${affiliateEmail}"]`)).toHaveText('Approved');

        await logout(page);
        console.log('Admin logged out.');

        // --- 3. Affiliate Login and Referral Code Retrieval ---
        console.log('Step 3: Affiliate login and retrieving referral code...');
        await login(page, affiliateEmail, affiliatePassword);
        await page.goto(`${BASE_URL}/affiliate-dashboard`); // Adjust affiliate dashboard path
        await expect(page.locator('[data-testid="affiliate-dashboard-title"]')).toBeVisible();

        // Verify initial earnings
        await expect(page.locator('[data-testid="affiliate-current-earnings"]')).toHaveText('$0.00'); // Assuming format

        // Retrieve the referral code
        generatedReferralCode = (await page.locator('[data-testid="affiliate-referral-code"]').textContent())?.trim() || '';
        expect(generatedReferralCode).not.toBe('');
        console.log(`Affiliate logged in. Referral Code: ${generatedReferralCode}`);

        await logout(page);
        console.log('Affiliate logged out.');

        // --- 4. Customer Purchase with Referral Code ---
        console.log('Step 4: Customer making a purchase with referral code...');
        const customerPage = await page.context().newPage(); // Use a fresh page/context for customer
        await customerPage.goto(`${BASE_URL}/products`); // Adjust product catalog path
        await expect(customerPage.locator('[data-testid="product-list-title"]')).toBeVisible();

        // Add a product to cart (assuming a specific product or the first one)
        await customerPage.click('[data-testid="product-item-1"] button[data-testid="add-to-cart-button"]');
        await expect(customerPage.locator('[data-testid="cart-item-count"]')).toHaveText('1'); // Verify item added
        await customerPage.click('[data-testid="go-to-checkout-button"]'); // Assuming a button to go to checkout

        await customerPage.waitForURL(`${BASE_URL}/checkout`); // Adjust checkout path
        await expect(customerPage.locator('[data-testid="checkout-page-title"]')).toBeVisible();

        // Apply referral code
        await customerPage.fill('[data-testid="referral-code-input"]', generatedReferralCode);
        await customerPage.click('[data-testid="apply-referral-code-button"]');
        await expect(customerPage.locator('[data-testid="referral-code-success-message"]')).toBeVisible();
        await expect(customerPage.locator('[data-testid="referral-code-success-message"]')).toHaveText('Referral code applied!'); // Example text

        // Fill in customer details (guest checkout)
        await customerPage.fill('[data-testid="customer-name-input"]', faker.person.fullName());
        await customerPage.fill('[data-testid="customer-email-input"]', faker.internet.email());
        await customerPage.fill('[data-testid="customer-address-input"]', faker.location.streetAddress());
        await customerPage.fill('[data-testid="customer-city-input"]', faker.location.city());
        await customerPage.fill('[data-testid="customer-zip-input"]', faker.location.zipCode());

        // Simulate payment (assuming a simple "Pay Now" button or mock payment gateway)
        await customerPage.click('[data-testid="pay-now-button"]');

        // Verify successful order placement
        await customerPage.waitForURL(`${BASE_URL}/order-confirmation/**`, {waitUntil: 'networkidle'}); // Adjust order confirmation path
        await expect(customerPage.locator('[data-testid="order-confirmation-title"]')).toBeVisible();
        await expect(customerPage.locator('[data-testid="order-status-message"]')).toHaveText('Your order has been placed successfully!');
        console.log('Customer purchase completed with referral code.');
        await customerPage.close(); // Close customer page

        // --- 5. Affiliate Dashboard Commission Verification ---
        console.log('Step 5: Verifying commission in affiliate dashboard...');
        await login(page, affiliateEmail, affiliatePassword);
        await page.goto(`${BASE_URL}/affiliate-dashboard`);
        await expect(page.locator('[data-testid="affiliate-dashboard-title"]')).toBeVisible();

        // Verify updated earnings
        await expect(page.locator('[data-testid="affiliate-current-earnings"]')).toHaveText(`$${expectedCommission.toFixed(2)}`);
        await expect(page.locator('[data-testid="affiliate-sales-count"]')).toHaveText('1'); // Verify sales count
        console.log(`Affiliate verified earnings: $${expectedCommission.toFixed(2)}`);

        await logout(page);
        console.log('Affiliate logged out.');

        // --- 6. Admin Dashboard Commission Verification (Data Integrity) ---
        console.log('Step 6: Verifying commission in admin dashboard...');
        await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
        await page.goto(`${BASE_URL}/admin`);
        await expect(page.locator('[data-testid="admin-dashboard-title"]')).toBeVisible();

        await page.click('[data-testid="admin-nav-affiliates-tab"]');
        await expect(page.locator('[data-testid="affiliate-list-table"]')).toBeVisible();

        // Verify the affiliate's performance metrics in admin view
        const affiliateRow = page.locator(`[data-testid="affiliate-row-${affiliateEmail}"]`);
        await expect(affiliateRow.locator('[data-testid="affiliate-row-sales"]')).toHaveText('1');
        await expect(affiliateRow.locator('[data-testid="affiliate-row-earnings"]')).toHaveText(`$${expectedCommission.toFixed(2)}`);
        console.log('Admin verified affiliate commission and sales count.');

        await logout(page);
        console.log('Admin logged out. Test finished successfully!');
    });

    // --- Edge Case: Invalid Referral Code (Example) ---
    test('should show an error for an invalid referral code during checkout', async ({ page }) => {
        console.log('Testing invalid referral code...');
        const customerPage = await page.context().newPage();
        await customerPage.goto(`${BASE_URL}/products`);
        await customerPage.click('[data-testid="product-item-1"] button[data-testid="add-to-cart-button"]');
        await customerPage.click('[data-testid="go-to-checkout-button"]');
        await customerPage.waitForURL(`${BASE_URL}/checkout`);

        await customerPage.fill('[data-testid="referral-code-input"]', 'INVALID-CODE-123');
        await customerPage.click('[data-testid="apply-referral-code-button"]');

        // Expect an error message and no discount applied
        await expect(customerPage.locator('[data-testid="referral-code-error-message"]')).toBeVisible();
        await expect(customerPage.locator('[data-testid="referral-code-error-message"]')).toHaveText('Invalid or expired referral code.');
        // Ensure total price doesn't change due to a non-existent discount
        // (You might need to assert the total price before and after applying the code if your UI shows a discount)
        console.log('Invalid referral code handled correctly.');
        await customerPage.close();
    });

    // --- Add more edge cases as separate tests ---
    // test('should handle purchase refunds by reversing commission', async ({ page }) => { /* ... */ });
    // test('should prevent unapproved affiliates from earning commission', async ({ page }) => { /* ... */ });
    // test('should handle affiliate login failures', async ({ page }) => { /* ... */ });
});
