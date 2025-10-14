import { relations } from "drizzle-orm/relations";
import { users, pendingRecruits, notifications, recruitmentRequests } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	user_sponsorId: one(users, {
		fields: [users.sponsorId],
		references: [users.id],
		relationName: "users_sponsorId_users_id"
	}),
	users_sponsorId: many(users, {
		relationName: "users_sponsorId_users_id"
	}),
	user_parentId: one(users, {
		fields: [users.parentId],
		references: [users.id],
		relationName: "users_parentId_users_id"
	}),
	users_parentId: many(users, {
		relationName: "users_parentId_users_id"
	}),
	user_leftChildId: one(users, {
		fields: [users.leftChildId],
		references: [users.id],
		relationName: "users_leftChildId_users_id"
	}),
	users_leftChildId: many(users, {
		relationName: "users_leftChildId_users_id"
	}),
	user_rightChildId: one(users, {
		fields: [users.rightChildId],
		references: [users.id],
		relationName: "users_rightChildId_users_id"
	}),
	users_rightChildId: many(users, {
		relationName: "users_rightChildId_users_id"
	}),
	pendingRecruits: many(pendingRecruits),
	notifications: many(notifications),
	recruitmentRequests_requesterId: many(recruitmentRequests, {
		relationName: "recruitmentRequests_requesterId_users_id"
	}),
	recruitmentRequests_uplineId: many(recruitmentRequests, {
		relationName: "recruitmentRequests_uplineId_users_id"
	}),
}));

export const pendingRecruitsRelations = relations(pendingRecruits, ({one}) => ({
	user: one(users, {
		fields: [pendingRecruits.recruiterId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const recruitmentRequestsRelations = relations(recruitmentRequests, ({one}) => ({
	user_requesterId: one(users, {
		fields: [recruitmentRequests.requesterId],
		references: [users.id],
		relationName: "recruitmentRequests_requesterId_users_id"
	}),
	user_uplineId: one(users, {
		fields: [recruitmentRequests.uplineId],
		references: [users.id],
		relationName: "recruitmentRequests_uplineId_users_id"
	}),
}));