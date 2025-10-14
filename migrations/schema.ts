import { pgTable, index, varchar, jsonb, timestamp, text, numeric, boolean, integer, foreignKey, unique, check, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const franchiseType = pgEnum("franchise_type", ['Mini Franchise', 'Basic Franchise', 'Smart Franchise', 'Growth Franchise', 'Master Franchise', 'Super Franchise'])
export const kycStatus = pgEnum("kyc_status", ['pending', 'approved', 'rejected'])
export const purchaseType = pgEnum("purchase_type", ['first_purchase', 'second_purchase'])
export const rank = pgEnum("rank", ['Executive', 'Bronze Star', 'Gold Star', 'Emerald Star', 'Ruby Star', 'Diamond', 'Wise President', 'President', 'Ambassador', 'Deputy Director', 'Director', 'Founder'])
export const ticketCategory = pgEnum("ticket_category", ['Payment', 'Product', 'ID', 'Technical', 'General'])
export const ticketStatus = pgEnum("ticket_status", ['open', 'in_progress', 'resolved', 'closed'])
export const transactionType = pgEnum("transaction_type", ['sponsor_income', 'sales_incentive', 'sales_bonus', 'consistency_bonus', 'franchise_income', 'car_fund', 'travel_fund', 'leadership_fund', 'house_fund', 'millionaire_club', 'royalty_income', 'withdrawal', 'purchase', 'admin_credit', 'admin_debit'])
export const userRole = pgEnum("user_role", ['admin', 'user', 'founder', 'mini_franchise', 'basic_franchise'])
export const userStatus = pgEnum("user_status", ['active', 'inactive', 'pending'])


export const sessions = pgTable("sessions", {
	sid: varchar().primaryKey().notNull(),
	sess: jsonb().notNull(),
	expire: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const products = pgTable("products", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: varchar().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	bv: numeric({ precision: 10, scale:  2 }).notNull(),
	gst: numeric({ precision: 5, scale:  2 }).notNull(),
	category: varchar().notNull(),
	purchaseType: purchaseType("purchase_type").notNull(),
	imageUrl: varchar("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const purchases = pgTable("purchases", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	productId: varchar("product_id").notNull(),
	quantity: integer().default(1),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	totalBv: numeric("total_bv", { precision: 10, scale:  2 }).notNull(),
	paymentMethod: varchar("payment_method"),
	paymentStatus: varchar("payment_status").default('pending'),
	transactionId: varchar("transaction_id"),
	deliveryAddress: text("delivery_address"),
	deliveryStatus: varchar("delivery_status").default('pending'),
	trackingId: varchar("tracking_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar(),
	firstName: varchar("first_name"),
	lastName: varchar("last_name"),
	profileImageUrl: varchar("profile_image_url"),
	role: userRole().default('user').notNull(),
	status: userStatus().default('active').notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	password: varchar().notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	referredBy: varchar("referred_by"),
	packageAmount: varchar("package_amount").default('0.00'),
	registrationDate: timestamp("registration_date", { mode: 'string' }).defaultNow(),
	activationDate: timestamp("activation_date", { mode: 'string' }),
	idStatus: varchar("id_status").default('Inactive'),
	position: varchar().default('Left'),
	mobile: varchar(),
	sponsorId: varchar("sponsor_id"),
	parentId: varchar("parent_id"),
	leftChildId: varchar("left_child_id"),
	rightChildId: varchar("right_child_id"),
	level: varchar().default('0'),
	panNumber: varchar("pan_number"),
	aadhaarNumber: varchar("aadhaar_number"),
	bankAccountNumber: varchar("bank_account_number"),
	bankIfsc: varchar("bank_ifsc"),
	bankName: varchar("bank_name"),
	address: text(),
	city: varchar(),
	state: varchar(),
	pincode: varchar(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	currentRank: rank("current_rank").default('Executive'),
	totalBv: numeric("total_bv", { precision: 12, scale:  2 }).default('0.00'),
	leftBv: numeric("left_bv", { precision: 12, scale:  2 }).default('0.00'),
	rightBv: numeric("right_bv", { precision: 12, scale:  2 }).default('0.00'),
	totalDirects: integer("total_directs").default(0),
	leftDirects: integer("left_directs").default(0),
	rightDirects: integer("right_directs").default(0),
	kycStatus: kycStatus("kyc_status").default('pending'),
	kycSubmittedAt: timestamp("kyc_submitted_at", { mode: 'string' }),
	kycApprovedAt: timestamp("kyc_approved_at", { mode: 'string' }),
	firstLogin: boolean("first_login").default(true),
	passwordChangedAt: timestamp("password_changed_at", { mode: 'string' }),
	txnPin: varchar("txn_pin"),
	cryptoWalletAddress: varchar("crypto_wallet_address"),
	isHiddenId: boolean("is_hidden_id").default(false),
	kycDeadline: timestamp("kyc_deadline", { mode: 'string' }),
	kycLocked: boolean("kyc_locked").default(false),
	userId: varchar("user_id"),
	originalPassword: text("original_password"),
	nominee: varchar(),
	bankAccountHolderName: varchar("bank_account_holder_name"),
	order: integer().default(0),
}, (table) => [
	index("IDX_users_order").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("idx_users_left_child_id").using("btree", table.leftChildId.asc().nullsLast().op("text_ops")),
	index("idx_users_level").using("btree", table.level.asc().nullsLast().op("text_ops")),
	index("idx_users_parent_id").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	index("idx_users_right_child_id").using("btree", table.rightChildId.asc().nullsLast().op("text_ops")),
	index("idx_users_sponsor_id").using("btree", table.sponsorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sponsorId],
			foreignColumns: [table.id],
			name: "fk_sponsor"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "fk_parent"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.leftChildId],
			foreignColumns: [table.id],
			name: "fk_left_child"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.rightChildId],
			foreignColumns: [table.id],
			name: "fk_right_child"
		}).onDelete("set null"),
	unique("users_email_unique").on(table.email),
	unique("users_user_id_key").on(table.userId),
	unique("users_user_id_unique").on(table.userId),
]);

export const walletBalances = pgTable("wallet_balances", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	balance: numeric({ precision: 12, scale:  2 }).default('0.00'),
	totalEarnings: numeric("total_earnings", { precision: 12, scale:  2 }).default('0.00'),
	totalWithdrawals: numeric("total_withdrawals", { precision: 12, scale:  2 }).default('0.00'),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("wallet_balances_user_id_key").on(table.userId),
	unique("wallet_balances_user_id_unique").on(table.userId),
]);

export const transactions = pgTable("transactions", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: transactionType().notNull(),
	amount: numeric({ precision: 12, scale:  2 }).notNull(),
	description: text().notNull(),
	referenceId: varchar("reference_id"),
	balanceBefore: numeric("balance_before", { precision: 12, scale:  2 }).notNull(),
	balanceAfter: numeric("balance_after", { precision: 12, scale:  2 }).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const kycDocuments = pgTable("kyc_documents", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	documentType: varchar("document_type").notNull(),
	documentUrl: varchar("document_url").notNull(),
	documentNumber: varchar("document_number"),
	status: kycStatus().default('pending'),
	rejectionReason: text("rejection_reason"),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	documentData: text("document_data"),
	documentContentType: varchar("document_content_type"),
	documentFilename: varchar("document_filename"),
	documentSize: integer("document_size"),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	status: varchar().default('pending'),
	bankDetails: jsonb("bank_details").notNull(),
	adminNotes: text("admin_notes"),
	processedBy: varchar("processed_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	transactionId: varchar("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	withdrawalType: varchar("withdrawal_type", { length: 50 }).default('standard'),
	usdtWalletAddress: varchar("usdt_wallet_address", { length: 255 }),
	networkType: varchar("network_type", { length: 50 }),
});

export const rankAchievements = pgTable("rank_achievements", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	rank: rank().notNull(),
	achievedAt: timestamp("achieved_at", { mode: 'string' }).defaultNow(),
	teamBv: numeric("team_bv", { precision: 12, scale:  2 }).notNull(),
	leftBv: numeric("left_bv", { precision: 12, scale:  2 }).notNull(),
	rightBv: numeric("right_bv", { precision: 12, scale:  2 }).notNull(),
	bonus: numeric({ precision: 10, scale:  2 }).default('0.00'),
	metadata: jsonb(),
});

export const franchiseRequests = pgTable("franchise_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	franchiseType: franchiseType("franchise_type").notNull(),
	investmentAmount: numeric("investment_amount", { precision: 10, scale:  2 }).notNull(),
	businessVolume: numeric("business_volume", { precision: 10, scale:  2 }).notNull(),
	sponsorIncome: numeric("sponsor_income", { precision: 10, scale:  2 }).notNull(),
	status: varchar().default('pending'),
	businessPlan: text("business_plan"),
	adminNotes: text("admin_notes"),
	reviewedBy: varchar("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	category: ticketCategory().notNull(),
	subject: varchar().notNull(),
	description: text().notNull(),
	status: ticketStatus().default('open'),
	priority: varchar().default('medium'),
	assignedTo: varchar("assigned_to"),
	resolution: text(),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const achievers = pgTable("achievers", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	achievementType: varchar("achievement_type").notNull(),
	position: integer().notNull(),
	amount: numeric({ precision: 10, scale:  2 }),
	period: varchar().notNull(),
	periodDate: timestamp("period_date", { mode: 'string' }).notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const cheques = pgTable("cheques", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	chequeNumber: varchar("cheque_number").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	bankName: varchar("bank_name").notNull(),
	issuedDate: timestamp("issued_date", { mode: 'string' }).notNull(),
	clearanceDate: timestamp("clearance_date", { mode: 'string' }),
	status: varchar().default('issued'),
	purpose: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("cheques_cheque_number_key").on(table.chequeNumber),
]);

export const news = pgTable("news", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	title: varchar().notNull(),
	content: text().notNull(),
	type: varchar().default('announcement'),
	priority: varchar().default('normal'),
	isActive: boolean("is_active").default(true),
	publishedAt: timestamp("published_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdBy: varchar("created_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const referralLinks = pgTable("referral_links", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	token: varchar().notNull(),
	generatedBy: varchar("generated_by").notNull(),
	generatedByRole: varchar("generated_by_role").notNull(),
	placementSide: varchar("placement_side").notNull(),
	pendingRecruitId: varchar("pending_recruit_id"),
	isUsed: boolean("is_used").default(false),
	usedBy: varchar("used_by"),
	usedAt: timestamp("used_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("referral_links_token_key").on(table.token),
	unique("referral_links_token_unique").on(table.token),
]);

export const emailTokens = pgTable("email_tokens", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	token: varchar().notNull(),
	type: varchar().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	consumedAt: timestamp("consumed_at", { mode: 'string' }),
	revokedAt: timestamp("revoked_at", { mode: 'string' }),
	revokedBy: varchar("revoked_by"),
	ipAddress: varchar("ip_address"),
	isConsumed: boolean("is_consumed").default(false),
	isRevoked: boolean("is_revoked").default(false),
	scopedData: jsonb("scoped_data"),
}, (table) => [
	unique("email_tokens_token_key").on(table.token),
	unique("email_tokens_token_unique").on(table.token),
]);

export const fundRequests = pgTable("fund_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	receiptUrl: varchar("receipt_url"),
	status: varchar().default('pending'),
	paymentMethod: varchar("payment_method"),
	transactionId: varchar("transaction_id"),
	adminNotes: text("admin_notes"),
	processedBy: varchar("processed_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const pendingRecruits = pgTable("pending_recruits", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	email: varchar().notNull(),
	fullName: varchar("full_name").notNull(),
	mobile: varchar(),
	recruiterId: varchar("recruiter_id").notNull(),
	packageAmount: varchar("package_amount").default('0.00'),
	position: varchar().default('Left'),
	status: varchar().default('awaiting_upline'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	uplineId: varchar("upline_id"),
	uplineDecision: varchar("upline_decision").default('pending'),
	uplineDecisionAt: timestamp("upline_decision_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	rejectedBy: varchar("rejected_by"),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	version: integer().default(1),
	placementLocked: boolean("placement_locked").default(false),
	lockExpiresAt: timestamp("lock_expires_at", { mode: 'string' }),
	riskScore: integer("risk_score").default(0),
	kycStatus: varchar("kyc_status").default('pending'),
	password: varchar(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	address: text(),
	city: varchar(),
	state: varchar(),
	pincode: varchar(),
	panNumber: varchar("pan_number"),
	aadhaarNumber: varchar("aadhaar_number"),
	bankAccountNumber: varchar("bank_account_number"),
	bankIfsc: varchar("bank_ifsc"),
	bankName: varchar("bank_name"),
	panCardUrl: varchar("pan_card_url"),
	aadhaarCardUrl: varchar("aadhaar_card_url"),
	bankStatementUrl: varchar("bank_statement_url"),
	profileImageUrl: varchar("profile_image_url"),
	nominee: varchar(),
	aadhaarFrontUrl: varchar("aadhaar_front_url"),
	aadhaarBackUrl: varchar("aadhaar_back_url"),
	bankCancelledChequeUrl: varchar("bank_cancelled_cheque_url"),
	bankAccountHolderName: varchar("bank_account_holder_name"),
}, (table) => [
	foreignKey({
			columns: [table.recruiterId],
			foreignColumns: [users.id],
			name: "pending_recruits_recruiter_id_fkey"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	type: varchar().notNull(),
	title: varchar().notNull(),
	message: text().notNull(),
	read: boolean().default(false),
	data: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
]);

export const rankConfigurations = pgTable("rank_configurations", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	rankName: varchar("rank_name").notNull(),
	percentage: numeric({ precision: 5, scale:  4 }).notNull(),
	minTeamBv: numeric("min_team_bv", { precision: 12, scale:  2 }).default('0.00'),
	minDirects: integer("min_directs").default(0),
	bonusAmount: numeric("bonus_amount", { precision: 12, scale:  2 }).default('0.00'),
	tourRewards: text("tour_rewards"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_rank_configurations_rank_name").using("btree", table.rankName.asc().nullsLast().op("text_ops")),
	unique("rank_configurations_rank_name_key").on(table.rankName),
]);

export const recruitmentRequests = pgTable("recruitment_requests", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	requesterId: varchar("requester_id").notNull(),
	uplineId: varchar("upline_id").notNull(),
	candidateName: varchar("candidate_name").notNull(),
	candidateEmail: varchar("candidate_email").notNull(),
	placementPosition: varchar("placement_position").notNull(),
	status: varchar().default('pending').notNull(),
	packageAmount: numeric("package_amount", { precision: 10, scale:  2 }),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	referralLinkId: varchar("referral_link_id").default(').notNull(),
	recruiteeEmail: varchar("recruitee_email").default(').notNull(),
	recruiteeName: varchar("recruitee_name"),
	recruiteeId: varchar("recruitee_id"),
	approvedBy: varchar("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	placementLocked: boolean("placement_locked").default(false),
}, (table) => [
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "recruitment_requests_requester_id_fkey"
		}),
	foreignKey({
			columns: [table.uplineId],
			foreignColumns: [users.id],
			name: "recruitment_requests_upline_id_fkey"
		}),
	check("recruitment_requests_placement_position_check", sql`(placement_position)::text = ANY ((ARRAY['left'::character varying, 'right'::character varying])::text[])`),
	check("recruitment_requests_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])`),
]);
