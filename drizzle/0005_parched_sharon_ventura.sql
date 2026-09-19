CREATE TABLE `child_world_items` (
	`child_id` text NOT NULL,
	`item_id` text NOT NULL,
	`earned_at` text NOT NULL,
	PRIMARY KEY(`child_id`, `item_id`),
	FOREIGN KEY (`child_id`) REFERENCES `explorers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `world_items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_adventures` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `experience_profiles` (
	`child_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `explorers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interactive_media_events` (
	`id` text PRIMARY KEY NOT NULL,
	`media_id` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `interactive_media_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`child_id` text NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`child_id`) REFERENCES `experience_profiles`(`child_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_responses_child_date` ON `interactive_media_responses` (`child_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `world_items` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `world_item_placements` (
	`child_id` text NOT NULL,
	`slot` text NOT NULL,
	`item_id` text NOT NULL,
	PRIMARY KEY(`child_id`, `slot`),
	FOREIGN KEY (`child_id`) REFERENCES `explorers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `world_items`(`id`) ON UPDATE no action ON DELETE no action
);
