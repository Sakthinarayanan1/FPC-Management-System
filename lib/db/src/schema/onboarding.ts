import { pgTable, text, timestamp, integer, jsonb, varchar } from "drizzle-orm/pg-core";

export const fpcInvitations = pgTable("fpc_invitations", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. INV-2026-0042
  token: varchar("token", { length: 128 }).notNull().unique(),
  fpcName: varchar("fpc_name", { length: 255 }),
  adminName: varchar("admin_name", { length: 255 }).notNull(),
  adminEmail: varchar("admin_email", { length: 255 }).notNull(),
  adminMobile: varchar("admin_mobile", { length: 20 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("Invitation Sent"),
  invitedBy: varchar("invited_by", { length: 100 }).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  lastResentAt: timestamp("last_resent_at"),
  resendCount: integer("resend_count").default(0).notNull(),
  applicationId: varchar("application_id", { length: 64 }),
  fpcId: varchar("fpc_id", { length: 64 }),
  clusterDistrict: varchar("cluster_district", { length: 255 }),
  notes: text("notes"),
});

export const fpcApplications = pgTable("fpc_applications", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. APP-FPC-2026-0012
  invitationId: varchar("invitation_id", { length: 64 }).notNull(),
  companyName: varchar("company_name", { length: 255 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  cin: varchar("cin", { length: 50 }),
  pan: varchar("pan", { length: 20 }),
  tan: varchar("tan", { length: 20 }),
  gstin: varchar("gstin", { length: 30 }),
  incorporationDate: varchar("incorporation_date", { length: 50 }),
  orgType: varchar("org_type", { length: 100 }),
  registeredAddress: text("registered_address"),
  state: varchar("state", { length: 100 }),
  district: varchar("district", { length: 100 }),
  block: varchar("block", { length: 100 }),
  village: varchar("village", { length: 100 }),
  pinCode: varchar("pin_code", { length: 20 }),
  directors: jsonb("directors").$type<any[]>().default([]),
  operationalInfo: jsonb("operational_info").$type<Record<string, any>>().default({}),
  bankAccounts: jsonb("bank_accounts").$type<any[]>().default([]),
  documents: jsonb("documents").$type<Record<string, string>>().default({}),
  status: varchar("status", { length: 50 }).notNull().default("Draft"),
  submittedAt: timestamp("submitted_at"),
  reviewedBy: varchar("reviewed_by", { length: 100 }),
  reviewedAt: timestamp("reviewed_at"),
  correctionRemarks: text("correction_remarks"),
  rejectionReason: text("rejection_reason"),
  approvalRemarks: text("approval_remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FpcInvitationRow = typeof fpcInvitations.$inferSelect;
export type InsertFpcInvitationRow = typeof fpcInvitations.$inferInsert;
export type FpcApplicationRow = typeof fpcApplications.$inferSelect;
export type InsertFpcApplicationRow = typeof fpcApplications.$inferInsert;

export const tsfAccounts = pgTable("tsf_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("TSF Central Admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export const fpcAccounts = pgTable("fpc_accounts", {
  id: varchar("id", { length: 64 }).primaryKey(), // e.g. ACC-2026-0001
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  salt: varchar("salt", { length: 64 }).notNull(),
  adminName: varchar("admin_name", { length: 255 }).notNull(),
  adminMobile: varchar("admin_mobile", { length: 20 }),
  fpcId: varchar("fpc_id", { length: 64 }).notNull(),
  fpcName: varchar("fpc_name", { length: 255 }).notNull(),
  invitationId: varchar("invitation_id", { length: 64 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("FPC Admin / Manager"),
  onboardingCompleted: integer("onboarding_completed").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type TsfAccountRow = typeof tsfAccounts.$inferSelect;
export type InsertTsfAccountRow = typeof tsfAccounts.$inferInsert;
export type FpcAccountRow = typeof fpcAccounts.$inferSelect;
export type InsertFpcAccountRow = typeof fpcAccounts.$inferInsert;

