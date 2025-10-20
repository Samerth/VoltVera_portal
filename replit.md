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

# Recent Bug Fixes

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