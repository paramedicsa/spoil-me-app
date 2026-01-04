# Supabase Products Table - Missing Columns Fix

## Problem
Your product updates are failing with error: `PGRST204: Could not find the 'back_office_link' column`

The app tries to save ~50 fields, but your Supabase `products` table only has ~20 columns.

## Root Cause
Your code converts field names from camelCase → snake_case:
- `madeBy` → `made_by`
- `backOfficeLink` → `back_office_link`
- `whenAndHowToWear` → `when_and_how_to_wear`

These columns don't exist in your database, causing 400 errors.

## Solution: Run Migration SQL

### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"

### Step 2: Run the Migration
1. Open file: `supabase_complete_migration.sql`
2. Copy ALL contents (Ctrl+A, Ctrl+C)
3. Paste into Supabase SQL Editor
4. Click "Run" button

### Step 3: Verify Success
Look for message: "Success. No rows returned"

If you see errors, share them in chat.

### Step 4: Refresh Browser
- Press **Ctrl+F5** (Windows) or **Cmd+Shift+R** (Mac)
- This clears PostgREST cache on client side

### Step 5: Test Product Update
1. Open AdminProducts page
2. Click "Edit" on any product
3. Change "Made By" field
4. Click "Save"
5. Check console (F12) - should see "Product saved successfully" ✓

## What the Migration Adds

### 40+ Missing Columns:

**Maker & Metadata:**
- `made_by` - Who created the product
- `back_office_link` - Supplier URL
- `when_and_how_to_wear` - Styling advice

**Pricing (8 columns):**
- `compare_at_price`, `compare_at_price_usd`
- `member_price`, `member_price_usd`
- `cost_price`, `shipping_cost`
- `sold_count`, `is_sold_out`

**SEO:**
- `seo_keywords` (JSONB array)

**Featured Flags (11 columns):**
- `is_new_arrival`, `is_best_seller`
- `is_featured_ring`, `is_featured_bracelet`, `is_featured_watch`
- `is_unique_pendant`, `is_featured_stud`, `is_featured_dangle`
- `is_featured_jewelry_box`, `is_featured_perfume_holder`
- `is_jewelry_set`

**Gift Features (2 columns):**
- `gift_product_id`, `gift_value`

**Promotional Pricing (6 columns):**
- `promo_price`, `promo_starts_at`, `promo_expires_at`
- `promo_basic_member_price`, `promo_premium_member_price`, `promo_deluxe_member_price`

**Product Options (6 columns):**
- `ring_stock` (JSONB) - Size availability
- `earring_materials` (JSONB) - Material options
- `show_earring_options` - Show selector
- `pendant_chain_lengths` (JSONB) - Length options
- `pendant_wire_wrapped` - Wire wrap flag
- `chain_styles` (JSONB) - Available styles

**Metadata (3 columns):**
- `packaging` (JSONB) - Packaging info
- `reviews` (JSONB) - Customer reviews
- `ads` (JSONB) - Ad configuration

## Current CSV Columns (Should Already Exist)
```
id, name, description, price, price_usd, category, images,
stock, status, sku, tags, options, rating, total_reviews,
created_at, updated_at, artist_id
```

## Column Name Mapping (camelCase → snake_case)

The app automatically converts field names when saving to Supabase:

| App Field (camelCase) | Database Column (snake_case) |
|----------------------|------------------------------|
| `madeBy` | `made_by` |
| `backOfficeLink` | `back_office_link` |
| `whenAndHowToWear` | `when_and_how_to_wear` |
| `compareAtPrice` | `compare_at_price` |
| `memberPrice` | `member_price` |
| `costPrice` | `cost_price` |
| `shippingCost` | `shipping_cost` |
| `soldCount` | `sold_count` |
| `isSoldOut` | `is_sold_out` |
| `seoKeywords` | `seo_keywords` |
| `isNewArrival` | `is_new_arrival` |
| `isBestSeller` | `is_best_seller` |
| `isFeaturedRing` | `is_featured_ring` |
| `isFeaturedBracelet` | `is_featured_bracelet` |
| `isFeaturedWatch` | `is_featured_watch` |
| `isUniquePendant` | `is_unique_pendant` |
| `isFeaturedStud` | `is_featured_stud` |
| `isFeaturedDangle` | `is_featured_dangle` |
| `isFeaturedJewelryBox` | `is_featured_jewelry_box` |
| `isFeaturedPerfumeHolder` | `is_featured_perfume_holder` |
| `isJewelrySet` | `is_jewelry_set` |
| `giftProductId` | `gift_product_id` |
| `giftValue` | `gift_value` |
| `promoPrice` | `promo_price` |
| `promoStartsAt` | `promo_starts_at` |
| `promoExpiresAt` | `promo_expires_at` |
| `promoBasicMemberPrice` | `promo_basic_member_price` |
| `promoPremiumMemberPrice` | `promo_premium_member_price` |
| `promoDeluxeMemberPrice` | `promo_deluxe_member_price` |
| `ringStock` | `ring_stock` |
| `earringMaterials` | `earring_materials` |
| `showEarringOptions` | `show_earring_options` |
| `pendantChainLengths` | `pendant_chain_lengths` |
| `pendantWireWrapped` | `pendant_wire_wrapped` |
| `chainStyles` | `chain_styles` |

## Troubleshooting

### Error: "column already exists"
✓ This is fine! The migration uses `IF NOT EXISTS`, so existing columns are skipped.

### Error: "permission denied"
✗ You need admin/owner access to the Supabase project.

### Products still not saving?
1. Check browser console (F12) for errors
2. Verify migration ran successfully: 
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'products' AND column_name = 'made_by';
   ```
   Should return: `made_by`

3. Check if PostgREST cache refreshed:
   - Restart Supabase project (Settings → General → Restart)
   - Or wait 5 minutes for auto-refresh

### Still seeing PGRST204 errors?
Share the exact error message - there might be additional columns missing.

## After Migration Success

You'll be able to:
✓ Edit "Made By" field in admin
✓ Edit ALL product fields without errors
✓ Save changes to Supabase (not just localStorage)
✓ See changes persist across browser refreshes
✓ Access product data from other devices

All your local products (currently in localStorage) will start syncing to Supabase!

## Files Created
- `supabase_complete_migration.sql` - **Use this one!** Complete migration with all columns
- `supabase_add_made_by_column.sql` - Old version, replaced by complete migration
- `supabase_products_complete_schema.sql` - Reference only, full CREATE TABLE

## Next Steps After Migration
1. ✓ Run migration
2. ✓ Verify product saves work
3. Consider: Export products from localStorage and re-save to populate Supabase
4. Consider: Add indexes for frequently queried columns (made_by, status, category)
