CREATE TABLE `learning_session` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`scenario_prompt` text NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`dialogue_json` text NOT NULL,
	`vocab_clues_json` text NOT NULL,
	`image_url` text,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `word_bank` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`german_word` text NOT NULL,
	`article` text,
	`indonesian_word` text NOT NULL,
	`english_meaning` text NOT NULL,
	`category` text NOT NULL,
	`phonetic_similarity` integer DEFAULT 3,
	`example_sentence_de` text DEFAULT '' NOT NULL,
	`example_sentence_id` text DEFAULT '' NOT NULL,
	`audio_filename` text DEFAULT '' NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
