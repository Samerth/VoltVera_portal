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

# Recent Bug Fixes (October 28, 2025)

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