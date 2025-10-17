# Overview

Voltverashop is a full-stack web application built as a user management system with role-based authentication. The application features a React frontend with TypeScript, an Express.js backend, and PostgreSQL database integration. It implements Replit's OAuth authentication system and provides both admin and user dashboards with comprehensive user management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for development/build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation resolvers
- **Design System**: Custom Voltverashop branding with green gradient theme and Segoe UI typography

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Authentication**: Replit OAuth integration using OpenID Connect with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple
- **API Design**: RESTful API endpoints with role-based access control
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Build System**: esbuild for production bundling with ESM modules

## Database Architecture
- **Database**: PostgreSQL with Neon serverless integration
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Models**: 
  - Users table with Binary MLM structure (sponsorId, parentId, leftChildId, rightChildId, position, level)
  - PendingRecruits table for admin approval workflow
  - EmailTokens table for email verification and password reset
  - Sessions table for secure session storage
  - Enums for user roles and statuses
- **Connection**: Connection pooling with @neondatabase/serverless
- **Binary Tree Structure**: Full referential integrity with foreign key constraints for tree relationships

## Authentication & Authorization
- **OAuth Provider**: Replit's OpenID Connect implementation
- **Session Strategy**: Secure HTTP-only cookies with PostgreSQL session store
- **Role-Based Access**: Admin and user roles with middleware protection
- **Security Features**: CSRF protection, secure cookie settings, and automatic session management
- **Admin Impersonation**: Bearer token-based impersonation system allowing admins to act as users
  - Centralized token management via shared `impersonation.ts` module
  - One-time codes exchanged for short-lived access tokens (5-minute expiry)
  - Token validation across all routes via unified `requireAuth` middleware
  - Priority: Bearer token (impersonation) → Session auth (normal)
  - Works seamlessly across all MLM endpoints (purchases, wallet, KYC, transactions, etc.) ✅ FIXED (October 15, 2025)

## Key Features
- **User Management**: Full CRUD operations for user accounts (admin only)
- **Binary MLM System**: Complete binary matrix structure with left/right positions ✅ WORKING
- **Team Management**: Enhanced recruit tracking with Package Amount, Registration Date, Activation Date, ID Status, Position ✅ WORKING
- **Pending Recruits Workflow**: Users submit recruitment requests, admins process and approve ✅ WORKING
- **Binary Tree Visualization**: Interactive visual representation of the binary MLM structure ✅ WORKING
- **Spillover System**: Automatic placement of new recruits using balanced spilling algorithm ✅ WORKING
- **Email-Based Authentication**: User signup with email verification and password reset via SendGrid ✅ WORKING
- **Role-Based Dashboards**: Separate interfaces for admin and regular users
- **Team Business Stages Dashboard**: User dashboard displays comprehensive business metrics including current rank, rank progression, BV metrics, and next rank requirements (October 15, 2025) ✅ WORKING
- **Admin Dashboard Metrics**: Fixed admin statistics to exclude admin users from BV calculations, calculate real monthly income from transactions, and replace dummy data with actual pending actions (October 15, 2025) ✅ WORKING
- **Team Module Navigation**: Hidden "Position Decisions" and "Team Business Stages" tabs from team module, showing only Direct, Downline, and Binary Tree tabs (October 15, 2025) ✅ WORKING
- **User Portal Direct Section**: Hidden the "Pending Recruits" section from user portal's direct team view (October 17, 2025) ✅ WORKING
  - Users no longer see pending recruit submission status in their direct team tab
  - Pending recruits workflow still functional on backend
  - Only admins can view and process pending recruits via admin dashboard
- **Income Reports Module**: Comprehensive income tracking with filtering, export, and categorization (Direct, ROI, Salary) in admin dashboard. Features include:
  - Direct Income: Sponsor income from direct recruits
  - ROI Income: Sales incentives and bonuses
  - Salary Income: Consistency bonuses and leadership funds
  - Advanced filtering by transaction type and date range
  - CSV export functionality with detailed transaction records
  - Real-time data synchronization
  - User search by display ID, name, or email
  - Bug Fix: Replaced SQL ANY() with Drizzle's inArray() for proper array filtering
  (October 16, 2025) ✅ WORKING & TESTED
- **BV Transactions Report**: System-wide BV transaction tracking report for admin oversight (October 16, 2025) ✅ WORKING & TESTED
  - Complete transaction history for all users in the system
  - Displays both Direct Income (10% sponsor commission) and Differential Income (matching income from BV calculations)
  - Shows initiating user (who triggered each BV calculation via their purchase)
  - Real-time filtering by user (ID/name/email), transaction type, and date range
  - Summary statistics: total transactions, total direct income, total differential income
  - CSV export with comprehensive transaction details
  - Proper joins with users and purchases tables for complete data visibility
  - Located in Admin Dashboard → Income Reports → BV Transactions Report
- **BV Propagation System**: Fixed critical database constraint issue preventing BV from flowing up the binary tree
  - Root Cause: monthly_bv table had foreign key constraint pointing to legacy backup table (users_bv_backup) instead of main users table
  - Impact: Purchase BV was credited to buyer's self_bv but failed to propagate to upline parent's left/right BV
  - Resolution: Dropped incorrect constraint (fk_monthly_bv_user_bvtest) and added correct constraint pointing to users(user_id)
  - Verification: BV now correctly flows from child purchases up through parent's left/right legs with proper matching calculations
  (October 16, 2025) ✅ CRITICAL FIX COMPLETED
- **Email Verification**: Secure signup process requiring email confirmation ✅ WORKING
- **Password Reset**: Email-based password reset with secure token validation ✅ WORKING
- **Real-time UI**: Optimistic updates and real-time data synchronization
- **Responsive Design**: Mobile-first responsive layout with adaptive components
- **Type Safety**: End-to-end TypeScript with shared schema validation
- **SendGrid Integration**: Fully operational email service using voltveratech.com verified domain (August 17, 2025)
- **Enhanced Strategic Position Decisions**: AI-powered upline decision system with leg balance analysis and impact forecasting (August 20, 2025)
- **Complete Email Automation**: Login credentials automatically sent to approved users with professional welcome emails and admin user invitations (August 21, 2025)
- **ID Normalization System**: Comprehensive UUID to Display ID normalization across BV calculations, wallet crediting, tree operations, and user lookups - supports both UUID and Display ID formats seamlessly (October 15, 2025) ✅ WORKING
- **E-Wallet Balance Display**: User dashboard now shows comprehensive wallet information (October 16, 2025) ✅ WORKING
  - Current E-wallet balance (available for purchases)
  - Total earnings (all-time income)
  - Total withdrawals (lifetime withdrawals)
  - Visual indicators with color-coded cards
  - Quick action buttons for adding funds and withdrawing
  - Real-time synchronization with wallet transactions
  - Located prominently at top of user dashboard
- **Broadcast Notification System**: Admin can send system-wide notifications to all active users (October 17, 2025) ✅ WORKING
  - Admin-only feature accessible from dashboard header
  - Dialog-based form with title (max 100 chars) and message (max 500 chars) inputs
  - Targets all active non-admin users (includes user, founder, franchisee roles)
  - Real-time success feedback showing recipient count
  - Notifications appear in user's notification center
  - Automatic cache invalidation for real-time updates
  - Secure API endpoint with admin authentication (POST /api/admin/notifications/broadcast)
- **User Performance Report**: Comprehensive user-grouped income and performance tracking system (October 17, 2025) ✅ WORKING
  - **Groups all data by user** (not transaction-based) for easy performance evaluation
  - **Key Metrics Per User**:
    * Direct Income (total sponsor commissions)
    * Differential Income (total matching income from BV calculations)
    * Total Income (combined direct + differential)
    * Current Rank and rank requirements
    * Monthly BV metrics (Direct, Left, Right, Team)
    * Lifetime BV metrics (all fields from lifetime_bv_calculations)
    * Wallet metrics (balance, total earnings, total withdrawals)
    * Direct recruits count (total, left, right)
    * Rewards eligibility indicators (Team BV and Directs requirements)
  - **Summary Statistics**: Total users, total income by type, eligible users count
  - **Advanced Filtering**: User search (ID/name/email), rank filter, date range
  - **CSV Export**: Complete user performance data with all metrics
  - **Eligibility Badges**: Visual indicators showing if users meet rank requirements
  - **Admin Decision Support**: Clear data presentation for evaluating performance and approving rewards
  - Located in Admin Dashboard → Income Reports → User Performance Report (first menu item)
- **Enhanced BV Transactions Report**: Clarified income column naming with tooltips (October 17, 2025) ✅ WORKING
  - Added explanatory tooltips for income columns to eliminate confusion
  - Direct Income tooltip: "Sponsor commission (10%) earned from direct recruits' purchases"
  - Differential Income tooltip: "Differential/Matching Income from balanced team BV (New Match × Rank %)"
  - Direct BV tooltip: "BV from direct recruits sponsored by this user"
  - Team BV tooltip: "Total BV added to left and right legs (Team BV = Left BV + Right BV)"
  - Resolves the "Different column" ambiguity mentioned in user requirements
- **Reports Guide & Enhanced Documentation**: Comprehensive help system for understanding all reports (October 17, 2025) ✅ WORKING
  - **Reports Guide Dialog**: Accessible via header button (📄 icon) in admin dashboard
    * Complete guide to all 4 reports with clear explanations
    * Quick decision tree: "Which report should I use?"
    * Each report section includes: What it shows, Key Metrics, When to use
    * Comparison table showing report purposes and use cases
    * Pro tips for admins on effective report usage
    * Color-coded sections for easy navigation
  - **Eligibility Column Tooltip**: Interactive help in User Performance Report
    * HelpCircle (?) icon next to "Eligibility" column header
    * Explains promotion eligibility status with visual indicators
    * 🟢 Eligible: Meets both Team BV and Direct recruits requirements
    * 🟡 Partial: Meets one requirement, needs the other
    * 🔴 Not Eligible: Needs to meet both requirements
    * Shows ✓ = Met | ✗ = Not Met notation
  - **Hidden Redundant Reports**: Direct Income Report removed (redundant with BV Transactions)
  - **Active Reports** (4 total):
    1. User Performance Report - User-level performance summaries
    2. BV Transactions Report - Transaction-level audit trail (includes Direct Income)
    3. Monthly BV Report - Monthly BV snapshots and tracking
    4. Fund History - Complete wallet transaction ledger

# External Dependencies

## Authentication Services
- **Replit OAuth**: Primary authentication provider using OpenID Connect protocol
- **OpenID Client**: Handles OAuth flows and token management

## Database Services  
- **Neon PostgreSQL**: Serverless PostgreSQL database hosting
- **Connection Pooling**: @neondatabase/serverless for optimized database connections

## UI/UX Libraries
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management and validation

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Static type checking across frontend and backend
- **Drizzle**: Type-safe ORM with automatic migration generation
- **TanStack Query**: Server state management and caching layer

## Session & Security
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **Passport.js**: Authentication middleware for OAuth integration
- **Memoizee**: Function memoization for performance optimization