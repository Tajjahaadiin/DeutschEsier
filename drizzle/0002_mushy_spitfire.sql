PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_session` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`scenario_prompt` text NOT NULL,
	`cefr_level` text DEFAULT 'A1' NOT NULL,
	`scene_description` text DEFAULT '' NOT NULL,
	`dialogue_json` text NOT NULL,
	`vocab_clues_json` text NOT NULL,
	`image_url` text,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_learning_session`("id", "title", "scenario_prompt", "cefr_level", "scene_description", "dialogue_json", "vocab_clues_json", "image_url", "published", "created_at", "updated_at") SELECT "id", "title", "scenario_prompt", "cefr_level", "scene_description", "dialogue_json", "vocab_clues_json", "image_url", "published", "created_at", "updated_at" FROM `learning_session`;--> statement-breakpoint
DROP TABLE `learning_session`;--> statement-breakpoint
ALTER TABLE `__new_learning_session` RENAME TO `learning_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_word_bank` (
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
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_word_bank`("id", "german_word", "article", "indonesian_word", "english_meaning", "category", "phonetic_similarity", "example_sentence_de", "example_sentence_id", "audio_filename", "cefr_level", "created_at") SELECT "id", "german_word", "article", "indonesian_word", "english_meaning", "category", "phonetic_similarity", "example_sentence_de", "example_sentence_id", "audio_filename", "cefr_level", "created_at" FROM `word_bank`;--> statement-breakpoint
DROP TABLE `word_bank`;--> statement-breakpoint
ALTER TABLE `__new_word_bank` RENAME TO `word_bank`;--> statement-breakpoint
CREATE INDEX `idx_word_bank_category` ON `word_bank` (`category`);--> statement-breakpoint
CREATE INDEX `idx_word_bank_german` ON `word_bank` (`german_word`);