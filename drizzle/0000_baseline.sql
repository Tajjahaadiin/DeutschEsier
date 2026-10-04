CREATE TABLE "learning_session" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"scenario_prompt" text NOT NULL,
	"cefr_level" text DEFAULT 'A1' NOT NULL,
	"scene_description" text DEFAULT '' NOT NULL,
	"dialogue_json" text NOT NULL,
	"vocab_clues_json" text NOT NULL,
	"dialogue_count" integer DEFAULT 8 NOT NULL,
	"comprehension_questions_json" text,
	"image_url" text,
	"published" boolean DEFAULT true NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"kind" text DEFAULT 'quiz' NOT NULL,
	"access_key" text DEFAULT '' NOT NULL,
	"student_name" text NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_answers" integer NOT NULL,
	"answers_json" text NOT NULL,
	"submitted_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_access_key" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"session_id" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"expires_at" text NOT NULL,
	"created_at" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "scenario_access_key_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "word_bank" (
	"id" serial PRIMARY KEY NOT NULL,
	"german_word" text NOT NULL,
	"article" text,
	"indonesian_word" text NOT NULL,
	"english_meaning" text NOT NULL,
	"category" text NOT NULL,
	"phonetic_similarity" integer DEFAULT 3,
	"example_sentence_de" text DEFAULT '' NOT NULL,
	"example_sentence_id" text DEFAULT '' NOT NULL,
	"audio_filename" text DEFAULT '' NOT NULL,
	"cefr_level" text DEFAULT 'A1' NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_submission_session" ON "quiz_submission" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_submission_kind" ON "quiz_submission" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "idx_access_key" ON "scenario_access_key" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_access_session" ON "scenario_access_key" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_word_bank_category" ON "word_bank" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_word_bank_german" ON "word_bank" USING btree ("german_word");