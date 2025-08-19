# Parallel Development Strategy: Invoicing + Continuous Improvements

## 🎯 Goal
Build the Invoicing feature while continuously shipping small improvements to production without conflicts.

## 🌳 Branching Strategy

### Main Branches
```
main (production)
  ├── feature/invoicing (long-running feature branch)
  └── hotfix/[quick-fixes] (short-lived branches)
```

### Workflow Diagram
```
main ─────●─────●─────●─────●─────●────→ (production)
          │     ↑     ↑     ↑     ↑
          │     │     │     │     │ (quick merges)
          │   fix1  fix2  fix3  fix4
          │
          └─────────────────────────────→ feature/invoicing
                    ↑           ↑
                    │           │ (periodic rebases from main)
                  rebase      rebase
```

## 📦 Implementation Approach

### 1. Initial Setup
```bash
# Create long-running feature branch for invoicing
git checkout -b feature/invoicing

# Create the invoicing structure WITHOUT affecting existing code
src/
├── components/
│   ├── invoicing/          # NEW - isolated folder
│   └── [existing folders]  # Untouched
├── app/
│   └── api/
│       ├── invoicing/       # NEW - isolated API routes
│       └── [existing]       # Untouched
```

### 2. Database Migrations Strategy

#### For Invoicing (feature branch):
```sql
-- database/migrations/pending/004_invoicing_system.sql
-- This file exists ONLY in feature/invoicing branch
-- Will be applied when feature is ready for production
```

#### For Quick Fixes (main branch):
```sql
-- database/migrations/003_small_fix.sql
-- Applied immediately to production
-- Keep migrations numbered sequentially
```

## 🚀 Daily Workflow

### Morning Routine
```bash
# 1. Start your day by syncing
git checkout feature/invoicing
git fetch origin
git rebase origin/main  # Get latest production changes

# 2. Continue invoicing work
# Work on invoicing features...
```

### When You Need a Quick Fix
```bash
# 1. Stash invoicing work if needed
git stash

# 2. Switch to main
git checkout main
git pull

# 3. Create hotfix branch
git checkout -b hotfix/improve-golden-visa-ui

# 4. Make your quick changes
# Edit files...

# 5. Test locally
npm run dev
# Verify changes work

# 6. Commit and push
git add .
git commit -m "fix: Improve Golden Visa form layout"
git push origin hotfix/improve-golden-visa-ui

# 7. Merge to main (via PR or directly)
git checkout main
git merge hotfix/improve-golden-visa-ui
git push origin main

# 8. Deploy using fast deployment
npm run build
tar -czf update-$(date +%Y%m%d-%H%M%S).tar.gz .next/standalone/ .next/static/ public/
# Follow FAST_DEPLOYMENT_GUIDE.md

# 9. Return to invoicing work
git checkout feature/invoicing
git rebase origin/main  # Get your hotfix
git stash pop  # If you stashed
```

## 🔧 Practical Examples

### Example 1: Fix a typo in Cost Overview
```bash
# From feature/invoicing branch
git checkout main
git pull
git checkout -b hotfix/cost-overview-typo

# Edit: src/components/cost-overview/sections/ClientDetailsSection.tsx
# Fix the typo

git add .
git commit -m "fix: Correct typo in cost overview section"
git checkout main
git merge hotfix/cost-overview-typo
git push

# Deploy
npm run build && tar -czf update-typo-fix.tar.gz .next/standalone/ .next/static/ public/
# SCP and apply on server

# Back to invoicing
git checkout feature/invoicing
git rebase origin/main
```

### Example 2: Add new field to Golden Visa
```bash
git checkout main
git pull
git checkout -b hotfix/golden-visa-field

# Edit: src/components/golden-visa/sections/ClientDetailsSection.tsx
# Add new field

# Test it works with existing code
npm run dev

git add .
git commit -m "feat: Add passport expiry field to Golden Visa"
git checkout main
git merge hotfix/golden-visa-field
git push

# Deploy immediately
# ... fast deployment steps ...

git checkout feature/invoicing
git rebase origin/main
```

## 🎭 Keeping Features Isolated

### DO's ✅
```typescript
// In feature/invoicing branch
// NEW file: src/components/invoicing/InvoiceTab.tsx
import { InvoicingDashboard } from './sections/InvoicingDashboard';

// Only add the tab conditionally in main portal
// src/components/portal/index.tsx
{process.env.NEXT_PUBLIC_FEATURE_INVOICING === 'true' && (
  <Tab value="invoicing">Invoicing</Tab>
)}
```

### DON'Ts ❌
```typescript
// Don't modify existing components in feature branch unless necessary
// Don't change shared utilities that might conflict
// Don't alter existing database tables
```

## 🔄 Periodic Integration

### Weekly Sync (Every Monday)
```bash
# Ensure invoicing branch has all production changes
git checkout feature/invoicing
git fetch origin
git rebase origin/main

# Run full test suite
npm run test
npm run build

# Fix any conflicts or issues
```

### Pre-Deployment Checklist (When Invoicing is Ready)
```bash
# 1. Final rebase
git checkout feature/invoicing
git rebase origin/main

# 2. Full testing
npm run test
npm run build

# 3. Create PR for review
git push origin feature/invoicing
# Create PR on GitHub

# 4. Run database migrations
ssh production-server
psql $DATABASE_URL < migrations/004_invoicing_system.sql

# 5. Merge to main
git checkout main
git merge feature/invoicing

# 6. Full deployment (since we added new features)
docker-compose build
docker-compose up -d
```

## 🛡️ Safety Measures

### 1. Feature Flags
```typescript
// .env.local (development)
NEXT_PUBLIC_FEATURE_INVOICING=true

// .env.production (initially)
NEXT_PUBLIC_FEATURE_INVOICING=false

// When ready to release
NEXT_PUBLIC_FEATURE_INVOICING=true
```

### 2. Database Safety
```sql
-- Always use IF NOT EXISTS for new tables
CREATE TABLE IF NOT EXISTS invoice_clients ...

-- Always check before adding columns
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS invoice_permissions JSONB;
```

### 3. Import Safety
```typescript
// Use dynamic imports for new features
const InvoicingTab = dynamic(
  () => import('./tabs/InvoicingTab'),
  { 
    ssr: false,
    loading: () => <TabSkeleton />
  }
);
```

## 📊 Tracking Progress

### Invoicing Development
- Use GitHub Project board for invoicing tasks
- Tag commits with `[INVOICING]` prefix
- Keep INVOICING_IMPLEMENTATION_GUIDE.md updated

### Quick Fixes
- Tag with `[HOTFIX]` prefix  
- Document in CHANGELOG.md
- Deploy immediately

## 🚨 Conflict Resolution

### If Rebase Conflicts Occur
```bash
# 1. Identify conflicts
git status

# 2. Resolve conflicts carefully
# Keep main branch changes for shared files
# Keep feature branch changes for new files

# 3. Continue rebase
git add .
git rebase --continue

# 4. Test thoroughly
npm run dev
npm run test
```

### Emergency Rollback
```bash
# If a hotfix breaks production
git checkout main
git revert HEAD
git push
# Fast deploy the revert

# Fix properly in a new branch
git checkout -b hotfix/proper-fix
```

## 📈 Benefits of This Approach

1. **Continuous Delivery**: Ship improvements daily/weekly
2. **Isolation**: Invoicing work doesn't block other fixes  
3. **Safety**: Production stays stable
4. **Flexibility**: Switch contexts easily
5. **Team Friendly**: Others can contribute fixes

## 🎯 Success Metrics

- ✅ Zero production disruptions
- ✅ 2-3 hotfixes deployed per week
- ✅ Invoicing feature progresses steadily
- ✅ Clean git history
- ✅ Easy rollbacks if needed

## 📝 Quick Reference Commands

```bash
# Start hotfix
alias start-fix='git checkout main && git pull && git checkout -b'

# Deploy quick
alias quick-deploy='npm run build && tar -czf update-$(date +%Y%m%d-%H%M%S).tar.gz .next/standalone/ .next/static/ public/'

# Back to invoicing  
alias back-to-work='git checkout feature/invoicing && git rebase origin/main'

# Check status
alias check-branches='git branch -vv'
```

---

**Remember**: The key is keeping the Invoicing feature isolated in its own branch and folder structure, while continuously merging main branch improvements into it. This way, you never block production improvements while building the big feature!