import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const demoSessions = sqliteTable("demo_sessions", {
  id: text("id").primaryKey(),
  accessTokenHash: text("access_token_hash").notNull(),
  demoCode: text("demo_code").notNull().unique(),
  scenario: text("scenario").notNull(),
  status: text("status").notNull(),
  provider: text("provider").notNull(),
  mode: text("mode").notNull().default("public"),
  profileJson: text("profile_json"),
  providerCallId: text("provider_call_id").unique(),
  clientHash: text("client_hash").notNull(),
  receiptJson: text("receipt_json"),
  transcriptJson: text("transcript_json"),
  receiptProvenance: text("receipt_provenance"),
  failureCode: text("failure_code"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
