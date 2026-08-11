ALTER TABLE `demo_sessions` ADD `mode` text DEFAULT 'public' NOT NULL;
--> statement-breakpoint
ALTER TABLE `demo_sessions` ADD `profile_json` text;
--> statement-breakpoint
ALTER TABLE `demo_sessions` ADD `receipt_provenance` text;
--> statement-breakpoint
ALTER TABLE `demo_sessions` ADD `failure_code` text;
