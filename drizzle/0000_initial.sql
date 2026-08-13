CREATE TABLE `resumes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `version` text NOT NULL,
  `file_key` text,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `applications` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company` text NOT NULL,
  `role` text NOT NULL,
  `city` text DEFAULT '' NOT NULL,
  `stage` text DEFAULT '网申' NOT NULL,
  `resume_id` integer,
  `applied_at` text NOT NULL,
  `next_action` text DEFAULT '完善申请信息' NOT NULL,
  FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `interview_reviews` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company` text NOT NULL,
  `questions` text NOT NULL,
  `reflection` text DEFAULT '' NOT NULL,
  `created_at` text NOT NULL
);
