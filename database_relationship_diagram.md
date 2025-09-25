# MLM System - Database Relationship Diagram

## Table Overview
This MLM (Multi-Level Marketing) system contains **21 core tables** with complex relationships supporting:
- Binary MLM tree structure
- User recruitment and placement workflows
- Product sales and commission tracking
- Financial transactions and wallet management
- KYC document management
- Support and notification systems
- Comprehensive audit trails

---

## Core Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AUTHENTICATION LAYER                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────────┐
│     sessions        │         │      emailTokens         │
│─────────────────────│         │──────────────────────────│
│ sid (PK) VARCHAR    │         │ id (PK) VARCHAR          │
│ sess JSONB          │         │ email VARCHAR            │
│ expire TIMESTAMP    │         │ token VARCHAR (UNIQUE)   │
└─────────────────────┘         │ type VARCHAR             │
                                │ expiresAt TIMESTAMP      │
                                │ consumedAt TIMESTAMP     │
                                │ revokedAt TIMESTAMP      │
                                │ revokedBy VARCHAR        │
                                │ ipAddress VARCHAR        │
                                │ isConsumed BOOLEAN       │
                                │ isRevoked BOOLEAN        │
                                │ scopedData JSONB         │
                                └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER MANAGEMENT CORE                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                 ┌─────────────────────────┐
                                 │        users            │
                                 │─────────────────────────│
                                 │ id (PK) VARCHAR         │
                                 │ userId VARCHAR (UNIQUE) │
                                 │ email VARCHAR (UNIQUE)  │
                                 │ password VARCHAR        │
                                 │ originalPassword VARCHAR│
                                 │ firstName VARCHAR       │
                                 │ lastName VARCHAR        │
                                 │ profileImageUrl VARCHAR │
                                 │ role ENUM               │
                ┌────────────────│ status ENUM             │
                │                │ emailVerified TIMESTAMP │
                │   ┌────────────│ sponsorId VARCHAR (FK)  │◄─────┐
                │   │            │ parentId VARCHAR (FK)   │◄─────┤
                │   │            │ leftChildId VARCHAR(FK) │◄─────┤ SELF-REFERENCING
                │   │            │ rightChildId VARCHAR(FK)│◄─────┤ BINARY TREE
                │   │            │ position VARCHAR        │      │ RELATIONSHIPS
                │   │            │ level VARCHAR           │      │
                │   │            │ packageAmount DECIMAL   │      │
                │   │            │ currentRank ENUM        │      │
                │   │            │ totalBV DECIMAL         │      │
                │   │            │ leftBV DECIMAL          │      │
                │   │            │ rightBV DECIMAL         │      │
                │   │            │ totalDirects INTEGER    │      │
                │   │            │ kycStatus ENUM          │      │
                │   │            │ txnPin VARCHAR          │      │
                │   │            │ cryptoWalletAddress VARCHAR│   │
                │   │            │ ... (20+ more fields)   │      │
                │   │            └─────────────────────────┘      │
                │   └─────────────────────────────────────────────┘
                │
                │   ┌─────────────────────────┐
                └───┤    notifications        │
                    │─────────────────────────│
                    │ id (PK) VARCHAR         │
                    │ userId VARCHAR (FK)     │
                    │ type VARCHAR            │
                    │ title VARCHAR           │
                    │ message TEXT            │
                    │ data JSONB              │
                    │ read BOOLEAN            │
                    │ createdAt TIMESTAMP     │
                    └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  RECRUITMENT WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐
│     referralLinks       │    │  recruitmentRequests    │    │    pendingRecruits      │
│─────────────────────────│    │─────────────────────────│    │─────────────────────────│
│ id (PK) VARCHAR         │    │ id (PK) VARCHAR         │    │ id (PK) VARCHAR         │
│ token VARCHAR (UNIQUE)  │────┤ referralLinkId VARCHAR  │    │ email VARCHAR           │
│ generatedBy VARCHAR(FK) │    │ recruiteeEmail VARCHAR  │    │ fullName VARCHAR        │
│ generatedByRole VARCHAR │    │ recruiteeName VARCHAR   │    │ mobile VARCHAR          │
│ placementSide VARCHAR   │    │ recruiteeId VARCHAR(FK) │    │ recruiterId VARCHAR(FK) │
│ pendingRecruitId VARCHAR│◄───│ status VARCHAR          │    │ uplineId VARCHAR (FK)   │
│ isUsed BOOLEAN          │    │ approvedBy VARCHAR (FK) │    │ packageAmount VARCHAR   │
│ usedBy VARCHAR (FK)     │    │ approvedAt TIMESTAMP    │    │ position VARCHAR        │
│ usedAt TIMESTAMP        │    │ placementLocked BOOLEAN │    │ uplineDecision VARCHAR  │
│ expiresAt TIMESTAMP     │    │ notes TEXT              │    │ status VARCHAR          │
│ createdAt TIMESTAMP     │    │ createdAt TIMESTAMP     │    │ riskScore INTEGER       │
└─────────────────────────┘    │ updatedAt TIMESTAMP     │    │ kycStatus VARCHAR       │
             │                 └─────────────────────────┘    │ password VARCHAR        │
             │                                                │ nominee VARCHAR         │
             └────────────────────────────────────────────────┤ ... (KYC & Address)     │
                                                              └─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRODUCT & SALES SYSTEM                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐
│       products          │    │       purchases         │
│─────────────────────────│    │─────────────────────────│
│ id (PK) VARCHAR         │────┤ productId VARCHAR (FK)  │
│ name VARCHAR            │    │ id (PK) VARCHAR         │
│ description TEXT        │    │ userId VARCHAR (FK)     │◄───┐
│ price DECIMAL           │    │ quantity INTEGER        │    │
│ bv DECIMAL              │    │ totalAmount DECIMAL     │    │
│ gst DECIMAL             │    │ totalBV DECIMAL         │    │
│ category VARCHAR        │    │ paymentMethod VARCHAR   │    │
│ purchaseType ENUM       │    │ paymentStatus VARCHAR   │    │
│ imageUrl VARCHAR        │    │ transactionId VARCHAR   │    │
│ isActive BOOLEAN        │    │ deliveryAddress TEXT    │    │
│ createdAt TIMESTAMP     │    │ deliveryStatus VARCHAR  │    │
│ updatedAt TIMESTAMP     │    │ trackingId VARCHAR      │    │
└─────────────────────────┘    │ createdAt TIMESTAMP     │    │
                               │ updatedAt TIMESTAMP     │    │
                               └─────────────────────────┘    │
                                                              │
┌─────────────────────────────────────────────────────────────────────────────────────────┤
│                                  FINANCIAL SYSTEM                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐│
│    walletBalances       │    │     transactions        │    │  withdrawalRequests     ││
│─────────────────────────│    │─────────────────────────│    │─────────────────────────││
│ id (PK) VARCHAR         │    │ id (PK) VARCHAR         │    │ id (PK) VARCHAR         ││
│ userId VARCHAR (FK)     │◄───┤ userId VARCHAR (FK)     │    │ userId VARCHAR (FK)     ││
│ balance DECIMAL         │    │ type ENUM               │    │ withdrawalType VARCHAR  ││
│ totalEarnings DECIMAL   │    │ amount DECIMAL          │    │ amount DECIMAL          ││
│ totalWithdrawals DECIMAL│    │ description TEXT        │    │ status VARCHAR          ││
│ updatedAt TIMESTAMP     │    │ referenceId VARCHAR     │    │ bankDetails JSONB       ││
└─────────────────────────┘    │ balanceBefore DECIMAL   │    │ usdtWalletAddress VARCHAR││
                               │ balanceAfter DECIMAL    │    │ networkType VARCHAR     ││
┌─────────────────────────┐    │ metadata JSONB          │    │ adminNotes TEXT         ││
│       cheques           │    │ createdAt TIMESTAMP     │    │ processedBy VARCHAR(FK) ││
│─────────────────────────│    └─────────────────────────┘    │ processedAt TIMESTAMP   ││
│ id (PK) VARCHAR         │                                  │ transactionId VARCHAR   ││
│ userId VARCHAR (FK)     │◄─────────────────────────────────┤ createdAt TIMESTAMP     ││
│ chequeNumber VARCHAR    │                                  │ updatedAt TIMESTAMP     ││
│ amount DECIMAL          │                                  └─────────────────────────┘│
│ bankName VARCHAR        │                                                             │
│ issuedDate TIMESTAMP    │                                                             │
│ clearanceDate TIMESTAMP │                                                             │
│ status VARCHAR          │                                                             │
│ purpose TEXT            │                                                             │
│ createdAt TIMESTAMP     │                                                             │
│ updatedAt TIMESTAMP     │                                                             │
└─────────────────────────┘                                                             │
                                                                                        │
┌─────────────────────────────────────────────────────────────────────────────────────────┤
│                                    MLM SPECIFIC TABLES                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────────┐│
│   rankAchievements      │    │      achievers          │    │  franchiseRequests      ││
│─────────────────────────│    │─────────────────────────│    │─────────────────────────││
│ id (PK) VARCHAR         │    │ id (PK) VARCHAR         │    │ id (PK) VARCHAR         ││
│ userId VARCHAR (FK)     │◄───┤ userId VARCHAR (FK)     │    │ userId VARCHAR (FK)     ││
│ rank ENUM               │    │ achievementType VARCHAR │    │ franchiseType ENUM      ││
│ achievedAt TIMESTAMP    │    │ position INTEGER        │    │ investmentAmount DECIMAL││
│ teamBV DECIMAL          │    │ amount DECIMAL          │    │ businessVolume DECIMAL  ││
│ leftBV DECIMAL          │    │ period VARCHAR          │    │ sponsorIncome DECIMAL   ││
│ rightBV DECIMAL         │    │ periodDate TIMESTAMP    │    │ status VARCHAR          ││
│ bonus DECIMAL           │    │ metadata JSONB          │    │ businessPlan TEXT       ││
│ metadata JSONB          │    │ createdAt TIMESTAMP     │    │ adminNotes TEXT         ││
└─────────────────────────┘    └─────────────────────────┘    │ reviewedBy VARCHAR (FK) ││
                                                              │ reviewedAt TIMESTAMP    ││
                                                              │ createdAt TIMESTAMP     ││
                                                              │ updatedAt TIMESTAMP     ││
                                                              └─────────────────────────┘│
                                                                                        │
┌─────────────────────────────────────────────────────────────────────────────────────────┤
│                                 KYC & DOCUMENT MANAGEMENT                              │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                                                                        │
┌─────────────────────────┐                                                            │
│     kycDocuments        │                                                            │
│─────────────────────────│                                                            │
│ id (PK) VARCHAR         │                                                            │
│ userId VARCHAR (FK)     │◄───────────────────────────────────────────────────────────┘
│ documentType VARCHAR    │
│ documentUrl VARCHAR     │
│ documentData TEXT       │
│ documentContentType VARCHAR│
│ documentFilename VARCHAR│
│ documentSize INTEGER    │
│ documentNumber VARCHAR  │
│ status ENUM             │
│ rejectionReason TEXT    │
│ reviewedBy VARCHAR (FK) │
│ reviewedAt TIMESTAMP    │
│ createdAt TIMESTAMP     │
│ updatedAt TIMESTAMP     │
└─────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SUPPORT & COMMUNICATION                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐                        ┌─────────────────────────┐
│    supportTickets       │                        │         news            │
│─────────────────────────│                        │─────────────────────────│
│ id (PK) VARCHAR         │                        │ id (PK) VARCHAR         │
│ userId VARCHAR (FK)     │◄─────┐                 │ title VARCHAR           │
│ category ENUM           │      │                 │ content TEXT            │
│ subject VARCHAR         │      │                 │ type VARCHAR            │
│ description TEXT        │      │                 │ priority VARCHAR        │
│ status ENUM             │      │                 │ isActive BOOLEAN        │
│ priority VARCHAR        │      │                 │ publishedAt TIMESTAMP   │
│ assignedTo VARCHAR (FK) │      │                 │ expiresAt TIMESTAMP     │
│ resolution TEXT         │      │                 │ createdBy VARCHAR (FK)  │
│ resolvedAt TIMESTAMP    │      │                 │ createdAt TIMESTAMP     │
│ createdAt TIMESTAMP     │      │                 │ updatedAt TIMESTAMP     │
│ updatedAt TIMESTAMP     │      │                 └─────────────────────────┘
└─────────────────────────┘      │                                          
                                 │                                          
                                 │ ALL FOREIGN KEYS                        
                                 │ REFERENCE users.id                      
                                 └─────────────────────────────────────────

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              WORKFLOW & AUDIT SYSTEM                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐    ┌─────────────────────────┐
│   approvalRequests      │    │       auditLog          │
│─────────────────────────│    │─────────────────────────│
│ id (PK) VARCHAR         │    │ id (PK) VARCHAR         │
│ applicantId VARCHAR(FK) │    │ entityType VARCHAR      │
│ pendingRecruitId VARCHAR│    │ entityId VARCHAR        │
│ sponsorId VARCHAR (FK)  │    │ action VARCHAR          │
│ planId VARCHAR          │    │ actorId VARCHAR (FK)    │
│ placementScope JSONB    │    │ actorRole VARCHAR       │
│ formSnapshot JSONB      │    │ previousState JSONB     │
│ kycStatus VARCHAR       │    │ newState JSONB          │
│ riskScore INTEGER       │    │ changes JSONB           │
│ status VARCHAR          │    │ reason TEXT             │
│ requestedBy VARCHAR(FK) │    │ ipAddress VARCHAR       │
│ reviewedBy VARCHAR (FK) │    │ userAgent TEXT          │
│ reviewedAt TIMESTAMP    │    │ sessionId VARCHAR       │
│ rejectionReason TEXT    │    │ createdAt TIMESTAMP     │
│ approvalNotes TEXT      │    └─────────────────────────┘
│ createdAt TIMESTAMP     │
│ updatedAt TIMESTAMP     │
└─────────────────────────┘
```

---

## Key Database Relationships

### 1. **Binary MLM Tree Structure** (users table self-referencing)
```
users.sponsorId → users.id        (Who recruited this user)
users.parentId → users.id         (Direct parent in binary tree)
users.leftChildId → users.id      (Left child in binary tree) 
users.rightChildId → users.id     (Right child in binary tree)
```

### 2. **Recruitment Workflow Chain**
```
referralLinks → recruitmentRequests → pendingRecruits → users
     ↓                ↓                      ↓             ↓
  Link Generation → Request Tracking → Upline Approval → User Creation
```

### 3. **Financial Relationships**
```
users ← purchases → products
  ↓         ↓
walletBalances ← transactions
  ↓
withdrawalRequests
  ↓  
cheques
```

### 4. **KYC & Document Flow**
```
users → kycDocuments
users → pendingRecruits (with KYC data)
```

### 5. **MLM Tracking & Rewards**
```
users → rankAchievements
users → achievers  
users → franchiseRequests
```

### 6. **Communication & Support**
```
users → notifications
users → supportTickets
users → news (createdBy)
```

### 7. **Audit & Workflow**
```
users → approvalRequests (multiple FK relationships)
All tables → auditLog (entityId references)
```

---

## Critical Enums

### User Roles
```sql
'admin', 'user', 'founder', 'mini_franchise', 'basic_franchise'
```

### User Status  
```sql
'invited', 'registered', 'active', 'inactive', 'pending', 'rejected', 'suspended'
```

### MLM Ranks
```sql
'Executive', 'Bronze Star', 'Gold Star', 'Emerald Star', 'Ruby Star', 
'Diamond', 'Wise President', 'President', 'Ambassador', 
'Deputy Director', 'Director', 'Founder'
```

### Transaction Types
```sql
'sponsor_income', 'sales_incentive', 'sales_bonus', 'consistency_bonus', 
'franchise_income', 'car_fund', 'travel_fund', 'leadership_fund', 
'house_fund', 'millionaire_club', 'royalty_income', 'withdrawal', 
'purchase', 'admin_credit', 'admin_debit'
```

### KYC Status
```sql
'pending', 'approved', 'rejected'
```

### Purchase Types
```sql
'first_purchase', 'second_purchase'
```

### Franchise Types
```sql
'Mini Franchise', 'Basic Franchise', 'Smart Franchise', 
'Growth Franchise', 'Master Franchise', 'Super Franchise'
```

---

## Database Design Principles

### 1. **Binary MLM Structure**
- Self-referencing relationships in `users` table
- Supports spillover placement (parentId ≠ sponsorId)
- Tracks left/right business volume separately
- Position tracking ('left' or 'right')

### 2. **Workflow-Driven Architecture**
- Recruitment requires upline approval
- KYC verification workflow
- Admin approval for various requests
- State machine patterns for status tracking

### 3. **Financial Integrity**
- Double-entry accounting in transactions
- Balance tracking before/after each transaction
- Multiple withdrawal methods (bank/USDT)
- Commission calculation based on BV (Business Volume)

### 4. **Audit Trail**
- Comprehensive logging of all state changes
- Actor tracking for accountability
- JSON snapshots of previous/new states
- IP and session tracking for security

### 5. **Security & Compliance**
- KYC document management with status tracking
- Risk scoring for new recruits
- Token-based email verification
- Transaction PIN for financial operations

---

## Performance Considerations

### Indexes Recommended
```sql
-- User tree traversal
CREATE INDEX idx_users_sponsor ON users(sponsorId);
CREATE INDEX idx_users_parent ON users(parentId);
CREATE INDEX idx_users_left_child ON users(leftChildId);
CREATE INDEX idx_users_right_child ON users(rightChildId);

-- Financial queries
CREATE INDEX idx_transactions_user_type ON transactions(userId, type);
CREATE INDEX idx_transactions_created ON transactions(createdAt);
CREATE INDEX idx_wallet_balances_user ON walletBalances(userId);

-- Status-based queries
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_pending_recruits_status ON pendingRecruits(status);
CREATE INDEX idx_withdrawal_requests_status ON withdrawalRequests(status);

-- Audit and logging
CREATE INDEX idx_audit_log_entity ON auditLog(entityType, entityId);
CREATE INDEX idx_audit_log_actor ON auditLog(actorId);
```

### Query Optimization
- Use recursive CTEs for MLM tree calculations
- Implement view materialization for complex BV calculations  
- Consider partitioning for large audit logs and transactions
- Use JSON indexes for metadata columns where needed

---

## Data Integrity Rules

### Constraints
1. **Binary Tree**: Each user can have max 2 direct children
2. **Financial**: Balance calculations must be atomic
3. **Recruitment**: Referral links expire and can only be used once
4. **KYC**: Required before account activation
5. **Audit**: All critical actions must be logged

### Triggers Needed
1. Update parent's BV when child makes purchase
2. Auto-create wallet balance on user creation  
3. Validate binary tree placement constraints
4. Log state changes to audit table
5. Update user rank based on BV thresholds

This database design supports a comprehensive MLM system with robust financial tracking, user management, and audit capabilities.