# **Product Requirement Document (PRD) — Proof of Concept (POC)**

**Project Name:** DeutschEasier (AI-Assisted German Teaching Platform)

**Target Audience:** German Teachers (Primary Content Creators) & Indonesian Students (Learners/Viewers)

**Architecture Paradigm:** Functional TypeScript (effect), SQLite, Single VPS Target

**Document Version:** 1.1.0-POC

## **1\. Executive Summary & Problem Statement**

### **1.1 Problem Statement**

Teaching German to Indonesian speakers poses unique hurdles: teachers spend significant hours curating relevant vocabularies and creating visual, contextual dialog scenarios. Indonesian students have a major phonetic advantage due to historical cognates and loanwords shared with German (e.g., *Kaffee/Kopi, Lampe/Lampu, Musik/Musik, Familie/Keluarga*), but no dedicated tool helps teachers leverage this connection alongside modern generative AI.

### **1.2 Objectives (POC Goals)**

1. **Curated Cognate Bank:** Provide a seed database of at least 100 Indonesian-German cognates with native audio pronunciation for teachers to select and group into class decks.  
2. **AI Scenario & Guide Generator:** Enable teachers to input a short summary prompt (e.g., "Ordering street food at a market in Munich") and produce structured German dialogs, Indonesian translations, and vocabulary clue highlights.  
3. **Frictionless Student View:** Generate lightweight, shareable URLs requiring no student authentication to read the dialogs and listen to audio clips.  
4. **Lean & Deterministic Tech Stack:** Built with TypeScript effect for resilient AI orchestration and typed error handling, paired with embedded SQLite for minimal VPS overhead.

### **1.3 Non-Goals (Strictly Out of Scope for POC)**

* Full Learning Management System (LMS) features (grading, homework submissions, student dashboards).  
* Native mobile applications (iOS/Android) — responsive mobile web is sufficient.  
* Complex multi-tenant authentication or payment gateways.  
* Real-time multi-turn voice chat for students (focus is entirely on teacher material authoring).

## **2\. User Roles & Personas**

### **2.1 Primary User: The German Teacher (Ibu/Bapak Guru)**

* **Goal:** Assemble engaging, pedagogically sound German learning scenarios in under 5 minutes.  
* **Pain Points:** Lack of quick visual scenario generators, time wasted looking up and recording pronunciation audios, difficulty finding relatable starting vocabularies for beginners.

### **2.2 Secondary User: The Student (Siswa)**

* **Goal:** Access and review materials curated by the teacher on mobile/desktop with clear audio pronunciations and contextual hints.  
* **Context:** Clicks a shareable link via WhatsApp/Google Classroom; needs zero friction (no login barriers).

## **3\. Detailed Functional Requirements**

### **Module 1: Cognate Word Bank**

* **FR-1.1 (Dataset):** Seed database containing ![][image1] German-Indonesian cognates, each with:  
  * German word & Grammatical Article (der, die, das).  
  * Indonesian translation & phonetic similarity rating.  
  * Example contextual sentence.  
  * Pre-recorded or pre-rendered audio asset (.mp3).  
* **FR-1.2 (Search & Filter):** Live search by keyword and category filters (e.g., *Essen & Trinken*, *Gegenstände*, *Schule & Beruf*).  
* **FR-1.3 (Selection Basket):** Teachers can select/check multiple words (e.g., 5–10 words) and attach them directly as required vocabularies for scenario generation.  
* **FR-1.4 (Audio Playback):** Instant in-browser preview audio using HTML5 audio elements pointed to static VPS endpoints.

### **Module 2: AI Dialog & Clues Generator**

* **FR-2.1 (Teacher Prompt Input):**  
  * Free-text scenario summary (e.g., *"Percakapan memesan kopi dan kue di kafe Berlin"*).  
  * Target CEFR Level selection: A1 (default), A2, or B1.  
  * Injected cognate list from Module 1\.  
* **FR-2.2 (Generation Engine):**  
  * Pipeline managed via TypeScript effect with typed retries on rate limits.  
  * Structured output extraction validating schema using @effect/schema.  
  * Generates:  
    1. Title & High-level scene description.  
    2. Turn-by-turn dialog lines (Speaker A vs. Speaker B) in German \+ Indonesian translation.  
    3. Key Vocabulary Clues (Grammar notes, root forms, cultural tips).  
* **FR-2.3 (Visual Scenario Representation):**  
  * Generation of a single contextual banner image or avatar placeholders representing Speaker A and Speaker B.  
* **FR-2.4 (Inline Teacher Editor):** Teacher can edit, adjust, or delete dialog turns and vocabulary hints before publishing.

### **Module 3: Publishing & Student View**

* **FR-3.1 (Slug Generation):** Creates a unique, short read-only URL (e.g., /view/\[sessionId\]).  
* **FR-3.2 (Student UI):** Responsive, high-readability page showing:  
  * Scene visual banner.  
  * Chat bubble dialog view with audio replay triggers per sentence.  
  * Pinned vocabulary drawer/cards with Indonesian translations and audio buttons.

## **4\. Technical Architecture & Tech Stack**

### **4.1 Development vs. Deployment Architecture**

\[ LOCAL DEVELOPMENT (Laptop) \]  
Runtime: Node.js 22 LTS \+ \`tsx\` / Vite (Hot-reload, zero-bundle)  
Database: Local SQLite file (\`./prisma/dev.db\` or \`./data/dev.db\`)  
Static Audio: Local filesystem (\`./public/audio/\*.mp3\`)  
AI Mocking: Effect Layer providing mock or live Gemini API calls

                 │  
                 ▼ (Git push & build)  
                 │

\[ PRODUCTION DEPLOYMENT (VPS \- 1 vCPU / 1-2 GB RAM) \]  
Reverse Proxy: Nginx or Caddy (Auto HTTPS via Let's Encrypt)  
Runtime: Node.js (Compiled standalone build / PM2 or Docker)  
Database: Local SQLite file on persistent volume (\`/data/prod.db\`)  
Static Audio: Direct Nginx static serving (\`/var/www/audio\`) with HTTP caching  
AI Orchestration: Live Gemini/OpenAI API via Effect pipeline

### **4.2 Core Tech Stack**

* **Language & Typing:** TypeScript (Strict mode enabled).  
* **Core Logic & Orchestration:** effect (![][image2]) and @effect/schema for error handling, retries, and schema decoding.  
* **Web Framework:** Next.js (Standalone mode) OR Hono (Backend) \+ React/Vite (Frontend).  
* **Database & ORM:** SQLite via Drizzle ORM or Prisma with embedded SQLite engine.  
* **AI Provider:** Google Gemini API (Flash model for structured JSON generation, fast and cost-effective).  
* **Audio Strategy:** Pre-generated static .mp3 files for the initial 100 cognates; Web Speech API (de-DE) as client fallback for dynamic sentences.

## **5\. Data Model & Schemas**

### **5.1 SQLite Database Schema (Drizzle / Prisma Representation)**

datasource db {  
  provider \= "sqlite"  
  url      \= env("DATABASE\_URL")  
}

model WordBank {  
  id              String   @id @default(cuid())  
  germanWord      String  
  article         String?  // der, die, das, or null  
  indonesianWord  String  
  category        String   // e.g., "Food", "Office", "Home"  
  exampleSentence String  
  audioFilename   String   // e.g., "kaffee.mp3"  
  createdAt       DateTime @default(now())

  @@index(\[category\])  
  @@index(\[germanWord\])  
}

model LearningSession {  
  id             String   @id @default(cuid())  
  title          String  
  scenarioPrompt String  
  cefrLevel      String   @default("A1")  
  dialogueJson   String   // Stored as validated JSON string  
  vocabCluesJson String   // Stored as validated JSON string  
  imageUrl       String?  
  published      Boolean  @default(true)  
  createdAt      DateTime @default(now())  
  updatedAt      DateTime @updatedAt  
}

### **5.2 @effect/schema Contract for AI Output**

import { Schema } from "@effect/schema";

export const DialogLineSchema \= Schema.Struct({  
  speaker: Schema.String,  
  germanText: Schema.String,  
  indonesianText: Schema.String,  
});

export const VocabClueSchema \= Schema.Struct({  
  germanWord: Schema.String,  
  indonesianMeaning: Schema.String,  
  grammarTip: Schema.String,  
});

export const GeneratedLessonSchema \= Schema.Struct({  
  title: Schema.String,  
  sceneDescription: Schema.String,  
  dialogue: Schema.Array(DialogLineSchema),  
  vocabClues: Schema.Array(VocabClueSchema),  
});

export type GeneratedLesson \= Schema.Schema.Type\<typeof GeneratedLessonSchema\>;

## **6\. Effect Orchestration Workflow**

The AI scenario generator workflow is isolated inside an Effect service:

\[Teacher Input\]   
      │  
      ▼  
Effect.tryPromise (Call LLM)  
      │  
      ├── \[Error / Rate Limit?\] ──\> Effect.retry (Exponential Backoff, max 3\)  
      │  
      ▼  
Schema.decodeUnknown (Validate JSON against GeneratedLessonSchema)  
      │  
      ├── \[Invalid Schema?\] ──\> Effect.fail(SchemaValidationError)  
      │  
      ▼  
Database Operation (Persist to SQLite via Effect Sqlite Layer)  
      │  
      ▼  
\[Return Success Response to Client\]

## **7\. VPS Deployment Specification**

### **7.1 Minimum Hardware Requirements**

* **vCPU:** 1 Core  
* **Memory (RAM):** 1 GB (2 GB recommended for smooth builds)  
* **Storage:** 20 GB SSD  
* **OS:** Ubuntu 22.04 LTS or Debian 12

### **7.2 Directory & Volume Layout on VPS**

/opt/deutscheasier/  
├── docker-compose.yml  
├── Caddyfile (or /etc/nginx/sites-available/deutscheasier)  
└── data/  
    ├── app.db            \<-- Persisted SQLite DB file  
    └── static-audio/     \<-- Persisted MP3 audio bank

### **7.3 Environmental Variables (.env.production)**

NODE\_ENV=production  
PORT=3000  
DATABASE\_URL="file:/data/app.db"  
GEMINI\_API\_KEY="AIzaSy..."  
PUBLIC\_AUDIO\_BASE\_URL="https://deutsch.yourdomain.com/audio"

## **8\. Acceptance Criteria & Verification Matrix**

| ID | Feature | Verification Criteria | Pass / Fail Rule |
| :---- | :---- | :---- | :---- |
| **AC-1** | Cognate Seed Bank | Database seeds ![][image1] cognates with correct Indonesian translations and audio files. | SQLite query confirms 100 rows; all audio endpoints return status 200 OK. |
| **AC-2** | AI Scenario Generation | Submitting topic prompt \+ level produces a complete dialog structure within 10 seconds. | Response successfully decodes through GeneratedLessonSchema. |
| **AC-3** | Failure Recovery | Simulated API rate limits trigger Effect retry policies automatically without crashing process. | Unit test with flaky mock passes after retries. |
| **AC-4** | Student View Access | Anonymous web client loads /view/:id without login prompts. | HTTP 200 returned on mobile viewport; audio playback operates on touch. |
| **AC-5** | Resource Footprint | Application running in production on VPS consumes ![][image3] MB RAM under idle/moderate load. | Verified via docker stats or htop. |

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAWCAYAAAC/kK73AAAA5klEQVR4Xu2ULQvCYBSFpw4VRGyu7RsG7z8wCRazySYoKILd4g8Qo8lsMdgEP4LRajWY/SM+A9NNxqu8DxzG3nsY51y2OY7FYtFLEAQt3/eXURQFcqYewkdhGK4psEFGztXD1j0KrCiyQx05V08cxw02P6fEAfU5KkqPatI0rVBgwvZPFBhy5EqPdlzC79HL87yaHGrEZeMDAj/Qja13pUEVxpgyIaeEfXLd5r9M6dFGiQ2PCXpHiyRJmtKgiizL6gSdoQsa5R+l9KiDV6FN2CPqcVuQc4vl1/m849cvdcZflc+w/DtvPOguoMY9mAQAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADEAAAAaCAYAAAAe97TpAAACf0lEQVR4Xu2WTUhUURTHtYYsMrLFNIHDvDcfMTARhkEwK61NCC5s1aaCAstoFyRI4MJF5gdUbmxhYfQhaS0K+wCpRa4KhT5soe5sU6va1EKQ+h08F24XR9+YE7N4f/hz7z3nf+4559373kxFRYgQ5Y9sNrsjkUgM+74/53neOPObMOfqyhoUPkLRJ631a/gTJm3dhoGN8yTsTiaTnutbD3j6e9jzN5wxNuaX1NZlazcU8oRIfoNmBv/12LWJb3DKsnVIE4w9trYk4DRikoiED+AR1x8UmUwmyj5bzZq9xrSJRktWWqRSqZ2cSDtJn8DjmDa5mqBgn2YaWGSfc67vv4AnWkURZyniGUWcxhRxNYUQj8f3E/cI/oAjsVhsu6tZCWjzcIK8bxlfcTsOMd6G9+VauvpiEGGTUfglaDEG8rklbpoCPsIa129DG78bjUarZY3+DevvNFLH/KpcSeMrBhGeyCmCP8NJNjrqCoKAuBYpQH47XJ8NNANc5YQuK9EvyMNTX6/cCku+OnK53BYStxE4y3iHMe9qVkGEmAMyGgPJU9IEXAp6ksTskxi9xkVhM8GtBE/By+l0ercrWAskva4F9xkb12Sv2uQ0dtn6QmCf89qE7/pWhN7bC/AFPCMvtKsJCuKHtNgrxibXUAt6Z2w0tg3bRcZaYyPmhKc/iGifMp83PmkG/zWz/gv4GhCPw2MsK11/sSDRQfb6CutlLb8Z3vLJ/pJclq5dGoOPVVfFfAnNQ33BF+GkyuXDck/2NvElB4U0kvQDfA8/wVt8YbK2BluTFE1hnVZcD+uX2GfgYW/5Zgj7pTE7PkRZQt+JiYB87lv/iUKECBEiRCH8Ae5lp8lrwzB9AAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAWCAYAAAC/kK73AAAA7UlEQVR4XmNgGAWjYBQMfaCkpMSvoKCQAGQyo8sNSqCioiIqJyfXLi8vfxqIU7S0tNjQ1QwqICMjIwR18EUgzgF6gB1dzaACQAfyAR3aDAphYNKIAAoxoasZVAAYwpxAxxYB8TlgSKcChVjQ1QwqYGxszAoM2XSgg48NiSQBA4qKimZABz8G4lKgBzjQ5Qc1gCaTKiC+CnR8wZDzADBtCwIdXw3E54G4GOQhdDWDGoDSOdAT+UDHXwGGfqW4uDg3uppBDYCOFgDiTqAH7gE9Uqaurs6LrmZQAykpKRGgBxqA+NSQKXVGwSgYBfQHAMhvJ3t2H1FLAAAAAElFTkSuQmCC>