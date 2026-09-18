CREATE TABLE `reading_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`session_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `reading_profiles`(`child_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reading_attempts_child_date` ON `reading_attempts` (`child_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reading_profiles` (
	`child_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `explorers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reading_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_stories` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reading_words` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
