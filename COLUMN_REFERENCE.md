# Supabase Products Table - Column Reference

## CSV Columns vs Database Schema

Based on your CSV data, here's what columns exist vs. what needs to be added:

### ✅ Columns That SHOULD Already Exist (from CSV headers)

```sql
-- Core identity
id                          UUID PRIMARY KEY
name                        TEXT
description                 TEXT
sku                         TEXT

-- Pricing
price                       NUMERIC
price_usd                   NUMERIC

-- Catalog
category                    TEXT
status                      TEXT          -- published/draft
stock                       INTEGER

-- Rich data (JSONB)
images                      JSONB         -- ["url1", "url2", ...]
tags                        JSONB         -- ["tag1", "tag2", ...]
options                     JSONB         -- {complex product options object}

-- Reviews
rating                      NUMERIC
total_reviews               INTEGER

-- Timestamps
created_at                  TIMESTAMPTZ
updated_at                  TIMESTAMPTZ

-- Artist reference
artist_id                   TEXT or UUID
```

### ❌ Columns That Are MISSING (causing PGRST204 errors)

```sql
-- Maker info (3 columns)
made_by                     TEXT
back_office_link            TEXT
when_and_how_to_wear        TEXT

-- Additional pricing (8 columns)
compare_at_price            NUMERIC
compare_at_price_usd        NUMERIC
member_price                NUMERIC
member_price_usd            NUMERIC
cost_price                  NUMERIC
shipping_cost               NUMERIC
sold_count                  INTEGER
is_sold_out                 BOOLEAN

-- SEO (1 column)
seo_keywords                JSONB

-- Featured flags (11 columns)
is_new_arrival              BOOLEAN
is_best_seller              BOOLEAN
is_featured_ring            BOOLEAN
is_featured_bracelet        BOOLEAN
is_featured_watch           BOOLEAN
is_unique_pendant           BOOLEAN
is_featured_stud            BOOLEAN
is_featured_dangle          BOOLEAN
is_featured_jewelry_box     BOOLEAN
is_featured_perfume_holder  BOOLEAN
is_jewelry_set              BOOLEAN

-- Gift features (2 columns)
gift_product_id             TEXT
gift_value                  NUMERIC

-- Promotions (6 columns)
promo_price                 NUMERIC
promo_starts_at             TIMESTAMPTZ
promo_expires_at            TIMESTAMPTZ
promo_basic_member_price    NUMERIC
promo_premium_member_price  NUMERIC
promo_deluxe_member_price   NUMERIC

-- Product-specific options (6 columns)
ring_stock                  JSONB         -- {"5": 2, "6": 3, ...}
earring_materials           JSONB         -- [{"name": "...", "modifier": 30}, ...]
show_earring_options        BOOLEAN
pendant_chain_lengths       JSONB         -- {"Choker – 35 cm": true, ...}
pendant_wire_wrapped        BOOLEAN
chain_styles                JSONB         -- ["Metal Chain", "Leather Cord"]

-- Additional metadata (3 columns)
packaging                   JSONB         -- [{"id": "...", "name": "Box", ...}]
reviews                     JSONB         -- [{"user": "...", "rating": 5, ...}]
ads                         JSONB         -- [{"platform": "google", ...}]
```

## Total Column Count

- **Existing:** ~17 columns (from CSV)
- **Missing:** ~40 columns (causing errors)
- **Total needed:** ~57 columns

## Why the Mismatch?

Your CSV export only includes **basic fields**. The full Product interface has **50+ fields** for:
- Multiple pricing tiers (member, promo, compare-at)
- Feature flags (bestseller, new arrival, featured in categories)
- Product-specific options (ring sizing, earring materials, chain lengths)
- Rich metadata (packaging, reviews, ads)

These are stored in the `options` JSONB in the CSV but need dedicated columns for:
1. Better querying (WHERE clauses on flags)
2. Indexing (faster searches)
3. Type safety (BOOLEAN vs checking JSONB)

## CSV "options" Column

In your CSV, the `options` column contains a JSONB object like:
```json
{
  "type": "Pendant",
  "price": 299,
  "colors": ["Copper", "Purple"],
  "madeBy": "Spoil Me Vintage",           ← needs made_by column
  "material": "Epoxy Resin",
  "priceUSD": 60,
  "costPrice": 50,                        ← needs cost_price column
  "backOfficeLink": "https://...",        ← needs back_office_link column
  "compareAtPrice": 599,                  ← needs compare_at_price column
  "memberPrice": 239.2,                   ← needs member_price column
  "isBestSeller": false,                  ← needs is_best_seller column
  "whenAndHowToWear": "Perfect for...",   ← needs when_and_how_to_wear column
  ...
}
```

The app tries to extract these nested fields and save them as separate columns, but the columns don't exist!

## Migration Strategy

**Option 1: Add columns (Recommended)**
✓ Run `supabase_complete_migration.sql`
✓ Keeps existing data
✓ Adds 40 new columns
✓ Updates immediately

**Option 2: Keep everything in options JSONB**
✗ Harder to query (`options->>'madeBy'`)
✗ Can't index boolean flags
✗ Code expects separate columns
✗ Would require major refactoring

**We're doing Option 1** - add the columns to match what the code expects.

## After Migration

Your table will have proper structure:
```sql
-- Example product row
id: "db7c7bd6-811e-4fd3-be3d-4bb7da57648e"
name: "Citron Aura Bracelet"
price: 35.00
price_usd: 3.00
made_by: "Spoil Me Vintage"              ← ✓ Now exists!
back_office_link: null                   ← ✓ Now exists!
when_and_how_to_wear: "Perfect for..."   ← ✓ Now exists!
compare_at_price: 85.00                  ← ✓ Now exists!
member_price: 28.00                      ← ✓ Now exists!
is_featured_bracelet: true               ← ✓ Now exists!
is_best_seller: false                    ← ✓ Now exists!
ring_stock: {}                           ← ✓ Now exists!
earring_materials: []                    ← ✓ Now exists!
packaging: []                            ← ✓ Now exists!
...
```

All saves will work correctly! 🎉
