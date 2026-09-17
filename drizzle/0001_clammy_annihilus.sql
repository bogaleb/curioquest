CREATE TABLE `parent_lock` (
	`id` integer PRIMARY KEY NOT NULL,
	`salt` text NOT NULL,
	`pin_hash` text NOT NULL,
	`recovery_hash` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`window_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `parent_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`identity` text NOT NULL,
	`expires_at` integer NOT NULL
);
