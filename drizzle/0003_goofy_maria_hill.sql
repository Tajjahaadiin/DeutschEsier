CREATE TABLE `quiz_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`access_key` text DEFAULT '' NOT NULL,
	`student_name` text NOT NULL,
	`score` integer NOT NULL,
	`total_questions` integer NOT NULL,
	`correct_answers` integer NOT NULL,
	`answers_json` text NOT NULL,
	`submitted_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_submission_session` ON `quiz_submission` (`session_id`);--> statement-breakpoint
CREATE TABLE `scenario_access_key` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`session_id` text NOT NULL,
	`label` text DEFAULT '' NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `scenario_access_key_key_unique` ON `scenario_access_key` (`key`);--> statement-breakpoint
CREATE INDEX `idx_access_key` ON `scenario_access_key` (`key`);--> statement-breakpoint
CREATE INDEX `idx_access_session` ON `scenario_access_key` (`session_id`);