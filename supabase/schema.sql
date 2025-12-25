-- ========================================
-- SPOILME SUPABASE SCHEMA
-- Migration from Firestore to PostgreSQL
-- ========================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT, -- For legacy Firestore password users
    phone TEXT,
    profile_image TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_member BOOLEAN DEFAULT FALSE,
    is_artist BOOLEAN DEFAULT FALSE,
    is_affiliate BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    membership_tier TEXT DEFAULT 'none', -- 'none', 'basic', 'premium', 'elite'
    loyalty_points INTEGER DEFAULT 0,
    wishlist TEXT[] DEFAULT '{}',
    notifications JSONB DEFAULT '[]',
    
    -- Shipping
    shipping_address JSONB,
    
    -- Affiliate Data
    affiliate_code TEXT UNIQUE,
    affiliate_stats JSONB DEFAULT '{"status": "none", "totalSalesCount": 0, "totalSalesValue": 0, "commissionRate": 10, "balance": 0, "tier": "bronze", "milestones": [], "eliteMember": false, "contentAccess": false}',
    affiliate_parent_id UUID REFERENCES users(id),
    affiliate_referred_by TEXT,
    
    -- Artist Data
    artist_trade_name TEXT,
    contact_number TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    account_closure_reason TEXT
);

-- ========================================
-- PRODUCTS TABLE
-- ========================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    images TEXT[] DEFAULT '{}',
    stock INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
    
    -- Product Details
    sku TEXT,
    tags TEXT[] DEFAULT '{}',
    options JSONB DEFAULT '{}', -- Color, size, etc.
    
    -- Ratings & Reviews
    rating DECIMAL(2, 1) DEFAULT 0,
    reviews JSONB DEFAULT '[]',
    total_reviews INTEGER DEFAULT 0,
    
    -- Special Features
    is_custom BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_special_offer BOOLEAN DEFAULT FALSE,
    discount_percentage INTEGER DEFAULT 0,
    
    -- Artist Product
    artist_id UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    views INTEGER DEFAULT 0
);

-- ========================================
-- CATEGORIES TABLE
-- ========================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    parent_category_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ORDERS TABLE
-- ========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    
    -- Order Details
    items JSONB NOT NULL, -- Array of cart items
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Payment
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    transaction_id TEXT,
    
    -- Shipping
    shipping_address JSONB,
    tracking_number TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
    
    -- Voucher/Affiliate
    voucher_code TEXT,
    affiliate_code TEXT,
    points_earned INTEGER DEFAULT 0,
    points_redeemed INTEGER DEFAULT 0,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- ========================================
-- AFFILIATE APPLICATIONS TABLE
-- ========================================
CREATE TABLE affiliate_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    reason TEXT,
    socials TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- ARTIST APPLICATIONS TABLE
-- ========================================
CREATE TABLE artist_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    artist_trade_name TEXT,
    contact_number TEXT NOT NULL,
    email TEXT NOT NULL,
    product_images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- VOUCHERS TABLE
-- ========================================
CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed', 'gift_card'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Gift Card Specific
    recipient_email TEXT,
    recipient_name TEXT,
    sender_name TEXT,
    message TEXT,
    balance DECIMAL(10, 2),
    
    -- Metadata
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- SPECIAL OFFERS TABLE
-- ========================================
CREATE TABLE special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percentage INTEGER,
    product_ids UUID[] DEFAULT '{}',
    category TEXT,
    banner_image TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- WINNERS TABLE (Weekly Contest)
-- ========================================
CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name TEXT NOT NULL,
    prize TEXT NOT NULL,
    week_number INTEGER NOT NULL,
    year INTEGER NOT NULL,
    announced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- VAULT ITEMS TABLE (Loyalty Rewards)
-- ========================================
CREATE TABLE vault_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    image TEXT,
    category TEXT, -- 'product', 'voucher', 'experience'
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- TRANSACTIONS TABLE (Affiliate Payouts)
-- ========================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL, -- 'affiliate_payout', 'artist_payout', 'commission', 'refund'
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    method TEXT, -- 'bank_transfer', 'paypal', etc.
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- COMMISSION RECORDS TABLE
-- ========================================
CREATE TABLE commission_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    sale_amount DECIMAL(10, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid'
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- PUSH TOKENS TABLE
-- ========================================
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL, -- 'web', 'native', 'ios', 'android'
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- AD CAMPAIGNS TABLE (Artist Ads)
-- ========================================
CREATE TABLE ad_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES users(id),
    package_type TEXT NOT NULL, -- 'basic', 'pro', 'premium'
    product_ids UUID[] DEFAULT '{}',
    total_cost DECIMAL(10, 2) NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_affiliate_code ON users(affiliate_code);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_is_affiliate ON users(is_affiliate);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_artist_id ON products(artist_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_commission_records_affiliate_id ON commission_records(affiliate_id);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users: Can read own data, admins read all
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert users" ON users FOR INSERT WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Admins can delete users" ON users FOR DELETE USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Products: Public read, admin/artist write
CREATE POLICY "Anyone can view published products" ON products FOR SELECT USING (status = 'published' OR (SELECT is_admin FROM users WHERE id = auth.uid()) OR artist_id = auth.uid());
CREATE POLICY "Admins and artists can insert products" ON products FOR INSERT WITH CHECK ((SELECT is_admin FROM users WHERE id = auth.uid()) OR (SELECT is_artist FROM users WHERE id = auth.uid()));
CREATE POLICY "Admins and product owners can update products" ON products FOR UPDATE USING ((SELECT is_admin FROM users WHERE id = auth.uid()) OR artist_id = auth.uid());
CREATE POLICY "Admins can delete products" ON products FOR DELETE USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Orders: Users see own, admins see all
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Affiliate Applications: Own view, admin view all
CREATE POLICY "Users can view own applications" ON affiliate_applications FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can submit applications" ON affiliate_applications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Artist Applications: Same as affiliate
CREATE POLICY "Users can view own artist applications" ON artist_applications FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can submit artist applications" ON artist_applications FOR INSERT WITH CHECK (user_id = auth.uid());

-- Transactions: Own view, admin manage
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));
CREATE POLICY "Admins can manage transactions" ON transactions FOR ALL USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- Commission Records: Affiliate view own, admin view all
CREATE POLICY "Affiliates view own commissions" ON commission_records FOR SELECT USING (affiliate_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));

-- Push Tokens: Users manage own tokens
CREATE POLICY "Users manage own push tokens" ON push_tokens FOR ALL USING (user_id = auth.uid());

-- Public tables (no RLS needed)
-- categories, special_offers, winners, vault_items, vouchers (public read)

-- ========================================
-- TRIGGERS FOR UPDATED_AT
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vouchers_updated_at BEFORE UPDATE ON vouchers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_special_offers_updated_at BEFORE UPDATE ON special_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
