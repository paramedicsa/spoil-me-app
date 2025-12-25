# 🚀 **FIRESTORE TO SUPABASE MIGRATION - QUICK START**

## ✅ **What's Been Created**

Your monorepo now has complete Supabase migration infrastructure:

```
new-spoilme-app/
├── supabase/
│   └── schema.sql                    # Complete PostgreSQL schema with RLS
├── packages/utils/src/
│   ├── supabaseClient.ts             # Supabase client with helpers
│   └── supabase.types.ts             # TypeScript types for database
├── scripts/
│   ├── package.json                  # Migration scripts dependencies
│   ├── export-firestore.js           # Export from Firestore
│   ├── transform-data.js             # Transform to PostgreSQL format
│   ├── import-to-supabase.js         # Import to Supabase
│   └── migrate-storage.js            # (You need to create this)
├── .env.local.example                # Environment variables template
└── MIGRATION_GUIDE.md                # Detailed migration guide
```

---

## 🎯 **Migration Steps (30 minutes)**

### **Step 1: Create Supabase Project** (5 min)
1. Go to https://app.supabase.com
2. Click "New Project"
3. Save your credentials:
   - Project URL
   - `anon` key
   - `service_role` key

### **Step 2: Set Up Environment** (2 min)
```powershell
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials
notepad .env.local
```

### **Step 3: Create Database Schema** (3 min)
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Click "Run"
4. Verify tables created in Table Editor

### **Step 4: Export Firestore Data** (5 min)
```powershell
cd scripts

# Install dependencies
pnpm install

# Download Firebase service account JSON
# From: Firebase Console → Project Settings → Service Accounts
# Save as: scripts/firebase-service-account.json

# Export all Firestore collections
pnpm run export
```

**Output**: JSON files in `scripts/exports/`

### **Step 5: Transform Data** (2 min)
```powershell
# Transform Firestore format to PostgreSQL format
pnpm run transform
```

**Output**: Transformed JSON files in `scripts/exports-transformed/`

### **Step 6: Import to Supabase** (10 min)
```powershell
# Import all data to Supabase
pnpm run import
```

**Output**: All data in Supabase database

### **Step 7: Migrate Storage** (3 min)
Create storage buckets in Supabase Dashboard:
- Go to Storage
- Create buckets: `products`, `profiles`, `artist-portfolios`, `custom-designs`
- Download Firebase Storage files and re-upload (see MIGRATION_GUIDE.md)

---

## 🔧 **Update Application Code**

### **1. Install Supabase Package**
```powershell
cd ..
pnpm add @supabase/supabase-js
```

### **2. Remove Firebase**
```powershell
pnpm remove firebase
```

### **3. Update Imports**
Replace Firebase imports with Supabase:

**Before (Firebase):**
```typescript
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
```

**After (Supabase):**
```typescript
import { supabase, getDocuments } from '../supabaseClient';
```

### **4. Update Query Patterns**

**Firestore → Supabase Conversion:**

| Firestore | Supabase |
|-----------|----------|
| `collection(db, 'users')` | `supabase.from('users')` |
| `getDocs(query)` | `.select('*')` |
| `getDoc(doc(db, 'users', id))` | `.select('*').eq('id', id).single()` |
| `setDoc(doc(db, 'users', id), data)` | `.insert(data)` or `.upsert(data)` |
| `updateDoc(ref, data)` | `.update(data).eq('id', id)` |
| `deleteDoc(ref)` | `.delete().eq('id', id)` |
| `where('status', '==', 'active')` | `.eq('status', 'active')` |
| `orderBy('createdAt', 'desc')` | `.order('created_at', { ascending: false })` |
| `onSnapshot(ref, callback)` | `subscribeToTable('users', callback)` |

---

## 📊 **Database Schema Overview**

### **Main Tables:**
- `users` - User accounts (admin, artist, affiliate, member)
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Customer orders
- `affiliate_applications` - Affiliate program applications
- `artist_applications` - Artist partnership applications
- `vouchers` - Discount codes & gift cards
- `special_offers` - Promotional campaigns
- `winners` - Weekly contest winners
- `vault_items` - Loyalty rewards catalog
- `transactions` - Payouts and financial records
- `commission_records` - Affiliate commissions
- `push_tokens` - Push notification tokens
- `ad_campaigns` - Artist ad campaigns

### **Key Features:**
✅ Row Level Security (RLS) enabled
✅ Automatic `updated_at` triggers
✅ Foreign key relationships
✅ Indexed for performance
✅ Soft delete support (`deleted_at`)

---

## 🧪 **Testing**

### **Test Database Connection:**
```typescript
const { data, error } = await supabase.from('users').select('count');
console.log('Users count:', data);
```

### **Test Authentication:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
```

### **Test Storage:**
```typescript
const { data, error } = await supabase.storage
  .from('products')
  .upload('test.jpg', fileBlob);
```

---

## 🔐 **Security Checklist**

Before going live:

- [ ] All tables have RLS enabled
- [ ] RLS policies tested for all user roles
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never exposed to client
- [ ] Storage buckets have proper access policies
- [ ] Environment variables set in production
- [ ] Firebase credentials removed from client code
- [ ] Test authentication flow end-to-end

---

## 🆘 **Troubleshooting**

### **Error: "relation does not exist"**
→ Schema not created. Run `supabase/schema.sql` in SQL Editor

### **Error: "RLS policy violation"**
→ Add RLS policies or temporarily disable for testing:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

### **Error: "JWT expired" or auth issues**
→ Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

### **Import fails with foreign key errors**
→ Check import order in `import-to-supabase.js` (users before orders, etc.)

---

## 📚 **Next Steps**

1. ✅ Complete data migration using scripts above
2. 🔄 Update `StoreContext.tsx` to use Supabase (see TODO #3)
3. 🔄 Replace Firebase Storage in `imageUtils.ts` (see TODO #4)
4. 🔄 Replace Firebase Auth in `StoreContext.tsx` (see TODO #5)
5. 🧪 Test all CRUD operations
6. 🚀 Deploy to production

---

## 📖 **Documentation Links**

- [Full Migration Guide](./MIGRATION_GUIDE.md)
- [Supabase Docs](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

---

**Estimated Total Time**: 30-45 minutes
**Difficulty**: Medium
**Prerequisites**: Firebase service account JSON, Supabase account

🎉 **You're ready to migrate!** Follow the steps above and refer to `MIGRATION_GUIDE.md` for detailed instructions.
