# Overview

Voltverashop is a full-stack web application designed as a user management system with robust role-based authentication, integrating a React frontend, Express.js backend, and PostgreSQL database. It leverages Replit's OAuth for authentication and provides distinct admin and user dashboards. Key capabilities include a comprehensive Binary Multi-Level Marketing (MLM) system with a pending recruits workflow, binary tree visualization, spillover management, email-based authentication, and extensive reporting for user performance, BV transactions, and income.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS, with a custom green gradient theme and Segoe UI typography.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.

## Backend
- **Framework**: Express.js with TypeScript and Node.js.
- **Authentication**: Replit OAuth via OpenID Connect and Passport.js.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful API with role-based access control.
- **Database ORM**: Drizzle ORM.
- **Build System**: esbuild.

## Database
- **Database**: PostgreSQL with Neon serverless integration.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Models**: Users (with Binary MLM structure), PendingRecruits, EmailTokens, Sessions, and enums for roles/statuses.
- **Binary Tree Structure**: Full referential integrity with foreign key constraints.

## Authentication & Authorization
- **OAuth Provider**: Replit's OpenID Connect.
- **Session Strategy**: Secure HTTP-only cookies with PostgreSQL store.
- **Role-Based Access**: Admin and user roles with middleware protection.
- **Security Features**: CSRF protection, secure cookie settings.
- **Admin Impersonation**: Bearer token-based system for admin access.

## Key Features
- **User Management**: CRUD for user accounts (admin only).
- **Binary MLM System**: Complete binary matrix with left/right positions and spillover, including correct BV propagation.
- **Team Management**: Recruit tracking, pending recruits workflow, and binary tree visualization.
- **Email Services**: User signup with verification and password reset via SendGrid.
- **Role-Based Dashboards**: Separate interfaces for admin and regular users.
- **Reporting & Analytics**: User Performance, BV Transactions, Monthly BV, and Fund History.
- **Wallet Management**: User E-Wallet balance, total earnings, and withdrawals.
- **Broadcast Notification System**: Admin feature for system-wide notifications.
- **ID Normalization**: Supports both UUID and Display ID formats.
- **Responsive Design**: Mobile-first adaptive layout.

# External Dependencies

## Authentication Services
- **Replit OAuth**: Primary authentication provider.
- **OpenID Client**: Handles OAuth flows.
- **Passport.js**: Authentication middleware.

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting.
- **@neondatabase/serverless**: Connection pooling.
- **Drizzle ORM**: Type-safe ORM.

## UI/UX Libraries
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.
- **Shadcn/ui**: Component library.

## Development Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: Static type checking.
- **TanStack Query**: Server state management.

## Session & Security
- **connect-pg-simple**: PostgreSQL session store.
- **Memoizee**: Function memoization.
- **SendGrid**: Email services.

# Recent Features

## Fund Eligibility on Monthly BV Report (October 24, 2025)

### Overview
Enhanced the Monthly BV Report with fund eligibility detection and filtering, allowing admins to identify users qualified for Car Fund, Travel Fund, Leadership Fund, House Fund, and Millionaire Club based on PPT requirements.

### Implementation
- **Backend** (`server/productionBVRoutes.ts`):
  - Added `fundEligibility` object to each monthly BV record
  - Calculates eligibility based on rank, direct BV (self-repurchase), and team BV
  - Returns eligibility flags for all 5 fund types
  
- **Frontend** (`client/src/components/MonthlyBVReport.tsx`):
  - Added fund filter dropdown (All/Car/Travel/Leadership/House/Millionaire)
  - New summary cards showing count of users eligible for each fund
  - Added fund eligibility columns to table with colored badges (✓ or -)
  - Enhanced CSV export with all fund eligibility data
  - Filter dynamically updates table, statistics, and export

### Fund Requirements (from PPT)
| Fund | Rank | Direct BV/Month | Team BV/Month | Downline Achievers Required |
|------|------|-----------------|---------------|----------------------------|
| Car Fund | Emerald Star | 2,250 | 12,000 | None |
| Travel Fund | Ruby Star | 3,375 | 25,000 | 1 Car Fund |
| Leadership Fund | Diamond | 4,500 | 45,000 | 1 Car + 1 Travel |
| House Fund | Director | 6,750 | 75,000 | 1 Car + 1 Travel + 1 Leadership |
| Millionaire Club | Founder | 11,250 | 150,000 | 1 Car + 1 Travel + 1 Leadership + 1 Royalty |

### Important Terminology
- **"Self Repurchase" / "Self Purchase" / "User Purchase"** = Direct BV (purchases by **direct recruits**, stored in `monthBvDirects`)
  - This is NOT the user's own product purchases
  - This is BV from purchases made by users they directly recruited
- **selfBv** (database field) = The user's own product purchases (does NOT count for rank qualification)
- **Direct BV** (`monthBvDirects`) = Purchases by direct recruits (DOES count for fund eligibility)
- **Team BV** = Total downline purchases (left + right legs, excluding user's own purchases)

### Notes
- Downline achiever requirements not yet implemented (basic rank + BV criteria only)
- All funds reward 3% of Company Total BV according to PPT

# Recent Bug Fixes

## Critical BV Calculation Bugs (October 24, 2025)

### Overview
Fixed critical bugs where `selfBv` (user's own purchases) was being incorrectly used in calculations. Per business requirements, user's own purchases should NEVER be used for any calculations - only Direct BV (purchases by direct recruits) should be used.

### Bugs Fixed

#### 1. User Performance Report - Wrong BV Source ✅ FIXED
- **Issue**: `server/productionBVRoutes.ts` line 781 was using `selfBv` for "Lifetime Direct BV"
- **Impact**: Reports showed user's own purchases instead of their direct recruits' purchases
- **Fix**: Changed `lifetimeBV?.selfBv` to `lifetimeBV?.directsBv`
- **File**: `server/productionBVRoutes.ts`

#### 2. Test Simulation - selfBv Included in Team BV ✅ FIXED
- **Issue**: `server/bvTestSimulation.ts` line 271 was adding `selfBv` to `teamBV` calculation
- **Impact**: Test simulations showed inflated team BV values
- **Fix**: Removed `+ newSelfBV` from teamBV formula (now only `left + right`)
- **File**: `server/bvTestSimulation.ts`

#### 3. Frontend Labels - Confusing Terminology ✅ FIXED
- **Issue**: UI displayed "Self BV" without clarifying it's not used for calculations
- **Impact**: Users might think their own purchases count for ranks/income
- **Fix**: Updated labels to "Your Own Purchases" with notes that it's "Not used for rank qualification or income"
- **Files**: `client/src/pages/BVCalculations.tsx`, `client/src/pages/ProductCatalog.tsx`

### Verification
- ✅ Confirmed `checkAndUpdateRank` only uses `teamBV` (left + right downline) for rank qualification
- ✅ Confirmed `teamBV` calculation excludes `selfBv` everywhere
- ✅ Confirmed Direct BV (`directsBv`/`monthBvDirects`) is used for fund eligibility and direct income
- ✅ Confirmed `selfBv` is now ONLY used for tracking/display purposes

## Critical Direct BV Accumulation Bug (October 24, 2025)

### Bug #4: Lifetime directsBv Never Accumulates ✅ FIXED
- **Issue**: `server/productionBVEngine.ts` line 256 was missing `directsBv` in lifetime calculations update
- **Impact**: Lifetime Direct BV from direct recruits' purchases was never accumulated, always showing 0
- **Fix**: 
  - Added `prevDirectsBV` tracking (line 192)
  - Increment `newDirectsBV` when direct recruit purchases (line 219)  
  - Save `directsBv` to database (line 256)
- **File**: `server/productionBVEngine.ts`
- **Root Cause**: Code updated monthly `monthBvDirects` but forgot to update lifetime `directsBv` field

## Package Amount Tracking Bug (October 26, 2025)

### Bug #5: packageAmount Always 0 ✅ FIXED
- **Issue**: `users.packageAmount` field was defined but never populated during BV calculations
- **Impact**: Dashboard always showed packageAmount as 0 instead of the user's matched BV value
- **Fix Applied**:
  1. **Schema Fix**: Changed packageAmount type from `decimal` to `varchar` to match actual database column
  2. **Code Fix**: Added `packageAmount: newMatchingBV.toString()` to users table update in `processBVMatching` (line 293)
  3. **Data Backfill**: Ran SQL UPDATE to backfill packageAmount for existing users from their matching_bv in lifetime_bv_calculations table
- **Files**: `server/productionBVEngine.ts`, `shared/schema.ts`
- **Business Logic**: packageAmount now tracks the user's cumulative matched BV (min of left and right legs)
- **SQL Backfill Query**: `UPDATE users SET package_amount = lbc.matching_bv FROM lifetime_bv_calculations lbc WHERE users.user_id = lbc.user_id`

## Team BV Display Bug (October 26, 2025)

### Bug #6: Team BV Showing Total Instead of Matched BV ✅ FIXED
- **Issue**: Dashboard "Team BV" displayed the sum of left + right legs instead of the matched BV (minimum of both legs)
- **Impact**: Users saw inflated Team BV numbers that didn't reflect actual income-generating BV
- **Fix**: Updated `getTeamStats()` in `server/storage.ts` (line 1168-1178) to calculate and return matched BV: `Math.min(leftBV, rightBV)`
- **File**: `server/storage.ts`
- **Business Logic**: Team BV now correctly shows only the matched portion that generates differential income
- **Example**: If Left=21000 and Right=21000, Team BV now shows 21,000 (matched) instead of 42,000 (total)

## UI Terminology Consistency (October 28, 2025)

### Bug #7: Inconsistent "Team BV" Terminology Across UI ✅ FIXED
- **Issue**: Multiple places in the UI displayed "Team BV" instead of the more accurate "Team BVM" (Matched BV)
- **Impact**: Users might confuse total BV (left + right sum) with matched BV (min of left & right)
- **Locations Updated**:
  - User Dashboard: `TeamBusinessStages.tsx` - "Total Team BV" → "Team BVM (Matched)"
  - BV Calculations: `BVCalculations.tsx` - "Team BV Breakdown" → "Team BVM Breakdown"
  - User Performance Report: `UserPerformanceReport.tsx` - CSV headers and table columns updated
  - Monthly BV Report: `MonthlyBVReport.tsx` - CSV and table headers updated
  - Reports Guide: `ReportsGuide.tsx` - Descriptions and tooltips updated
  - BV Transactions: `BVTransactionsReport.tsx` - Headers and tooltips clarified
- **Files**: All frontend report components and dashboards
- **Business Logic**: "Team BVM" clearly indicates matched BV (minimum of left and right legs), avoiding confusion with total BV
- **Terminology**: Team BVM = Matched BV = min(Left BV, Right BV) - the portion that generates differential income

## KYC System Bugs (October 20, 2025)

### 1. KYC Re-upload Status Display Bug ✅ FIXED
- **Issue**: Admin panel showed stale KYC status after users re-uploaded documents
- **Root Cause**: Frontend caching - no auto-refresh mechanism
- **Fix**: Added 30-second auto-refresh + manual refresh button to both Pending and Rejected KYC admin sections
- **Files**: `client/src/components/AdminKYCSections.tsx`

### 2. Multi-Document Re-Upload Reversion Bug ✅ FIXED
- **Issue**: Users re-uploading multiple KYC documents after rejection would have their status incorrectly revert:
  - 1st re-upload: 'rejected' → 'pending' ✅
  - 2nd re-upload: 'pending' → 'rejected' ❌ (BUG)
  - 3rd+ re-uploads: continued reverting ❌
- **Root Cause**: Backend logic only checked if user WAS rejected (`wasRejected`), not if currently pending (`isPending`)
  - So 2nd re-upload used normal logic, found other rejected docs, reverted user status
- **Fix**: 
  1. Added `isPending` check in `storage.ts updateKYCDocument()` (lines 3429-3431, 3493-3495)
  2. Changed condition from `if (wasRejected)` to `if (wasRejected || isPending)`
  3. Added missing API route `PUT /api/kyc/documents/:id` for simple field updates (server/routes.ts lines 918-976)
- **Verification**: E2E test confirmed users can re-upload all documents and stay in 'pending' throughout
- **Files**: `server/storage.ts`, `server/routes.ts`