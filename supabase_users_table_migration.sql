-- ============================================
-- USERS TABLE MIGRATION
-- ============================================
-- This adds ALL missing columns to the users table
-- Based on the User interface in types.ts
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Check current schema (uncomment to run)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name;

-- Step 2: Refresh schema cache BEFORE changes
NOTIFY pgrst, 'reload schema';

-- ============================================
-- CORE COLUMNS (should already exist)
-- ============================================
-- id, uid (Firebase), email, password
-- created_at, is_active

-- ============================================
-- IDENTITY & PROFILE
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS surname TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS artist_trade_name TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Male', 'Female', 'Other'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthday DATE;

-- ============================================
-- MEMBERSHIP
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_member BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'none';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_months INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_status TEXT CHECK (membership_status IN ('active', 'trial', 'expired', 'cancelled'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS next_credit_drop TIMESTAMPTZ;

-- ============================================
-- FINANCIAL
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS store_credit NUMERIC DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credit_currency TEXT DEFAULT 'ZAR' CHECK (credit_currency IN ('ZAR', 'USD'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- Wallet (JSONB: {available: number, currency: string})
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wallet JSONB DEFAULT '{"available": 0, "currency": "ZAR"}'::jsonb;

-- ============================================
-- AFFILIATE SYSTEM
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_code TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_earnings NUMERIC DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_currency TEXT DEFAULT 'ZAR' CHECK (affiliate_currency IN ('ZAR', 'USD'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS currency_locked BOOLEAN DEFAULT FALSE;

-- AffiliateStats (JSONB object)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_stats JSONB DEFAULT '{}'::jsonb;

-- AffiliateStoreConfig (JSONB object)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS affiliate_store_config JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- USER DATA (JSONB)
-- ============================================

-- Wishlist (array of product IDs)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::jsonb;

-- Notifications (array of notification objects)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notifications JSONB DEFAULT '[]'::jsonb;

-- Social rewards tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_rewards JSONB DEFAULT '{}'::jsonb;

-- Social media handles
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS social_handles JSONB DEFAULT '{}'::jsonb;

-- Shipping address
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;

-- Admin permissions
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS admin_permissions JSONB DEFAULT '{}'::jsonb;

-- ============================================
-- ADMIN FLAGS
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================
-- TIMESTAMPS
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_users_is_member ON users(is_member);
CREATE INDEX IF NOT EXISTS idx_users_membership_tier ON users(membership_tier);

-- ============================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN users.name IS 'User display name';
COMMENT ON COLUMN users.surname IS 'User surname/family name';
COMMENT ON COLUMN users.artist_trade_name IS 'Artist/business name for makers';
COMMENT ON COLUMN users.is_member IS 'Whether user has active paid membership';
COMMENT ON COLUMN users.membership_tier IS 'Membership level (none, basic, premium, deluxe, etc.)';
COMMENT ON COLUMN users.loyalty_points IS 'Accumulated loyalty points for rewards';
COMMENT ON COLUMN users.affiliate_code IS 'Unique affiliate referral code';
COMMENT ON COLUMN users.affiliate_earnings IS 'Total affiliate commission earned';
COMMENT ON COLUMN users.wishlist IS 'Array of product IDs user has wishlisted';
COMMENT ON COLUMN users.notifications IS 'Array of notification objects';
COMMENT ON COLUMN users.social_rewards IS 'Tracking of completed social media tasks';
COMMENT ON COLUMN users.shipping_address IS 'Default shipping address object';
COMMENT ON COLUMN users.is_admin IS 'Administrator access flag';
COMMENT ON COLUMN users.admin_permissions IS 'Granular admin permission settings';

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICATION (uncomment to check)
-- ============================================

-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY column_name;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All User interface fields have been added
-- You should now be able to login successfully!
