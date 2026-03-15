# Project Proposal: Infinite Helix – AI Micro Wellness Assistant

**Document type:** Formal proposal for management review  
**Date:** March 2026  
**Subject:** Full-stack AI-powered desktop wellness assistant for women employees  

---

## Executive summary

This proposal outlines the design and implementation of **Infinite Helix – AI Micro Wellness Assistant**, a background-running desktop application aimed at supporting **women employees** in maintaining healthy work habits, emotional balance, and productivity during the workday. The system observes work behaviour in a privacy-preserving manner and delivers **gentle, context-aware wellness nudges** rather than generic or intrusive reminders. The assistant is intended to feel like a **calm, supportive companion**—employee-friendly, emotionally supportive, non-intrusive, and intelligent—and to support the organisation’s commitment to employee well-being without framing the tool as productivity surveillance.

---

## 1. Project purpose

Modern employees frequently work long, continuous hours at their laptops and often neglect hydration, posture, mental stress, and emotional fatigue. Women employees can face additional factors such as hormonal cycles, mental load, and meeting-related pressure.

The AI assistant is designed to help by:

- Understanding work behaviour (e.g. sustained focus, typing intensity, idle patterns)
- Detecting signs of fatigue or stress from behaviour and optional journal input
- Providing intelligent, micro wellness suggestions at appropriate moments
- Supporting emotional well-being through gentle reframing and affirmations
- Encouraging healthier work rhythms (breaks, hydration, eye rest)

The product should be perceived as a **calm, supportive companion** rather than a productivity monitor.

---

## 2. Core features to implement

### 2.1 Work behaviour tracking

- Track screen-time proxy, keyboard activity, work duration, and idle time to understand work patterns.
- Use this data to detect fatigue patterns and long continuous work sessions.
- Implement via a Python background service using **psutil** and **pynput** (no content capture; timing and counts only).

### 2.2 Context-aware wellness nudges

- Replace generic reminders with **contextual** suggestions (e.g. “You just finished a long report—this is a good moment to hydrate” instead of “Drink water”).
- Nudge types: hydration reminder, stretch reminder, eye relaxation suggestion, short breathing break.
- Notifications must be gentle, supportive, and throttled to avoid overload.

### 2.3 Emotion-based break suggestion model

- When users type thoughts or journal entries, analyse emotional state using AI.
- If stress or frustration is detected, suggest: breathing exercise, short walk, stretch break, or positive affirmation.

### 2.4 AI stress detection and emotional support

- Use sentiment and emotion detection to identify negative thinking patterns.
- Example: user types “I cannot finish this work.” System responds with supportive reframing (e.g. “You’ve handled similar tasks before. A short reset might help.”) to create an emotionally supportive environment.

### 2.5 Pre-meeting calm nudge

- Integrate with **Google Calendar**.
- When a meeting is detected within 10–15 minutes, send a notification such as: “Meeting in 15 minutes. Want a 30-second confidence breath?” to support meeting-anxiety reduction.

### 2.6 Cycle Energy Mode (women-focused, optional)

- Allow users to **optionally** log cycle phase.
- Adjust wellness recommendations by energy patterns (e.g. high-focus suggestions on high-energy days; lighter work and stress-care suggestions on low-energy days).
- This feature must be **respectful, optional, and private**.

### 2.7 Daily wellness dashboard

- Dashboard showing: screen-time proxy, focus sessions, break balance, productivity rhythm score, hydration reminders completed.
- Use charts for clear visualisation.

### 2.8 Weekly wellness report card

- Weekly summary: total work hours, stress patterns, hydration frequency, break balance, emotional insights.
- Example insight: “You focused deeply this week but skipped breaks on Wednesday.”

### 2.9 Smart hydration reminder

- **Behaviour-based** (not purely time-based) triggers, e.g. after long task completion, after ~2 hours of work, or after an intense typing session.

### 2.10 Background operation

- The assistant runs quietly in the background; tracks work behaviour; detects fatigue; sends contextual notifications; and avoids frequent or disruptive interruptions.

---

## 3. Recommended technology stack and alternatives

This section provides the proposed stack for a **working prototype** and **recommended alternatives or upgrades** for production or organisational fit. Choices are aimed at clarity, maintainability, and alignment with common enterprise practices.

### 3.1 Frontend (dashboard, mood journal, wellness insights)

**Proposed for prototype:** React, Tailwind CSS, Chart.js (or Recharts).

**Recommendation:**  
- **React** with **Vite** (instead of Create React App) for faster builds and a simpler configuration.  
- **Tailwind CSS** is well-suited for rapid, consistent UI development.  
- **Chart.js** or **Recharts** for analytics; Recharts offers good accessibility and composability for more complex dashboards later.

**Alternative:** If the organisation standardises on Vue, **Vue 3 + Vite + Tailwind** is a viable alternative with similar capabilities.

---

### 3.2 Backend (APIs, behaviour analysis, wellness logic)

**Proposed for prototype:** Python Flask.

**Recommendation:**  
- **Flask** is appropriate for a **fast prototype** and small team: minimal setup, clear structure, good ecosystem.  
- For **production or scale**, **FastAPI** is strongly recommended: native async support, automatic OpenAPI documentation, better performance under load, and type hints that improve maintainability.  
- If the organisation prefers a TypeScript backend (e.g. to align with a mobile or web backend), **Node.js with NestJS** or **Fastify** is a viable alternative; the behaviour tracker and AI layer could remain in Python and be called via a small service or API.

---

### 3.3 AI layer (emotion and sentiment detection)

**Proposed for prototype:** Hugging Face Transformers with:

- **Emotion detection:** `j-hartmann/emotion-english-distilroberta-base`
- **Sentiment detection:** `cardiffnlp/twitter-roberta-base-sentiment`

**Recommendation:**  
- These models are **well-suited for prototype validation** and provide good accuracy for English text.  
- For **production**, consider:  
  - **ONNX Runtime** or **TensorRT** for lower latency and smaller footprint.  
  - **Smaller distilled models** if the assistant runs on resource-constrained or locked-down machines.  
  - Keeping a **fallback path** (e.g. rule-based or template responses) when the model is unavailable or inference fails.

**Dependencies:** `pip install transformers torch` (or `torch` with CPU-only build if GPU is not required).

---

### 3.4 Work behaviour tracking

**Proposed:** Python background service using **pynput** (keyboard/mouse activity) and **psutil** (system metrics).

**Recommendation:**  
- This combination is **appropriate and privacy-preserving** (no key content or window titles).  
- For **production**, consider running the tracker as a **dedicated system service** (e.g. systemd on Linux, LaunchAgent on macOS, or a Windows service) so it remains active across user sessions if required.  
- **Packaging:** PyInstaller or similar can bundle the Python service for distribution without requiring a global Python install.

---

### 3.5 Database and persistence

**Proposed for prototype:** Firebase (Firestore) for user profile, mood logs, work sessions, hydration reminders, and wellness reports.

**Recommendation:**  
- **Firebase/Firestore** is suitable for **rapid prototyping** and offers real-time sync and simple authentication.  
- **Alternatives to consider:**  
  - **Supabase (PostgreSQL)** if the organisation prefers open-source, SQL, or stricter data residency and reporting.  
  - **Local-first with optional sync:** SQLite (or similar) on the device for full offline operation, with optional sync to a central database (Firestore, Supabase, or PostgreSQL) when policy allows.

---

### 3.6 Calendar integration

**Proposed:** Google Calendar API for detecting upcoming meetings and triggering pre-meeting calm nudges.

**Recommendation:**  
- **Google Calendar API** is the right choice when the organisation uses Google Workspace.  
- If the organisation uses **Microsoft 365 / Outlook**, **Microsoft Graph API** should be used instead (or in addition, with configuration per tenant).  
- OAuth and token storage must follow security best practices (e.g. encrypted storage, minimal scopes).

---

### 3.7 Notifications

**Proposed:** Browser Notification API or desktop notifications.

**Recommendation:**  
- For a **browser-based dashboard**, the **Browser Notification API** is sufficient for the prototype.  
- For a **desktop application** (see below), use the **native notification APIs** (e.g. via Electron or Tauri) so that nudges are delivered even when the browser is closed and the UI is minimised.  
- Notifications must remain **calm, friendly, supportive, and not overwhelming**; throttle frequency and respect “do not disturb” or quiet hours.

---

### 3.8 Desktop packaging (background assistant experience)

**Recommendation:**  
- For a **true desktop experience** (tray icon, reliable background operation, native notifications), package the frontend and a local backend in one of the following ways:  
  - **Electron:** Mature ecosystem, larger binary size; good if the team is already familiar with it.  
  - **Tauri:** Lighter weight, lower resource use, and strong privacy posture; recommended if starting fresh and prioritising performance and user trust.  
- The **Python backend** (behaviour tracker, AI, nudge engine) can run as a **separate process** started by the desktop shell, or be bundled and invoked by it.

---

## 4. Implementation outline and deliverables

The following deliverables are proposed to demonstrate a working prototype:

1. **Project folder structure** – Clear separation of frontend, backend, services, and configuration.  
2. **Frontend React components** – Dashboard (work rhythm, habits, charts), mood journal (emotion-aware input and feedback), and notification/toast handling.  
3. **Flask (or FastAPI) backend APIs** – Health check, dashboard data, journal analysis, nudge acknowledgement, and optional SSE stream for real-time nudges.  
4. **AI integration code** – Emotion and sentiment pipelines, response templates, and fallbacks.  
5. **Work behaviour tracker** – Background service using pynput and psutil; no content logging.  
6. **Firebase (or alternative) connection** – Optional cloud persistence for profile, logs, and reports; local-only mode supported.  
7. **Notification system** – In-app toasts and optional browser/desktop notifications with throttling.  
8. **Setup and run instructions** – Documented steps for environment setup, dependencies, and running backend and frontend locally.

---

## 5. User experience design principles

The assistant should be perceived as:

*“A gentle AI companion that cares about the employee’s well-being.”*

- **Avoid** strict productivity enforcement or surveillance framing.  
- **Focus on:** emotional support, wellness awareness, and small positive nudges.  
- **Tone:** Calm, specific, and contextual; avoid guilt or “should” language.  
- **Privacy:** Local-first where possible; cloud sync and cycle-related features must be optional and transparent.

---

## 6. Project goal and success criteria

**Goal:** Deliver a **working prototype** that demonstrates an AI-powered workplace wellness assistant for women employees, running in the background and intelligently improving workday well-being.

**Success criteria for the prototype:**

- AI-driven emotion detection from journal/thought input.  
- Behaviour-based nudges (hydration, breaks, eye rest, breathing) with contextual messaging.  
- Wellness dashboard with work rhythm and habit metrics.  
- Pre-meeting calm nudge (when calendar integration is configured).  
- Smart hydration reminders triggered by behaviour.  
- Weekly wellness insights (summary and suggestions).

---

## 7. Next steps

- Review and approve this proposal with stakeholders.  
- Confirm technology choices (especially backend framework and database) against organisational standards.  
- Prioritise feature set for the first prototype (e.g. core nudges + dashboard + journal before calendar and weekly report).  
- Define a short timeline and milestones for the prototype and any follow-on production hardening.

---

*End of proposal.*
