CREATE TABLE `demo_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`access_token_hash` text NOT NULL,
	`demo_code` text NOT NULL,
	`scenario` text NOT NULL,
	`status` text NOT NULL,
	`provider` text NOT NULL,
	`provider_call_id` text,
	`client_hash` text NOT NULL,
	`receipt_json` text,
	`transcript_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_sessions_demo_code_unique` ON `demo_sessions` (`demo_code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `demo_sessions_provider_call_id_unique` ON `demo_sessions` (`provider_call_id`);
--> statement-breakpoint
CREATE INDEX `idx_demo_sessions_client_created` ON `demo_sessions` (`client_hash`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_demo_sessions_expires` ON `demo_sessions` (`expires_at`);
