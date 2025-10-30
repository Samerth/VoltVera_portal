# Overview

Voltverashop is a full-stack web application designed as a user management system with robust role-based authentication. It integrates a React frontend, Express.js backend, and PostgreSQL database. The application provides distinct admin and user dashboards, and features a comprehensive Binary Multi-Level Marketing (MLM) system with a pending recruits workflow, binary tree visualization, spillover management, email-based authentication, and extensive reporting for user performance, BV transactions, and income. The project aims to provide a complete MLM platform with a focus on user management, financial tracking, and transparent reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS, featuring a custom green gradient theme and Segoe UI typography.
- **State Management**: TanStack Query.
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.
- **Responsive Design**: Mobile-first adaptive layout.

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
- **Email Services**: User signup with verification and password reset.
- **Role-Based Dashboards**: Separate interfaces for admin and regular users.
- **Reporting & Analytics**: User Performance, BV Transactions, Monthly BV, and Fund History. Includes fund eligibility detection for various achievement levels (Car Fund, Travel Fund, etc.).
- **Wallet Management**: User E-Wallet balance, total earnings, and withdrawals.
- **Broadcast Notification System**: Admin feature for system-wide notifications.
- **ID Normalization**: Supports both UUID and Display ID formats.
- **KYC System**: User identity verification with document upload and admin review.

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

# Recent Changes (October 30, 2025)

## Feature Update: Rank Achievement Bonus Recipient Changed ✅ UPDATED (Oct 30, 2025)
- **Change**: Modified rank achievement bonus system to reward sponsors instead of users who achieve ranks
- **Previous Logic**: 
  - User achieves rank → User gets the rank + User receives the bonus
- **New Logic**:
  - User achieves rank → User gets the rank + **Sponsor receives the bonus**
- **Rationale**: Incentivizes sponsors to build strong teams by rewarding them when their downline achieves higher ranks
- **Implementation**:
  1. **Backend**: Updated `checkAndUpdateRank()` in `server/productionBVEngine.ts` (lines 360-434)
     - Fetch user's sponsor ID before rank update (lines 365-368)
     - Normalize sponsor ID to display format using `normalizeToDisplayId()` (line 371) - handles UUID and VVxxxx formats
     - Credit rank achievement bonus to sponsor's wallet with custom description (lines 427-428)
     - Description format: "Sponsor bonus for downline ${userId} rank achievement: ${ranksAchieved.join(' → ')}"
     - Edge case handling: If no sponsor exists, log warning and skip bonus credit (line 430)
  2. **creditWallet() Enhancement**: Added optional `customDescription` parameter (line 472)
     - Backward compatible - existing calls use default description
     - Allows specific transaction descriptions for special cases like rank bonuses
- **Files**: `server/productionBVEngine.ts`
- **Transaction Traceability**: Transaction records clearly show sponsor bonus for downline rank achievements
- **Example**: When user VV0005 achieves Gold Star rank, their sponsor VV0002 receives ₹10,000 with description: "Sponsor bonus for downline VV0005 rank achievement: Bronze Star → Gold Star"

## Feature Update: Paid Members Logic Changed ✅ UPDATED (Oct 28, 2025)
- **Change**: Modified "Paid Members" section criteria in admin dashboard
- **Previous Logic**: 
  - Active status + Approved KYC + Complete bank details + **Package Amount > 0**
- **New Logic**:
  - Active status + Approved KYC + Complete bank details + **Has made at least one transaction**
- **Rationale**: Package amount represents cumulative matched BV, but actual fund transfers are a better indicator of active paid members
- **Implementation**:
  1. **Backend**: Updated `getPaidMembers()` in `server/storage.ts` (line 499-583)
     - Replaced package amount check with: `EXISTS (SELECT 1 FROM transactions WHERE transactions.user_id = users.id)`
  2. **Frontend**: Updated descriptions in `client/src/pages/AdminDashboard.tsx` (lines 1957, 1973)
     - Changed from "active package" to "who have made transactions"
- **Files**: `server/storage.ts`, `client/src/pages/AdminDashboard.tsx`
- **Free Users Logic**: Unchanged - still shows users with package amount = 0 or null

# Recent Bug Fixes (October 30, 2025)

## Bug #9: packageAmount Field Out of Sync ✅ FIXED
- **Issue**: VV0001's `packageAmount` showed 21,000 but should have been 65,000 (matched BV)
- **Root Cause Investigation**:
  - Timeline discovered:
    - Oct 16, 06:29 - Last BV calculation ran correctly, set matching_bv to 21,000 (left=23K, right=21K)
    - Oct 16, 06:31 - **Manual database update** changed left_bv and right_bv to 65,000 each
    - ❌ Manual update bypassed BV engine and didn't update `packageAmount`
  - Only 1 user affected (VV0001), all other users were in sync
- **Impact**: 
  - packageAmount displayed incorrect matched BV value
  - Discrepancy between users table (65K left/right) and lifetime_bv_calculations table (23K left/21K right)
- **Fix Applied**:
  1. Ran SQL sync to update packageAmount: `UPDATE users SET package_amount = LEAST(left_bv, right_bv)`
  2. Updated 1 row: VV0001 from 21,000 → 65,000
  3. Verified all users now in sync ✅
- **Files**: Direct SQL update via `execute_sql_tool`
- **Important Note**: The `packageAmount` field is automatically maintained by `productionBVEngine.ts` line 293
  - Gets updated every time `updateBVForUser()` runs
  - Represents cumulative matched BV (min of left & right legs)
  - **Never manually update BV fields** - always use the BV calculation engine!
- **Prevention**: All BV updates must go through `productionBVEngine.ts` to maintain data integrity across:
  - `users` table (left_bv, right_bv, package_amount)
  - `lifetime_bv_calculations` table
  - `bv_transactions` table
  - `monthly_bv` table

## Bug #10: E-Wallet Transfers Incorrectly Counted as Monthly Income ✅ FIXED (Oct 30, 2025)
- **Issue**: Admin dashboard "Monthly Income" incorrectly included e-wallet fund transfers from admins
- **Root Cause**: `admin_credit` transaction type was included in monthly income calculation
- **Impact**: 
  - Monthly Income displayed ₹111,065 instead of correct ₹11,065
  - ₹100,000 admin_credit (manual wallet top-up) was counted as earned income
- **Fix Applied**:
  1. **Backend**: Updated `getAdminStats()` in `server/storage.ts` (line 889)
     - Removed `admin_credit` from monthly income transaction type filter
     - Added comment documenting excluded types
  2. **Monthly Income Now Includes Only**:
     - Earned income: sponsor_income, sales_bonus, sales_incentive, consistency_bonus
     - Fund rewards: car_fund, travel_fund, leadership_fund, house_fund, millionaire_club
     - Other income: franchise_income, royalty_income
  3. **Monthly Income Excludes**:
     - `admin_credit`, `admin_debit` (manual wallet adjustments by admins)
     - `withdrawal` (fund withdrawals)
     - `purchase` (product purchases)
- **Files**: `server/storage.ts`
- **Verification**: SQL query confirms correct calculation: sponsor_income (₹4,400) + sales_bonus (₹6,665) = ₹11,065
- **Frontend**: Added auto-refresh (30s interval) and stale time (10s) to admin stats query for real-time updates

## Bug #8: Dashboard Using Wrong BV Metric for Rank Qualification ✅ FIXED
- **Issue**: User dashboard compared **Matched BV** against rank requirements that are based on **Total BV** (left + right sum)
- **Root Cause**: Mismatch between metrics - rank qualification uses Total BV but dashboard API only returned Matched BV
- **Impact**: 
  - Progress bars showed incorrect percentages
  - Users saw lower values than actual qualification progress
  - Example: User with Left=65000, Right=65000 saw 65000 (matched) instead of 130000 (total) for rank progress
- **Fix Applied**:
  1. **Backend**: Updated `getTeamStats()` in `server/storage.ts` to return BOTH values:
     - `matchedBV`: min(left, right) - for income display
     - `totalTeamBV`: left + right - for rank qualification
  2. **Frontend**: Updated `TeamBusinessStages.tsx` to:
     - Display Team BVM (Matched) for income context
     - Display Total Team BV for rank qualification context
     - Use Total Team BV in progress bar calculations
- **Files**: `server/storage.ts`, `client/src/components/TeamBusinessStages.tsx`
- **Business Logic Clarification**:
  - **Rank Qualification**: Based on Total Team BV (left + right sum) per `checkAndUpdateRank` in `productionBVEngine.ts`
  - **Income Calculation**: Based on Matched BV (min of left & right) for differential income
  - Dashboard now correctly shows both metrics with clear labels