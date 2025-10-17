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