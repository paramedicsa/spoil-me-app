# 🚀 QUICK START: Fix Supabase Product Saves

## The Problem
- Products don't save to Supabase (save to localStorage instead)
- Console errors: `PGRST204: Could not find the 'column_name' column`
- Cannot login to admin (users table missing columns)

## The Solution (3 SQL Scripts)

### Step 1: Fix Login (Run First!)
📄 **File:** `supabase_users_table_migration.sql`

Open Supabase Dashboard → SQL Editor → Paste entire file → Run

✅ Adds 32 missing user columns
✅ Fixes authentication

---

### Step 2: Fix Products (Main Migration)
📄 **File:** `supabase_complete_migration.sql`

Open Supabase Dashboard → SQL Editor → Paste entire file → Run

✅ Adds 40+ missing product columns:
- Pricing: compare_at_price, member_price, cost_price, shipping_cost
- Inventory: sold_count, is_sold_out
- Marketing: 11 feature flags (is_new_arrival, is_best_seller, etc.)
- Options: ring_stock, earring_materials, pendant_chain_lengths
- Promo: promo_price, promo dates, promo member prices
- Metadata: made_by, back_office_link, when_and_how_to_wear
- JSONB: packaging, reviews, ads, seo_keywords
- Gifts: gift_product_id, gift_value

---

### Step 3: Add Critical Fields
📄 **File:** `supabase_missing_critical_fields.sql`

Open Supabase Dashboard → SQL Editor → Paste entire file → Run

✅ Adds 5 essential fields:
- `slug` - URL-friendly identifier (indexed, unique)
- `code` - Product SKU like SPV-001 (indexed, unique)
- `type` - Product type enum (Ring, Stud, Dangle, etc.)
- `colors` - Color options array (JSONB)
- `material` - Material description (TEXT)

---

### Step 4: Clear Browser Cache
**Windows:** `Ctrl + Shift + Delete` → Clear cached images and files  
**Mac:** `Cmd + Shift + Delete` → Clear cached images and files  
**Or:** Hard refresh with `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)

---

### Step 5: Test It!
1. Go to Admin → Products
2. Edit any product
3. Click Save
4. Open Console (F12)
5. **Verify:** No errors! ✅

---

## Verification Query

Run this in Supabase SQL Editor to verify all columns added:

```sql
SELECT COUNT(*) as total_columns 
FROM information_schema.columns 
WHERE table_name = 'products';
```

**Expected:** 60+ columns

---

## What Gets Fixed?

### Before:
```
❌ Error 400: Could not find the 'back_office_link' column
❌ Error 400: Could not find the 'member_price' column
❌ Products save to localStorage only
❌ Cannot login to admin
```

### After:
```
✅ No errors in console
✅ Products save to Supabase successfully
✅ All form fields mapped correctly
✅ Login works
✅ 60+ database columns match Product interface
```

---

## Field Name Conversion

The app automatically converts camelCase → snake_case:

| UI Field | Database Column |
|----------|-----------------|
| `madeBy` | `made_by` |
| `backOfficeLink` | `back_office_link` |
| `memberPrice` | `member_price` |
| `compareAtPrice` | `compare_at_price` |
| `soldCount` | `sold_count` |
| `isSoldOut` | `is_sold_out` |
| `isNewArrival` | `is_new_arrival` |
| `giftProductId` | `gift_product_id` |
| `promoPrice` | `promo_price` |
| `ringStock` | `ring_stock` |

No code changes needed—conversion is automatic!

---

## Need More Details?

📖 **Full Guide:** `UI_TO_DATABASE_SYNC_GUIDE.md`  
📋 **Field Reference:** `FINAL_MIGRATION_VERIFICATION.md`  
🔧 **Migration Docs:**
- `SUPABASE_MIGRATION_GUIDE.md` (Products)
- `URGENT_FIX_LOGIN.md` (Users)

---

## Support

If errors persist after migrations:

1. **Check console** for specific column name in error
2. **Verify migration ran:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'products' 
   AND column_name = 'your_missing_column';
   ```
3. **Refresh schema cache:**
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
4. **Restart browser** completely

---

## That's It! 🎉

Three SQL scripts → Clear cache → Done!

Products will now save directly to Supabase with all fields intact.
