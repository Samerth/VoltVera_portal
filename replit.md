# Overview

Voltverashop is a full-stack web application for user management with robust role-based authentication, integrating a React frontend, Express.js backend, and PostgreSQL database. It features distinct admin and user dashboards and a comprehensive Binary Multi-Level Marketing (MLM) system. Key functionalities include a pending recruits workflow, binary tree visualization, spillover management, email-based authentication, and extensive reporting for user performance, BV transactions, and income. The project aims to provide a complete MLM platform with a focus on user management, financial tracking, and transparent reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (Radix UI) and Tailwind CSS with a custom green gradient theme and Segoe UI typography.
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
- **Binary MLM System**: Complete binary matrix with left/right positions and spillover, including correct BV propagation, with rank qualification based on Matched BV (min of left & right legs) to encourage balanced team building. Rank achievement bonuses are credited to sponsors.
- **Team Management**: Recruit tracking, pending recruits workflow, and binary tree visualization.
- **Email Services**: User signup with verification and password reset.
- **Role-Based Dashboards**: Separate interfaces for admin and regular users.
- **Reporting & Analytics**: User Performance, BV Transactions, Monthly BV, and Fund History, including fund eligibility detection. Monthly Income calculations exclude admin credits/debits and withdrawals.
- **Wallet Management**: User E-Wallet balance, total earnings, and withdrawals.
- **Broadcast Notification System**: Admin feature for system-wide notifications.
- **ID Normalization**: Supports both UUID and Display ID formats.
- **KYC System**: User identity verification with document upload and admin review.
- **Paid Members Logic**: Defined by users with active status, approved KYC, complete bank details, and at least one transaction.

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

# Recent Bug Fixes (October 30, 2025)

## Bug #12: Differential Income Not Accumulating ✅ FIXED
- **Issue**: Differential income in `lifetime_bv_calculations` table was being overwritten with each transaction instead of accumulating
- **Impact**: 
  - Users saw only their LAST transaction's differential income instead of total lifetime earnings
  - Example: VV0001 showed ₹450 (last transaction only) instead of ₹1,260 (total from 7 transactions)
  - Screenshot showed 25,00,000 matched BV with ₹4,00,000 differential income which appeared incorrect
- **Root Cause**: 
  - Line 258 in `productionBVEngine.ts` was setting `diffIncome: diffIncome.toString()` - overwriting previous total
  - Should have been accumulating: `prevDiffIncome + diffIncome`
- **Fix Applied**:
  1. **Backend**: Modified `processBVMatching()` in `server/productionBVEngine.ts`
     - Added line 193: Track previous differential income: `const prevDiffIncome = parseFloat(currentRecord.diffIncome || '0');`
     - Added line 253: Calculate accumulated total: `const totalDiffIncome = prevDiffIncome + diffIncome;`
     - Updated line 264: Store accumulated total instead of transaction amount: `diffIncome: totalDiffIncome.toString()`
  2. **Database Sync**: Ran SQL update to fix all existing records:
     ```sql
     UPDATE lifetime_bv_calculations
     SET diff_income = COALESCE((
       SELECT SUM(diff_income::numeric)
       FROM bv_transactions
       WHERE bv_transactions.user_id = lifetime_bv_calculations.user_id
     ), 0);
     ```
     - Updated 9 user records with correct accumulated totals
- **Verification**:
  - VV0001: Now shows ₹1,260.00 (sum of 7 transactions) ✅
  - VV0002: Now shows ₹405.00 (sum of 3 transactions) ✅
  - All future transactions will correctly accumulate
- **Files**: `server/productionBVEngine.ts`
- **Business Impact**: Users now see their true lifetime differential income earnings, which is critical for MLM compensation tracking