# 🚨 URGENT: Fix Login Issues

## Problem
Cannot login to admin due to missing columns in `users` table:
- `membership_tier` 
- `affiliate_earnings`
- `name`
- And many more...

Same issue as products table - the database schema is incomplete!

## Quick Fix - Run BOTH Migrations

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar

### Step 2: Run Users Migration FIRST
1. Click "New query"
2. Open file: `supabase_users_table_migration.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click "Run" ✓

### Step 3: Run Products Migration
1. Click "New query" again
2. Open file: `supabase_complete_migration.sql`
3. Copy ALL contents
4. Paste into SQL Editor
5. Click "Run" ✓

### Step 4: Restart Supabase (Important!)
Since we're adding many columns, force a complete schema reload:
1. Go to Settings → General
2. Click "Restart project"
3. Wait 1-2 minutes

### Step 5: Clear Browser Cache & Retry Login
1. Close all browser tabs with your app
2. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
3. Clear "Cached images and files"
4. Open app in new tab
5. Try login again ✓

## What the Users Migration Adds

### Identity & Profile (7 columns):
- `name`, `surname`, `first_name`, `last_name`
- `artist_trade_name`, `gender`, `birthday`

### Membership (6 columns):
- `is_member`, `membership_tier`, `membership_months`
- `membership_status`, `trial_expires_at`, `next_credit_drop`

### Financial (4 columns):
- `store_credit`, `credit_currency`, `loyalty_points`, `wallet` (JSONB)

### Affiliate System (5 columns):
- `affiliate_code`, `affiliate_earnings`, `affiliate_currency`
- `currency_locked`, `affiliate_stats` (JSONB), `affiliate_store_config` (JSONB)

### User Data (6 columns):
- `wishlist` (JSONB array)
- `notifications` (JSONB array)
- `social_rewards` (JSONB object)
- `social_handles` (JSONB object)
- `shipping_address` (JSONB object)
- `admin_permissions` (JSONB object)

### Admin & Status (2 columns):
- `is_admin`, `is_active`

### Timestamps (2 columns):
- `created_at`, `updated_at` (with auto-update trigger)

**Total: ~32 new columns for users table**

## Column Name Mapping (camelCase → snake_case)

| App Field | Database Column |
|-----------|----------------|
| `name` | `name` |
| `surname` | `surname` |
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `artistTradeName` | `artist_trade_name` |
| `isMember` | `is_member` |
| `membershipTier` | `membership_tier` |
| `membershipMonths` | `membership_months` |
| `membershipStatus` | `membership_status` |
| `trialExpiresAt` | `trial_expires_at` |
| `nextCreditDrop` | `next_credit_drop` |
| `storeCredit` | `store_credit` |
| `creditCurrency` | `credit_currency` |
| `loyaltyPoints` | `loyalty_points` |
| `affiliateCode` | `affiliate_code` |
| `affiliateStats` | `affiliate_stats` |
| `affiliateEarnings` | `affiliate_earnings` |
| `affiliateCurrency` | `affiliate_currency` |
| `currencyLocked` | `currency_locked` |
| `affiliateStoreConfig` | `affiliate_store_config` |
| `socialRewards` | `social_rewards` |
| `socialHandles` | `social_handles` |
| `shippingAddress` | `shipping_address` |
| `adminPermissions` | `admin_permissions` |
| `isAdmin` | `is_admin` |
| `isActive` | `is_active` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## Error Messages Explained

### Before Migration:
```
❌ Could not find the 'membership_tier' column of 'users' in the schema cache
❌ Could not find the 'affiliate_earnings' column of 'users' in the schema cache
❌ Could not find the 'name' column of 'users' in the schema cache
❌ Failed to fetch user profile
```

### After Migration:
```
✅ User profile loaded successfully
✅ Login successful
✅ Admin access granted
```

## Troubleshooting

### Still can't login after migration?

1. **Check migration ran successfully:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name IN ('membership_tier', 'name', 'affiliate_earnings');
   ```
   Should return all 3 columns.

2. **Force schema refresh:**
   - Run: `NOTIFY pgrst, 'reload schema';` in SQL Editor
   - Or restart Supabase project

3. **Clear localStorage:**
   - Open browser console (F12)
   - Type: `localStorage.clear()`
   - Refresh page

4. **Check user exists:**
   ```sql
   SELECT id, email, is_admin FROM users WHERE email = 'your-email@example.com';
   ```

### Error: "column already exists"
✓ Safe to ignore - migration uses `IF NOT EXISTS`

### Error: "permission denied"
✗ Need admin/owner access to Supabase project

## After Both Migrations

You'll be able to:
- ✅ Login successfully
- ✅ Access admin panel
- ✅ Edit products without errors
- ✅ Change "Made By" field
- ✅ All user data persists correctly
- ✅ Membership tiers work
- ✅ Affiliate system functions
- ✅ Wishlist saves properly

## Files to Run (In Order)

1. `supabase_users_table_migration.sql` - **Run FIRST** (fixes login)
2. `supabase_complete_migration.sql` - **Run SECOND** (fixes products)

Both migrations are safe and use `IF NOT EXISTS` to avoid conflicts.

## Quick Test After Migration

1. Login to admin
2. Check console (F12) - should see no errors
3. Go to Products page
4. Edit a product
5. Change "Made By"
6. Save
7. Refresh page
8. Verify changes persisted ✓

All done! 🎉
