# Database Setup Guide

## Quick Setup (Recommended)

### Step 1: Go to Supabase SQL Editor

1. Open https://supabase.com/dashboard
2. Select your project: `qoxtcncpcmdcmngzwdfu`
3. Click **SQL Editor** in the left sidebar
4. Click **+ New Query**

### Step 2: Run Each Migration File

You need to run the migration files **in order**. For each file:
1. Open the file in your code editor
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for "Success" message before proceeding to next file

### Migration Files (Run in This Order):

#### ✅ Migration 1: Phase 1 - Auth, Tenancy, RBAC
**File:** `drizzle/migrations/0000_phase1_auth_tenancy_rbac.sql`

This creates:
- Tenants table
- Users table  
- User roles table
- Invitations system
- Row Level Security policies
- Helper functions

#### ✅ Migration 2: Phase 2 - Stock Management
**File:** `drizzle/migrations/0001_stock_fulfilment_and_audit.sql`

This creates:
- Products table
- Stock requests table
- Audit logs table
- Stock fulfillment functions
- Stock request approval workflow

#### ✅ Migration 3: Phase 3 - Sales & Targets
**File:** `drizzle/migrations/0002_phase3_sales_and_targets.sql`

This creates:
- Sales entries table
- Targets table
- Sales recording function
- Target tracking functions
- Behind-pace detection

#### ✅ Migration 4: Phase 4 - Reporting
**File:** `drizzle/migrations/0003_phase4_reporting.sql`

This creates:
- Report generation functions
- Dashboard KPI functions
- Recent audit logs function

#### ✅ Migration 5: Phase 5 - Automation & Notifications
**File:** `drizzle/migrations/0004_phase5_automation.sql`

This creates:
- Notification preferences table
- Notifications table (audit trail)
- Daily reminder functions
- Low stock alert functions
- Behind pace alert functions
- CSV export function

---

## After Running All Migrations

### Step 3: Verify Setup

Run this query in SQL Editor to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see these tables:
- audit_logs
- invitations
- notification_preferences
- notifications
- products
- sales_entries
- stock_requests
- targets
- tenants
- user_roles
- users

### Step 4: Register Your First User

1. Go back to your app: http://localhost:8080
2. Click **Register** (not login)
3. Fill in:
   - Business Name (e.g., "Acme Corp")
   - Your Name
   - Email
   - Password
4. Click **Register**

This will:
- Create a tenant (your business)
- Create your user account
- Assign you the "owner" role
- Redirect you to the Owner dashboard

### Step 5: Invite Team Members (Optional)

From the Owner dashboard:
1. Navigate to **Team** page
2. Click **Invite Member**
3. Enter email and select role:
   - **Manager** - Can view all data, manage team
   - **Storekeeper** - Manages inventory, approves requests
   - **Sales Rep** - Submits sales, requests stock
4. They'll receive an invitation link to join your tenant

---

## Troubleshooting

### "relation does not exist" Error

**Cause:** Migration files not run or run out of order

**Fix:** 
1. Drop all tables (if any exist)
2. Run migrations again in the exact order listed above

To drop all tables, run:
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run all 5 migrations.

### "No business or invitation is linked to this account" Error

**Cause:** You logged in instead of registering

**Fix:**
1. Logout
2. Click **Register** (not Login)
3. Complete registration to create your tenant

Or manually create a tenant and user in SQL Editor (not recommended).

### Migration Fails with Syntax Error

**Cause:** SQL file copied incorrectly or partially

**Fix:**
1. Open the migration file again
2. Select ALL content (Ctrl+A)
3. Copy and paste into SQL Editor
4. Ensure no content is truncated

### Permission Errors

**Cause:** RLS policies not applied correctly

**Fix:**
1. Verify you ran Phase 1 migration completely
2. Check that service_role key is set in .env
3. Restart dev server after adding service_role key

---

## Quick Command Reference

```bash
# Start dev server
npm run dev

# Check environment variables
cat .env

# Format code
npm run format

# Run linter
npm run lint
```

---

## What Each Role Can Do

### 👑 Owner
- Access to all features
- Business-wide analytics
- Revenue tracking
- Team management
- Report exports
- Approval workflows

### 👔 Manager  
- View team performance
- Daily submission tracking
- Stock request approvals
- Behind-pace alerts
- Report generation

### 📦 Storekeeper
- Manage inventory
- Approve/reject stock requests
- Track stock levels
- Low-stock monitoring
- Daily fulfillment count

### 💼 Sales Rep
- Submit daily sales
- Track personal targets
- Request stock
- View own performance
- Submission reminders

---

## Next Steps After Setup

1. ✅ Run all 5 migrations
2. ✅ Register as Owner
3. ✅ Invite team members
4. ✅ Add products (from Storekeeper or Owner role)
5. ✅ Set monthly targets (from Manager or Owner role)
6. ✅ Configure notification preferences (Settings page)
7. ✅ Test sales submission workflow
8. ✅ Test stock request workflow
9. ✅ Export reports (CSV)

---

## Need Help?

Common questions:
- **Q: Can I delete test data?**  
  A: Yes, delete from audit_logs, sales_entries, stock_requests. Keep tenants/users.

- **Q: How do I reset everything?**  
  A: Drop and recreate schema (see Troubleshooting section above)

- **Q: Where are the notification emails sent?**  
  A: Currently only logged to database. Email delivery requires SendGrid/AWS SES setup.

- **Q: Can I use this in production?**  
  A: Yes! But ensure you:
    - Use strong passwords
    - Enable 2FA on Supabase
    - Set up email service for notifications
    - Deploy Edge Functions for scheduled jobs
    - Monitor audit logs regularly

Good luck! 🚀
