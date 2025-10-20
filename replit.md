# Overview

Voltverashop is a full-stack web application designed as a user management system with robust role-based authentication. It integrates a React frontend with TypeScript, an Express.js backend, and a PostgreSQL database. The application leverages Replit's OAuth for authentication and provides distinct admin and user dashboards, offering comprehensive user management and a complete Binary Multi-Level Marketing (MLM) system. Key capabilities include a pending recruits workflow, binary tree visualization, spillover management, email-based authentication, and extensive reporting for user performance, BV transactions, and income.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite.
- **UI/Styling**: Shadcn/ui (built on Radix UI) and Tailwind CSS.
- **State Management**: TanStack Query for server state.
- **Routing**: Wouter for client-side routing.
- **Form Handling**: React Hook Form with Zod validation.
- **Design System**: Custom Voltverashop branding with a green gradient theme and Segoe UI typography.

## Backend Architecture
- **Framework**: Express.js with TypeScript and Node.js.
- **Authentication**: Replit OAuth via OpenID Connect and Passport.js.
- **Session Management**: Express sessions with PostgreSQL storage.
- **API Design**: RESTful API with role-based access control.
- **Database ORM**: Drizzle ORM for type-safe operations.
- **Build System**: esbuild for production bundling.

## Database Architecture
- **Database**: PostgreSQL with Neon serverless integration.
- **Schema Management**: Drizzle Kit for migrations.
- **Data Models**: Users (with Binary MLM structure), PendingRecruits, EmailTokens, Sessions, and enums for roles/statuses.
- **Connection**: Connection pooling with @neondatabase/serverless.
- **Binary Tree Structure**: Full referential integrity with foreign key constraints.

## Authentication & Authorization
- **OAuth Provider**: Replit's OpenID Connect.
- **Session Strategy**: Secure HTTP-only cookies with PostgreSQL store.
- **Role-Based Access**: Admin and user roles with middleware protection.
- **Security Features**: CSRF protection, secure cookie settings.
- **Admin Impersonation**: Bearer token-based system allowing admins to act as users with short-lived access tokens.

## Key Features
- **User Management**: CRUD operations for user accounts (admin only).
- **Binary MLM System**: Complete binary matrix with left/right positions and spillover.
- **Team Management**: Recruit tracking, pending recruits workflow, and binary tree visualization.
- **Email Services**: User signup with email verification and password reset via SendGrid.
- **Role-Based Dashboards**: Separate interfaces for admin and regular users with distinct metrics and functionalities.
- **Reporting & Analytics**:
    - **User Performance Report**: Comprehensive, user-grouped income and performance tracking.
    - **BV Transactions Report**: System-wide BV transaction tracking, including direct and differential income.
    - **Monthly BV Report**: Snapshots and tracking of monthly BV.
    - **Fund History**: Complete wallet transaction ledger with enhanced categorization.
- **Wallet Management**: User E-Wallet balance, total earnings, and withdrawals display.
- **Broadcast Notification System**: Admin feature to send system-wide notifications to active users.
- **ID Normalization**: Seamless support for both UUID and Display ID formats across the system.
- **BV Propagation**: Correct propagation of Business Volume up the binary tree.
- **Responsive Design**: Mobile-first adaptive layout.
- **Transaction Categorization & Module Organization** (October 17, 2025): ✅ WORKING
  - **Admin Withdrawal**: Renamed from "Withdraw Personally" for clarity
  - **Income History**: Moved to Income Reports module for proper categorization
  - **Withdrawal History**: New component in Withdrawal Management showing only withdrawal transactions with filters
  - **Fund History**: Enhanced with comprehensive filters (User ID/Email search, date range, transaction type dropdown) - shows E-wallet usage only (purchases, withdrawals, admin credits/debits), excludes all income transactions
  - **Income Categorization Fix**: Removed admin_credit from income types (it's E-wallet top-up, not income)
- **Admin Metrics Exclusion** (October 17, 2025): ✅ WORKING
  - All admin dashboard metrics now exclude admin user data (admin earns only for logic completion)
  - **Total Users**: Excludes admin accounts from count
  - **Active Users**: Excludes admin accounts from count  
  - **Total BV**: Calculated from non-admin users only
  - **Monthly Income**: Excludes transactions from admin users
  - **Total Purchases**: Excludes purchases made by admin users
  - Implementation: getUserStats() and getAdminStats() filter out users/transactions with role='admin'
- **User Management CSV Export Fix** (October 17, 2025): ✅ WORKING
  - Fixed CSV export to use ₹ (INR) symbol for all monetary values
  - Previously exported plain numbers that displayed as dollars in spreadsheet applications
  - Now includes ₹ symbol for: Total Package, E-wallet, Income, Total Withdraw columns
- **Rank Configuration Update** (October 18, 2025): ✅ WORKING
  - Updated all rank configurations to match official requirements
  - **Differential Income Percentages**: Executive 6%, Bronze Star 10%, Gold Star 12%, Emerald Star 14%, Ruby Star 16%, Diamond 18%, Wise President 20%, President 22%, Ambassador 24%, Deputy Director 26%, Director 28%, Founder 30%
  - **Team BV Ranges**: Updated from thousands to lakhs/crores (e.g., Bronze Star 1.25L, Gold Star 2.5L, Emerald Star 9L, Ruby Star 18L, Diamond 45L, etc.)
  - **Bonus Amounts**: Added all rank achievement bonuses (Bronze ₹5K to Founder ₹3.5Cr)
  - **Tour Rewards**: Added tour rewards for each rank (LDP, Goa, Jaipur, Thailand, Dubai, Switzerland, Australia, Tokyo, California)
  - Production BV engine automatically uses database configurations; test engine percentages updated
- **Critical Bug Fixes** (October 20, 2025): ✅ FIXED
  - **Fund History Amount Display Bug**: Fixed transaction amounts display to show debits as negative (red) and credits as positive (green) based on transaction type, not amount sign
    - **Issue**: Purchase/withdrawal transactions showed as positive amounts (+₹4,484) causing user confusion
    - **Fix**: Updated `formatAmount` function to check transaction type (purchase, withdrawal, admin_debit = debit/red; admin_credit = credit/green)
    - **Result**: All debit transactions now correctly display with negative symbol and red color (-₹4,484.00)
  - **Direct Income Double-Crediting Bug**: Fixed critical issue where direct income (sponsor_income) was incorrectly updating BOTH E-wallet balance AND totalEarnings
    - **Issue**: When child purchased product, parent's E-wallet and Income showed same value (both getting credited)
    - **Expected**: Only totalEarnings (Income) should increase for MLM income; E-wallet (balance) only for purchases
    - **Fix**: Updated `creditWallet` function in productionBVEngine.ts to differentiate income types from E-wallet credits
    - **Income Types** (only update totalEarnings): sponsor_income, sales_bonus, sales_incentive, consistency_bonus, franchise_income, car_fund, travel_fund, leadership_fund, house_fund, millionaire_club, royalty_income
    - **E-wallet Credits** (update both balance and totalEarnings): admin_credit only
    - **Result**: Direct income and differential income now correctly credit ONLY the Income column, NOT E-wallet balance
  - **Income History Report Bug**: Fixed blank user names and confusing income type terminology in Income Reports
    - **Issue 1**: User names, IDs, and emails were blank in Income History Report
    - **Root Cause**: SQL join was using `transactions.userId` (Display ID) with `users.id` (UUID), which never matched
    - **Fix**: Changed join condition from `eq(transactions.userId, users.id)` to `eq(transactions.userId, users.userId)` in storage.ts
    - **Issue 2**: Income types showed as "SPONSOR INCOME" and "SALES BONUS" which was confusing
    - **Fix**: Added `formatIncomeType()` function to map database values to user-friendly names
    - **Mappings**: sponsor_income → "Direct Income", sales_bonus → "Differential Income", and all other income types to readable names
    - **Result**: Income reports now correctly show user details and display user-friendly income type names consistent with user portal
  - **Admin Dashboard Metrics Bug**: Fixed incorrect data display for Total BV, Monthly Income, and Total Purchases
    - **Issue 1**: Total Business Volume showed 0 or incorrect values
    - **Root Cause**: Was reading from outdated `users.totalBV` column instead of `lifetimeBvCalculations.teamBv`
    - **Fix**: Updated to query `lifetimeBvCalculations` table and sum `teamBv` from all non-admin users
    - **Issue 2**: Monthly Income showed 0 or incorrect values
    - **Root Cause**: SQL join was using `eq(transactions.userId, users.id)` (Display ID with UUID), which never matched
    - **Fix**: Changed join to `eq(transactions.userId, users.userId)` to correctly match Display IDs
    - **Issue 3**: Total Purchases showed 0 or incorrect values
    - **Root Cause**: SQL join was using `eq(purchases.userId, users.id)` (Display ID with UUID), which never matched
    - **Fix**: Changed join to `eq(purchases.userId, users.userId)` to correctly match Display IDs
    - **Result**: All admin dashboard metrics now display accurate real-time data from production calculations
  - **User Dashboard Rank Requirements Bug**: Fixed incorrect rank requirements showing hardcoded values instead of database configurations
    - **Issue**: User dashboard showed wrong requirements for next rank (e.g., Bronze Star requirement showed ₹10,000 instead of ₹125,000)
    - **Root Cause**: Rank requirements were hardcoded in TeamBusinessStages component instead of fetching from rank_configurations table
    - **Fix**: Created `/api/rank-configurations` endpoint to fetch from database; updated frontend to use real-time data
    - **Result**: User dashboard now shows accurate rank requirements from database (Bronze Star ₹1.25L, Gold Star ₹2.5L, etc.) matching official MLM plan
  - **Differential Income Percentage Not Updating Bug** (October 20, 2025): ✅ FIXED
    - **Issue**: Differential income calculations used wrong percentage after parent became Bronze Star (stayed at 6% instead of updating to 10%)
    - **Root Causes**:
      1. `createRankAchievement()` in storage.ts used wrong SQL join - `eq(users.id, userId)` compared Display ID with UUID, so rank updates never happened
      2. No automatic rank checking during BV processing - ranks only checked after buyer's purchase, not parent's BV updates
    - **Fixes Applied**:
      1. Fixed `createRankAchievement()` to use `eq(users.userId, userId)` for correct Display ID matching
      2. Added `checkAndUpdateRank()` method to productionBVEngine.ts - automatically checks if user qualifies for higher rank based on current team BV
      3. Modified `processBVMatching()` to call `checkAndUpdateRank()` before calculating differential income, ensuring percentage uses updated rank
    - **Result**: Users now get correct differential income percentage immediately when they qualify for new rank (Executive 6% → Bronze Star 10% → Gold Star 12%, etc.)

# External Dependencies

## Authentication Services
- **Replit OAuth**: Primary authentication provider.
- **OpenID Client**: Handles OAuth flows.

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL hosting.
- **@neondatabase/serverless**: Connection pooling for database connections.

## UI/UX Libraries
- **Radix UI**: Headless UI components.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **React Hook Form**: Form state management.

## Development Tools
- **Vite**: Fast development server and build tool.
- **TypeScript**: Static type checking.
- **Drizzle**: Type-safe ORM.
- **TanStack Query**: Server state management.

## Session & Security
- **connect-pg-simple**: PostgreSQL session store.
- **Passport.js**: Authentication middleware.
- **Memoizee**: Function memoization.