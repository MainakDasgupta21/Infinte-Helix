# AI‑Powered Micro‑Wellness & Productivity Assistant for Women Employees  
## Product Concept + System Architecture Dossier (Startup-Level)

**Document status**: Draft v0.1  
**Date**: 2026‑03‑14  
**Repository**: AI‑Powered‑Micro‑Wellness‑Productivity‑Assistant‑for‑Women‑Employees  

---

## Table of contents
- [1. Vision, scope, and principles](#1-vision-scope-and-principles)
- [2. Target users, personas, and JTBD](#2-target-users-personas-and-jtbd)
- [3. Product experience: the daily flow](#3-product-experience-the-daily-flow)
- [4. Feature set (detailed)](#4-feature-set-detailed)
- [5. AI system design (detailed)](#5-ai-system-design-detailed)
- [6. Data model and event taxonomy](#6-data-model-and-event-taxonomy)
- [7. API design (sample contracts)](#7-api-design-sample-contracts)
- [8. System architecture (logical + physical)](#8-system-architecture-logical--physical)
  - [8.7 Infinite Helix – AI Micro Wellness Desktop Assistant](#87-infinite-helix--ai-micro-wellness-desktop-assistant)
- [9. Scalability for millions of users](#9-scalability-for-millions-of-users)
- [10. Security, privacy, compliance, and safety](#10-security-privacy-compliance-and-safety)
- [11. Notifications, scheduling, timers, and reliability](#11-notifications-scheduling-timers-and-reliability)
- [12. Analytics and experimentation](#12-analytics-and-experimentation)
- [13. Codebase structure and microservices plan](#13-codebase-structure-and-microservices-plan)
- [14. MVP roadmap and delivery phases](#14-mvp-roadmap-and-delivery-phases)
- [15. Appendices: prompts, schemas, examples](#15-appendices-prompts-schemas-examples)

---

## 1. Vision, scope, and principles

### 1.1 Product promise
Build a **cycle‑aware, AI‑assisted daily companion** that helps working women:
- **Stay focused** (start/finish meaningful work blocks)
- **Regulate emotions** (de‑escalate stress, anxiety, rumination)
- **Manage energy** (avoid crashes, work with their rhythm)
- **Build a lightweight evidence journal** (“what helps me on days like this”)

The app should feel like a **calm co‑pilot** (not a tracker, not a therapist, not a productivity guilt machine).

### 1.2 Scope boundaries (important)
- **Not a medical device**: the app can be *cycle‑aware* and *wellness‑oriented*, but must avoid diagnoses and clinical claims.
- **User‑led**: self‑reports are the primary source of truth for mood/energy.
- **Privacy by design**: users should be able to use the core experience without granting calendar or health data permissions.
- **Reliability first**: timers and reminders must work even when offline or when the backend is degraded.

### 1.3 Design principles
- **Micro‑interventions**: 30 seconds to 5 minutes; frictionless.
- **Gentle tone**: validating, non‑judgmental, culturally sensitive.
- **Personalization without creepiness**: explain *why* recommendations appear; give controls.
- **Low cognitive load**: 3 taps beats a long questionnaire.
- **Habit formation**: small wins, streaks only if they encourage (no shame loops).
- **Accessibility**: options for audio/text, reduced motion, dyslexia‑friendly mode, screen reader.

### 1.4 Success metrics (north star + supporting)
- **North star**: weekly active users completing ≥3 “regulation moments” (focus session, break, reframe, check‑in).
- **Retention**: D7, D30 retention.
- **Engagement quality**: intervention completion rate, “helpful” feedback rate.
- **Wellness outcomes (proxy)**: reduced “overwhelmed” check‑ins, improved focus ratings (self‑reported).
- **Trust**: low opt‑out rate for notifications, low “creepy” feedback.
- **Unit economics**: AI cost per active user/week and per “AI moment”.

---

## 2. Target users, personas, and JTBD

### 2.1 Target users (as stated + expanded)
- Knowledge workers with **meeting‑heavy days** and context switching
- Users experiencing **stress/anxiety**, **afternoon slumps**, or **burnout risk**
- Users wanting **cycle‑aware insights** without medical framing
- Users balancing work with **caregiving** and limited time/energy
- Users who prefer a **discreet** and private experience (no social feed, no oversharing)

### 2.2 Personas (examples)
1) **“Meeting Marathon Maya” (PM, 32)**  
   - Problem: anxious before stakeholder calls; end‑of‑day emotional spillover  
   - Need: pre‑meeting calm nudges + quick reframes + debrief

2) **“Deep Work Deena” (Engineer, 27)**  
   - Problem: can’t start; gets distracted; eye strain from screens  
   - Need: focus sessions + frictionless breaks + screen health

3) **“Caregiving Chloe” (Ops, 38)**  
   - Problem: unpredictable schedule; guilt when routines break  
   - Need: adaptive plan + “good enough” mode + compassionate guidance

4) **“Cycle‑Sensitive Sam” (Analyst, 29)**  
   - Problem: energy swings; self‑blame during luteal phase  
   - Need: cycle‑aware forecast + boundary scripts + expectation setting

### 2.3 Jobs‑to‑be‑done (JTBD)
- “When I’m overwhelmed, help me **downshift quickly** without needing a long practice.”
- “When I’m tired, help me **choose the right kind of break**.”
- “When I’m nervous before a meeting, help me **show up confident**.”
- “When I’m spiraling in negative thoughts, help me **reframe kindly** and move on.”
- “Help me learn patterns across weeks so I can **plan better** (work + self‑care).”

---

## 3. Product experience: the daily flow

This section describes **what the user sees**, **what the app does internally**, and **what data is produced**.

### 3.1 Morning open (around 9:00 AM)
**User sees**
- **Cycle Energy Forecast** (e.g., “Today might feel: steady energy, lower stress tolerance. Confidence: medium.”)
- **Morning Intention** (AI generated; short; tone‑controlled)
- Optional: “Suggested Focus Block” default (e.g., 45/10 or 25/5)

**Internal steps**
1. App loads local cache (last check‑in, preferences, last daily plan).
2. App requests a server “daily plan” (if online).
3. Backend composes a “Daily Context” and returns a **DailyPlan** with:
   - forecast + confidence
   - intention
   - recommended focus cadence
   - suggested nudges windows (if allowed)

**Data produced**
- `DailyPlanGenerated` event
- (Optional) `CalendarSummaryUpdated` if calendar permission exists

### 3.2 Focus Session start
**User action**
- Starts a focus timer (example: 45 minutes).

**User sees**
- Timer UI, “Do not disturb” suggestion, quick “I’m feeling…” selector.

**Internal steps**
- Timer runs **locally** for reliability.
- App emits `FocusSessionStarted` to backend asynchronously.
- App schedules local notification for end of session (backup).

**Data produced**
- Focus session record + events (start/stop/interrupt).

### 3.3 Smart Break after 45 minutes
**User sees**
- “Smart Break” card with recommended activity:
  - Stressed → guided breathing (30s/2m/5m)
  - Tired → quick stretch routine
  - Eye strain → eye relaxation exercise

**Internal steps**
- App requests break recommendation using the latest mood/energy state.
- Backend selects from an interventions library, applying constraints:
  - time available
  - accessibility preferences
  - recent interventions (avoid repetition)

**Data produced**
- `BreakRecommended`, `BreakStarted`, `BreakCompleted`, `BreakSkipped` events
- “helpful / not helpful” feedback

### 3.4 Pre‑Meeting Calm Nudge (5 minutes before meeting)
**User sees**
- Notification: “2‑minute calm before your meeting?”
- If user taps “I’m nervous”: AI provides a **short confidence affirmation**.

**Internal steps**
- With calendar permission, app syncs meetings and schedules:
  - local notifications (primary for reliability)
  - server pushes (secondary and cross‑device)
- User interaction triggers `CalmNudgeRequested`.
- AI generates a short affirmation under tight length constraints.

**Data produced**
- `MeetingNudgeSent`, `MeetingNudgeOpened`, `CalmNudgeGenerated`

### 3.5 Afternoon slump: thought reframing + journaling
**User action**
- Types a negative thought.

**User sees**
- AI responds with:
  - one validating sentence
  - a gentle reframe
  - one tiny next step
  - optional prompt (“Want to name what you need right now?”)
- Reflection saved into journal automatically.

**Internal steps**
- Safety screening runs first (crisis/medical).
- LLM generates structured output (schema‑validated).
- Journal entry stored; embedding may be computed if user consents.

**Data produced**
- `ThoughtCaptured`, `ThoughtReframed`, `JournalEntryCreated`

### 3.6 End of day check‑in (5:30 PM)
**User sees**
- 3‑tap emotional check‑in (mood/energy/focus)
- Short daily debrief (optional)

**Internal steps**
- Local notification triggers prompt (respects quiet hours).
- Backend stores check‑in and updates personalization signals.

**Data produced**
- `DailyCheckInSubmitted`, `DailyDebriefSubmitted`

### 3.7 Symptoms logging (anytime)
**User sees**
- Symptom selector (headache, fatigue, anxiety, cramps, etc.)
- Intensity slider + notes (optional)

**Internal steps**
- Log stored locally immediately; sync to backend when online.

**Data produced**
- `SymptomLogged`

### 3.8 Weekly Wellness Report (Sunday)
**User sees**
- Report card summarizing:
  - focus sessions
  - mood trends
  - energy patterns
  - symptom frequency
- AI generates a **5‑line reflective summary**.

**Internal steps**
- Reporting service aggregates the week deterministically.
- AI generates narrative strictly grounded in computed stats.
- Report stored and displayed in app.

**Data produced**
- `WeeklyReportGenerated`, `WeeklyNarrativeGenerated`

---

## 4. Feature set (detailed)

### 4.1 Onboarding & personalization
**Goals**
- Reduce stress
- Improve focus
- Manage PMS week
- Sleep consistency
- Confidence in meetings

**Constraints**
- meeting‑heavy schedule
- remote/hybrid
- caregiving
- neurodivergent support (sensory load, task initiation)

**Cycle preferences**
- tracking method: manual vs integration
- irregular cycles support (probabilistic phase estimation)
- privacy: “hide cycle insights”

**Tone & coaching style**
- gentle / direct / minimal / playful
- length preferences (very short vs short vs detailed)
- notification style (quiet vs proactive)

### 4.2 Cycle Energy Forecast (non‑medical)
**Purpose**
- Help user set expectations and choose coping strategies.

**Inputs (opt‑in)**
- manual cycle markers (period start, typical length)
- self‑reports (energy, mood)
- symptoms
- optional wearables/health data proxies (sleep duration, resting HR)

**Outputs**
- energy forecast label (e.g., “steady”, “low”, “variable”)
- emotional bandwidth forecast (e.g., “lower tolerance for stress”)
- confidence estimate + explanation (“based on your past 8 weeks”)
- recommended boundaries (“schedule deep work earlier”)

### 4.3 Focus sessions & productivity
**Modes**
- classic pomodoro (25/5)
- deep work (45/10)
- meeting day micro blocks (15/3)
- “gentle mode” (10/2) for low energy days

**Features**
- session presets
- interruption logging (“meeting”, “message”, “fatigue”)
- optional “intention for this block”

### 4.4 Smart breaks & interventions library
**Intervention types**
- breathing (box, 4‑7‑8, physiological sigh)
- stretching (neck/shoulder/wrist)
- eye relaxation (20‑20‑20, focus shift)
- micro‑walk, hydration
- boundary scripts (one sentence)
- “posture reset”

**Constraints engine**
- time available
- space available (desk vs private room)
- accessibility (mobility constraints)
- user preference history

### 4.5 Meeting mode
**Pre‑meeting**
- calm nudge
- confidence affirmation if nervous
- optional “talk track”

**Post‑meeting**
- 30–90 second reset
- optional quick debrief (“what went well”, “what I need next”)

### 4.6 Journal & insights
**Auto‑saved items**
- reframes
- daily debriefs
- symptom notes

**Tagging**
- “what helped” tags: sleep, caffeine, breaks, boundaries
- optional context tags: “deadline”, “conflict”, “presentation”

**Search**
- by tag, mood, week, symptom

### 4.7 Safety & tone
**Rules**
- non‑judgmental language
- avoid diagnosing
- crisis detection escalation

**User controls**
- disable cycle content
- disable mental‑health language
- reduce notifications
- delete/export data

### 4.8 Business model
**Freemium**
- core timer + basic breaks + basic weekly report

**Premium**
- deeper personalization (RAG)
- advanced reports
- calendar nudges
- richer intervention packs

**B2B (later)**
- employer wellness offering
- strict aggregation + consent
- no individual surveillance; only opt‑in coaching and anonymized trends

---

## 5. AI system design (detailed)

### 5.1 Guiding approach
AI should **augment** deterministic systems rather than replace them:
- deterministic aggregation for stats
- rules + bandit ranking for interventions
- LLM for: language, reframing, narrative summaries, gentle coaching

### 5.2 AI moments (use cases)
1) Morning intention (short)
2) Pre‑meeting affirmation (ultra short)
3) Thought reframing (structured)
4) Personalized recommendations (rank + rationale)
5) Weekly narrative summary (grounded)

### 5.3 AI Orchestrator service (core)
Responsibilities:
- model routing (cheap vs strong)
- prompt templates + versioning
- safety filters (pre + post)
- schema validation of outputs
- caching and dedup
- rate limiting, budgets, fallbacks

Recommended patterns:
- “AI Gateway” internal API: `POST /ai/generate` with `use_case`, `context`, `constraints`
- Output is always JSON with strict schema; frontend renders it.

### 5.4 Mood detection / state inference
**Goal**: a practical, privacy‑aware inference used to choose the right intervention.

Signals (descending priority):
- explicit 1–3 tap check‑in (mood/energy/focus)
- text sentiment from journal entries (opt‑in)
- behavioral signals (session completion, breaks skipped)
- optional health proxies (sleep, HRV proxies), opt‑in

Output:
- `mood_label`: calm / stressed / anxious / low / tired / overwhelmed / focused
- `confidence`: 0–1
- `evidence`: list of signals

Design notes:
- Always prefer explicit user input.
- Do not claim detection certainty; always allow override (“No, I’m actually tired”).

### 5.5 Thought reframing (CBT‑inspired, non‑clinical)
Structured output schema:
- `validation`: 1 sentence
- `reframe`: 1–3 sentences
- `next_step`: 1 actionable micro step
- `optional_prompt`: 0–1 question (only if user preference allows)
- `tags`: optional (e.g., “perfectionism”, “mind reading”)

Guardrails:
- crisis/self‑harm detection → show resources and suggest reaching out
- medical content → “consult professional” style boundary
- avoid shaming; avoid absolutist claims

### 5.6 Personalized recommendations
**Goal**: deliver the “right micro‑intervention at the right time” with minimal user effort.

Recommendation inputs:
- user’s latest state (mood/energy/focus)
- cycle forecast and confidence
- recent interventions and feedback (helpful/not helpful)
- time constraints (next meeting, commute, quiet hours)
- environment constraints (desk, public, private)

Recommendation outputs:
- ranked list of interventions (top 1–3)
- each with: duration options (30s/2m/5m), accessibility variants, rationale, and expected effort

Decision strategy (pragmatic, scalable):
- **Stage 1 (deterministic filtering)**: remove interventions that violate constraints.
- **Stage 2 (ranking)**:
  - MVP: rules + weighted scoring
  - Later: contextual bandit (learn what works per user)
  - Later: cohort signals (anonymized) to warm‑start new users
- **Stage 3 (LLM copy layer)**: rewrite recommendation text in the user’s preferred tone and length, grounded in the chosen intervention.

### 5.7 Weekly report generation (grounded narrative)
Two‑stage pipeline:
1) **Deterministic aggregation** (no AI):
   - counts: focus sessions, total focus minutes
   - distributions: time‑of‑day productivity, mood/energy histograms
   - trends: week‑over‑week deltas
   - symptoms frequency + co‑occurrence with low energy
2) **LLM narrative** (AI, grounded):
   - input: computed stats + selected highlights + user goals
   - output: 5‑line reflective summary + 1 suggested experiment for next week
   - rule: the narrative must only reference numbers present in the computed stats (“no hallucination”)

### 5.8 Prompt management, evaluation, and quality
Prompt management:
- store prompts in code with semantic versioning (e.g., `reframe/v3`)
- log prompt version + model + latency + tokens + outcome feedback (helpful rating)

Evaluation (continuous):
- unit tests for JSON schema adherence
- golden test set for reframes (tone, safety, non‑diagnosis)
- weekly audit sampling of anonymized outputs (only if user consents to improve product)

Quality controls:
- strict max tokens per use case
- enforce “ultra short” responses for nudges (e.g., max 240 characters)
- fallback to deterministic templates if AI fails

### 5.9 Safety, crisis, and policy layer
Safety pipeline:
- **pre‑screen**: detect crisis/self‑harm; block normal generation
- **generation**: safe system prompt + allowed topics + restricted language
- **post‑screen**: detect disallowed content; re‑generate or return safe fallback

Product behavior for crisis signals:
- show a supportive message and encourage reaching out to local emergency resources or trusted contacts
- provide region‑aware hotline links when feasible (or a generic safe message if unknown)
- do not attempt therapy; do not provide medical instructions

### 5.10 AI cost controls and reliability
Cost controls:
- per‑user and per‑org budgets (tokens/day)
- caching for repeated nudges and generic interventions
- smaller model for classification/routing; stronger model for reframing and weekly narrative

Reliability:
- timeouts and retries with jitter
- circuit breaker: if provider is down, return a rules‑based recommendation or a saved “best of” template

---

## 6. Data model and event taxonomy

### 6.1 Core entities (system of record)
- **User**: identity, consent, preferences, locale, timezone
- **CycleProfile**: cycle settings, known period starts, typical length range
- **DailyPlan**: forecast, intention, recommended cadence, confidence, explanation
- **CheckIn**: timestamp, mood, energy, focus, optional note
- **FocusSession**: start/end, duration, interruptions, rating
- **BreakSession**: type, duration, completion, feedback
- **JournalEntry**: type (reframe/debrief/free), content, tags, linked source
- **SymptomLog**: symptom, intensity, note
- **MeetingNudge**: meeting reference (hashed), send time, opened, user response
- **WeeklyReport**: computed aggregates + narrative

### 6.2 Suggested relational tables (PostgreSQL)
Minimum tables:
- `users`, `user_preferences`, `consents`
- `cycle_profiles`, `cycle_markers`
- `check_ins`
- `focus_sessions`, `focus_interruptions`
- `break_sessions`
- `journal_entries`, `journal_tags`, `journal_entry_tags`
- `symptom_logs`
- `daily_plans`
- `weekly_reports`
- `notification_tokens`, `notification_preferences`
- `ai_runs` (metadata only; avoid storing sensitive raw text unless consent)

### 6.3 Event taxonomy (analytics + async processing)
Event names (examples):
- `DailyPlanGenerated`
- `FocusSessionStarted`, `FocusSessionCompleted`, `FocusSessionInterrupted`
- `BreakRecommended`, `BreakStarted`, `BreakCompleted`, `BreakSkipped`
- `MeetingNudgeScheduled`, `MeetingNudgeSent`, `MeetingNudgeOpened`
- `ThoughtCaptured`, `ThoughtReframed`, `ReframeRated`
- `DailyCheckInSubmitted`, `DailyDebriefSubmitted`
- `SymptomLogged`
- `WeeklyReportGenerated`, `WeeklyNarrativeGenerated`, `WeeklyReportViewed`

Event fields (minimum):
- `event_id`, `event_name`, `occurred_at`, `user_id`
- `session_id` (if relevant), `device_id` (pseudonymous), `app_version`
- `properties` JSON (small, typed)

### 6.4 Vector memory (personalization)
If user consents:
- store embeddings for selected journal entries and “what helped” notes
- use `pgvector` table:
  - `user_id`, `entry_id`, `embedding`, `created_at`, `kind`, `redaction_level`

---

## 7. API design (sample contracts)

### 7.1 API style and conventions
- REST + JSON for mobile simplicity
- versioned paths: `/v1/...`
- idempotency keys for writes from unstable networks
- server timestamps returned for consistency

### 7.2 Core endpoints (examples)
Auth:
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`

Daily plan:
- `GET /v1/daily-plan?date=YYYY-MM-DD`

Check-ins:
- `POST /v1/check-ins`
- `GET /v1/check-ins?from=...&to=...`

Focus sessions:
- `POST /v1/focus-sessions/start`
- `POST /v1/focus-sessions/complete`
- `POST /v1/focus-sessions/interrupt`

Break recommendations:
- `POST /v1/break-recommendations`
- `POST /v1/break-sessions/start`
- `POST /v1/break-sessions/complete`

Thought reframing:
- `POST /v1/reframes`
- `POST /v1/reframes/{id}/rating`

Journal:
- `GET /v1/journal?from=...&to=...&tag=...`

Symptoms:
- `POST /v1/symptoms`
- `GET /v1/symptoms?from=...&to=...`

Weekly reports:
- `GET /v1/reports/weekly?week_start=YYYY-MM-DD`

Notifications:
- `POST /v1/notifications/token`
- `PUT /v1/notifications/preferences`

### 7.3 Sample request/response (reframe)
`POST /v1/reframes`
- Request:
  - `text`: string
  - `context`: `{ mood?, energy?, situation_tags?, cycle_phase? }`
  - `preferences`: `{ tone, verbosity }` (optional override)
- Response:
  - `reframe_id`
  - `validation`
  - `reframe`
  - `next_step`
  - `optional_prompt` (nullable)

### 7.4 Sample request/response (daily plan)
`GET /v1/daily-plan?date=2026-03-14`
- Response:
  - `date`
  - `cycle_energy_forecast`: `{ label, confidence, explanation }`
  - `morning_intention`: `{ text, tone, length }`
  - `recommended_focus_cadence`: `{ focus_minutes, break_minutes }`
  - `nudge_windows`: array

---

## 8. System architecture (logical + physical)

### 8.1 Logical architecture (components)
At a high level:
- **Mobile app (iOS/Android)**: UI, local timers, offline-first queue, notification handling
- **API Gateway**: single entry point for clients
- **Core backend**: product services and data access
- **AI Orchestrator**: LLM routing + guardrails + schema validation
- **Event backbone**: async processing (reports, notifications, embeddings)
- **Observability**: logs, metrics, traces, crash reports

Logical diagram (conceptual):

```
 [Mobile App] 
   |  HTTPS (REST, JSON)
   v
 [API Gateway] ---> [Auth/Identity]
      |
      +--> [Daily Plan / Recommendations]
      +--> [Focus Sessions]
      +--> [Journal + Reframes]
      +--> [Symptoms + Check-ins]
      +--> [Notifications + Scheduling] ---> (APNs/FCM)
      +--> [Reporting]
      |
      +--> [AI Orchestrator] ---> [LLM Provider(s)]
      |
      +--> [PostgreSQL]  [Redis]
      |
      +--> [Event Bus/Queue] ---> [Workers: embeddings, weekly jobs, nudges]
```

### 8.2 MVP architecture approach: modular monolith (with clean boundaries)
Recommended for speed and correctness:
- One backend deployable with **modules** (NestJS modules or similar):
  - identity, profile, cycle, focus, breaks, journal, symptoms, recommendations, notifications, reporting, ai
- Strict internal module boundaries + interfaces so services can be extracted later.

Why this is the right startup choice:
- reduces operational overhead
- keeps early iteration fast
- preserves a migration path to microservices when scale demands

### 8.3 Microservices evolution (when needed)
Extract by scale and team ownership:
1) **notification-service** (high fan-out, retries, token mgmt)
2) **ai-orchestrator-service** (cost + provider complexity)
3) **reporting-service** (heavy batch workloads)
4) **focus-session-service** if realtime/high write volume becomes a hotspot

### 8.4 Physical deployment (AWS reference, vendor-neutral)
**AWS reference**:
- Compute: **ECS Fargate** (fast ops) or **EKS** (Kubernetes, when needed)
- API: **API Gateway** + **ALB**
- Auth: **Cognito** (or Auth0)
- DB: **Aurora PostgreSQL**
- Cache: **ElastiCache Redis**
- Async: **SQS** + **SNS** (or MSK Kafka later)
- Scheduling: **EventBridge Scheduler**
- Storage: **S3**
- CDN: **CloudFront**
- Secrets: **Secrets Manager** + **KMS**
- Push: **APNs + FCM** (optionally via Pinpoint)
- Observability: OpenTelemetry + CloudWatch/Datadog

**GCP equivalent**:
- Cloud Run/GKE, Cloud SQL Postgres, Memorystore Redis, Pub/Sub, Cloud Scheduler, Cloud Storage, Cloud CDN, Secret Manager, Firebase Auth

### 8.5 Recommended technology stack (detailed, by capability)

Mobile app development:
- **React Native + TypeScript**
- Navigation: React Navigation
- State/server cache: **TanStack Query**
- Local state: Zustand (small, predictable)
- Offline persistence: SQLite (Expo SQLite) or WatermelonDB (for heavier offline)
- Crash reporting: **Sentry**
- Feature flags: PostHog or LaunchDarkly (later)

Backend services:
- **TypeScript + NestJS** (modular, DI, testable)
- Validation: Zod or class-validator (paired with OpenAPI)
- API docs: OpenAPI/Swagger
- Background jobs: queue workers (SQS consumers)

AI features:
- LLM provider: OpenAI or Anthropic (via AI Orchestrator)
- Embeddings: provider embeddings + `pgvector`
- Evaluation: prompt golden set + schema checks

Database:
- **PostgreSQL** (system of record)
- **Redis** (cache, rate limits, idempotency keys, feature flags)
- Object store: **S3/GCS** for report artifacts

Notifications:
- **FCM** (Android) + **APNs** (iOS)
- In-app inbox (recommended) to reduce notification pressure

Scheduling and timers:
- Timers: **on-device** timers with local notifications (primary)
- Scheduling: EventBridge Scheduler/Cloud Scheduler for weekly jobs and server-driven nudges
- Calendar: Google Calendar API + Microsoft Graph (optional, permissioned)

Analytics:
- Product analytics: **PostHog** (fast start) or Segment → Amplitude
- Warehouse (later): BigQuery/Snowflake + dbt

### 8.6 Observability and operational readiness
- Structured logs (JSON) with correlation IDs
- Metrics: request latency, queue lag, push success rate, AI error rate, AI cost/user
- Tracing: OpenTelemetry end-to-end (mobile span IDs optional later)
- Alerting: notification failures, report job failures, LLM timeouts, DB saturation

### 8.7 Infinite Helix – AI Micro Wellness Desktop Assistant
This product extension adds a **background-running desktop assistant** called **“Infinite Helix – AI Micro Wellness Assistant”**. It is designed primarily for **women employees** to maintain healthy work habits, emotional balance, and productivity **during laptop-based work**.

The assistant must feel like a **calm supportive companion**, not a productivity monitor:
- **Employee-friendly**: supportive language, user control, no surveillance framing
- **Non-intrusive**: nudges are contextual, throttled, and respectful of quiet hours
- **Private by default**: run locally; cloud sync optional
- **Intelligent**: nudges triggered by behavior + emotional signals, not generic timers

#### 8.7.1 Project purpose (why desktop)
Modern employees often work for long continuous stretches and ignore:
- hydration
- posture/micro-movement
- eye strain
- mental stress and emotional fatigue

Women employees may experience additional day-to-day variance due to:
- cycle-related energy changes (optional feature)
- meeting pressure and performance anxiety
- mental load and context switching

#### 8.7.2 Core capabilities (mapped to feature requirements)
1) **Work behavior tracking** (local, background)
   - measure: screen/active time proxy, keyboard activity, work duration, idle time
   - libraries: `psutil`, `pynput`
   - output: continuous “work rhythm” signals (continuous-work minutes, typing intensity, idle intervals)

2) **Context-aware wellness nudges**
   - nudges are *moment-based*:
     - “You just finished a long report—this is a good moment to hydrate.”
   - nudge types:
     - hydration reminder
     - stretch reminder
     - eye relaxation
     - short breathing break

3) **Emotion-based break suggestion model**
   - when users type thoughts/journal entries, run emotional analysis
   - if stress/frustration detected: suggest breathing, short walk, stretch, affirmation

4) **AI stress detection & emotional support**
   - sentiment/emotion detection flags negative thinking patterns
   - provide gentle reframing and micro-steps (supportive, not clinical)

5) **Pre-meeting calm nudge**
   - integrate with **Google Calendar**
   - if meeting within 10–15 minutes: offer 30-second confidence breath

6) **Cycle Energy Mode (optional, private)**
   - user optionally logs cycle phase (or disables entirely)
   - recommendations adapt (high-focus tasks on high-energy days, lighter suggestions on low-energy days)
   - must be respectful and never mandatory

7) **Daily wellness dashboard**
   - show:
     - screen/active time proxy
     - focus sessions and break balance
     - “productivity rhythm” score (non-punitive)
     - hydration nudges completed
   - use charts (Chart.js)

8) **Weekly wellness report card**
   - weekly summary:
     - total work hours
     - stress patterns and peak stress windows
     - hydration frequency
     - break balance
     - emotional insights from journal activity
   - example insight: “You focused deeply this week but skipped breaks on Wednesday.”

9) **Smart hydration reminder (behavior-based, not time-only)**
   - triggers:
     - after 2 hours of active work
     - after intense typing bursts
     - after user-marked “task completion”

10) **Background operation**
   - run quietly with minimal CPU/memory footprint
   - collect signals, compute nudges, and notify gently

#### 8.7.3 Desktop architecture (prototype-friendly)
For a working prototype, use a **local-first full-stack** that can optionally sync to Firebase:
- **Frontend (desktop dashboard UI)**: React + Tailwind CSS + Chart.js
- **Backend (local agent service)**: Python Flask
  - runs the work-behavior tracker (background threads)
  - runs AI inference (Hugging Face Transformers)
  - exposes local APIs to the UI
- **Database / Sync**: Firebase (Firestore) for optional cloud persistence and multi-device continuity
- **Calendar integration**: Google Calendar API (OAuth)
- **Notifications**: Browser Notification API (if running as desktop web UI) or desktop notifications via the host shell

Key implementation note:
- Treat the desktop assistant as a **local “agent”**. It should not require the cloud for core functions.
- Cloud features (reports, cross-device sync) are opt-in and must be transparent.

#### 8.7.4 AI layer (Hugging Face models)
Required models:
- **Emotion detection**: `j-hartmann/emotion-english-distilroberta-base`
- **Sentiment**: `cardiffnlp/twitter-roberta-base-sentiment`

Pipeline:
1) User types journal/thought text
2) Run sentiment + emotion inference
3) If negative/stress:
   - generate a supportive response template:
     - validate
     - reframe
     - one micro-step
4) Suggest an intervention (breathing/walk/stretch)

Operational guidance:
- lazy-load models (first use) and keep them in memory
- cap input length and sanitize text
- provide fast fallback messaging if inference fails

#### 8.7.5 Nudge engine (non-intrusive rules + throttling)
Nudge design rules:
- never more than \(N\) nudges/day (user-configurable)
- cooldown after dismissals
- respect quiet hours and “in meeting” windows
- avoid repetitive nudges (rotate categories)

Example trigger logic (prototype):
- **Break**: continuous active work >= 50 minutes → “micro-break”
- **Hydration**: active work >= 120 minutes OR typing intensity high for 10 minutes → hydration suggestion
- **Eyes**: continuous work with low idle + high screen proxy → 20-20-20 suggestion

Tone requirements:
- gentle, specific, and contextual
- avoid “should” language and avoid guilt framing

#### 8.7.6 Data storage (Firebase) and privacy
Store (opt-in) in Firestore:
- user profile and preferences (including cycle mode)
- mood logs / journal signals (redacted summaries if preferred)
- work sessions + break/hydration acknowledgements
- weekly reports

Privacy defaults:
- allow “local-only mode”
- allow selective sync (e.g., sync aggregates but not raw journal text)
- allow deletion/export

#### 8.7.7 Where this lives in the repo
The prototype implementation is provided under:
- `apps/infinite-helix/` (frontend + backend + setup)

---

## 9. Scalability for millions of users

### 9.1 Principles
- stateless services + horizontal autoscaling
- async processing for anything non-interactive
- “hot path” endpoints optimized and cached
- partition high-volume tables by `user_id` when needed

### 9.2 Scaling the data layer
- Postgres:
  - strong indexing strategy (`user_id`, `occurred_at`, composite indexes for timelines)
  - read replicas for report reads
  - partitioning for event-like tables (monthly partitions)
- Redis:
  - cache daily plan (per user/day)
  - rate limits and idempotency
- Object store for heavy artifacts (weekly PDF or share images, if added later)

### 9.3 Scaling async workloads
- use queue per workload:
  - `ai_embeddings_queue`
  - `weekly_reports_queue`
  - `notification_fanout_queue`
- backpressure with queue depth + autoscaling workers
- idempotent consumers (dedupe by idempotency key)

### 9.4 LLM scaling and cost containment
- route use cases:
  - small model: classification, tone selection, routing
  - stronger model: reframing + weekly narrative
- cache:
  - generic intervention scripts
  - repeated “pre-meeting calm” templates
- strict token budgets and timeouts
- graceful degradation: rules-based fallbacks

### 9.5 Multi-region strategy (later)
- start single region with backups + DR runbooks
- evolve to:
  - global edge + regional services
  - multi-region read replicas
  - geo-based routing

---

## 10. Security, privacy, compliance, and safety

### 10.1 Data classification
- PII: email, name (optional), device tokens
- Sensitive wellness data: mood, symptoms, journal text, cycle markers
- Derived insights: forecasts, trends, embeddings

### 10.2 Privacy-by-design controls
- explicit consent gates for:
  - calendar access
  - health integrations
  - storing raw journal text server-side (optional)
  - using data to improve AI quality (opt-in)
- user controls:
  - export data (JSON/CSV)
  - delete account + data deletion SLA
  - “hide cycle insights”

### 10.3 Security controls (baseline)
- encryption in transit (TLS) and at rest (KMS-managed)
- secrets management (no secrets in code)
- RBAC for internal dashboards (least privilege)
- audit logs for admin access
- rate limiting + bot protection

### 10.4 Compliance posture (pragmatic roadmap)
- MVP: GDPR-aware design, data deletion, privacy policy, secure storage
- Growth: SOC2 readiness (logging, access control, vendor reviews)
- Avoid positioning as medical; consult legal for health data jurisdictions

### 10.5 Safety: crisis content handling
- detect crisis/self-harm signals in text inputs
- respond with safe messaging + resources
- do not store crisis text unless necessary; minimize exposure

---

## 11. Notifications, scheduling, timers, and reliability

### 11.1 Reliability model (two layers)
1) **Local notifications**: primary for timers and meeting nudges
2) **Server push**: secondary and cross-device support

### 11.2 Quiet hours and notification governance
- user-defined quiet hours + timezone-aware scheduling
- throttle rules:
  - max nudges/day
  - cooldown after “not now”
- “notification health” metric: opt-out and disable rates

### 11.3 Timers (iOS/Android realities)
- timers must run locally; backend only records events
- handle background constraints:
  - schedule local notifications at start
  - on resume, reconcile elapsed time
- ensure no loss of sessions offline:
  - local event queue + retries

### 11.4 Calendar nudges
- store only minimal meeting metadata:
  - hashed meeting ID, start time, duration (no title unless explicit consent)
- “5 minutes before” scheduling done locally; server schedule optional

---

## 12. Analytics and experimentation

### 12.1 Event pipeline
- client emits analytics events (non-PII by default)
- server emits operational events (jobs, pushes, AI run metadata)
- unify in PostHog/Segment for product metrics

### 12.2 Experiments to improve retention
- focus cadence defaults: 25/5 vs 45/10
- nudge copy variants (gentle vs direct)
- intervention ordering (breathing vs stretch first)
- report format (cards vs narrative emphasis)

### 12.3 Feature flags
- gate calendar integration rollout
- gate new AI prompt versions
- gate new intervention packs

---

## 13. Codebase structure and microservices plan

### 13.1 Monorepo structure (recommended)
```
apps/
  mobile/              # React Native app
  api/                 # NestJS backend (modular monolith)
packages/
  shared/              # shared types, schemas, utilities
  ai/                  # prompt templates, schemas, evaluation fixtures
infra/
  terraform-or-cdk/    # IaC (later)
docs/
  Product_Architecture_Dossier.md
scripts/
  generate_pdf.py
```

### 13.2 Backend module boundaries (DDD-style)
- `identity` (auth, sessions)
- `profile` (preferences, consents)
- `cycle` (markers, phase estimates)
- `focus` (sessions, interruptions)
- `breaks` (recommendations, sessions)
- `journal` (entries, tags)
- `symptoms` (logs)
- `recommendations` (ranking engine)
- `notifications` (tokens, preferences, scheduling interface)
- `reporting` (weekly aggregation)
- `ai` (orchestrator, prompt versions)

### 13.3 Microservices split plan (future)
When splitting:
- keep each service owning its schema/tables
- communicate via events + small APIs
- avoid shared DB long-term

---

## 14. MVP roadmap and delivery phases

### Phase 0 (2–3 weeks): Foundations
- UI kit/design system + accessibility baseline
- auth + profile + preferences + quiet hours
- local storage + offline queue
- basic analytics + crash reporting
- backend skeleton + Postgres schema

### Phase 1 (4–6 weeks): Core daily loop MVP (non-AI first)
- focus timer + smart breaks (rules-based)
- end-of-day 3-tap check-in + debrief
- symptom logging
- weekly report card (deterministic, no AI)

### Phase 2 (4–6 weeks): AI v1 (high value, controlled scope)
- thought reframing with safety + feedback
- morning intention generation
- weekly reflective 5-line summary grounded in stats
- AI budgets, prompt versioning, fallbacks

### Phase 3 (6–10 weeks): Personalization + scheduling
- cycle-aware forecast with confidence bands
- calendar integration + pre-meeting nudges
- personalization (RAG over user history, opt-in)
- feature flags + experiments

### Phase 4 (ongoing): Scale & trust
- extract notification/AI/reporting services
- warehouse + deeper analytics
- SOC2 posture improvements
- multi-region readiness

---

## 15. Appendices: prompts, schemas, examples

### 15.1 Example AI prompts (high level)
Morning intention (inputs: goals, tone, constraints):
- “Generate a single-sentence intention for today. Keep it kind, non-medical, under 180 characters.”

Pre-meeting affirmation:
- “Generate a confident, grounding message. Under 200 characters. Avoid clichés. Match tone: {tone}.”

Thought reframe:
- “Given a negative thought, produce: validation, reframe, next_step, optional_prompt. No diagnosis. No medical advice.”

Weekly narrative:
- “Write 5 lines that reflect the week using ONLY these computed stats: {stats_json}.”

### 15.2 Example JSON schema (reframe response)
Fields:
- `validation`: string
- `reframe`: string
- `next_step`: string
- `optional_prompt`: string | null
- `tags`: string[] (optional)

### 15.3 Example weekly report outline
- Focus: 6 sessions, 270 minutes
- Best focus window: 10:00–12:00
- Mood trend: stressed on Tue/Thu, calm on Fri
- Energy: lowest at ~15:00
- Symptoms: headache 2x, anxiety 3x
- Narrative (5 lines) + one suggested experiment for next week


