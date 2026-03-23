# Infinite Helix — Deep Codebase Analysis

> **Prepared by:** Senior Software Architect / Code Reviewer
> **Date:** March 23, 2026
> **Scope:** Full project — frontend, backend, AI, integrations, data layer

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Codebase Breakdown](#3-codebase-breakdown)
4. [Data Flow](#4-data-flow)
5. [Core Logic](#5-core-logic)
6. [Dependencies & Integrations](#6-dependencies--integrations)
7. [Strengths & Weaknesses](#7-strengths--weaknesses)
8. [Recommendations](#8-recommendations)

---

## 1. Project Overview

### 1.1 Purpose

**Infinite Helix** is an AI-powered micro-wellness and productivity assistant designed specifically for women employees. It runs as a desktop web application (React SPA + Flask API) that operates alongside a user's workday, monitoring work behavior and proactively delivering contextual wellness nudges.

The product addresses a gap in workplace wellness tools: most existing solutions are gender-neutral and ignore the physiological, emotional, and social realities that women employees face — such as menstrual cycle impacts on energy, the need for private care reminders, and emotional support that feels human rather than corporate.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| **Proactive wellness** | Detect fatigue, dehydration, eye strain, and long work stretches — then nudge the user with empathetic, witty reminders |
| **Emotion awareness** | Analyze journal entries and text input using AI to detect emotions (7 classes) and sentiment, offering supportive reframing for negative states |
| **Cycle-aware intelligence** | Optionally track menstrual phases and adjust nudge tone, energy suggestions, and nutrition tips based on the user's current phase |
| **Pre-meeting calm** | Detect upcoming meetings via Microsoft Teams / Google Calendar and offer breathing exercises and confidence routines beforehand |
| **Quantified wellness** | Provide dashboards, weekly reports, stress heatmaps, emotion distribution charts, and wellness scorecards — turning subjective wellbeing into actionable data |
| **Safe AI companion** | An always-available chatbot ("Helix") that acts as a warm, empathetic friend — handling emotional support, workplace guidance, and wellness coaching with strict safety boundaries |

### 1.3 Features

| Feature | Status | Description |
|---------|--------|-------------|
| Work Behavior Tracking | Implemented | Keyboard/mouse activity monitoring via `pynput` + `psutil`. Detects idle periods, continuous work, and typing intensity |
| Context-Aware Nudges | Implemented | Rule-based engine evaluates work context (continuous work, hydration, time of day, emotion) and generates appropriate nudge types with witty messages |
| Emotion & Sentiment AI | Implemented | HuggingFace Transformers (DistilRoBERTa for emotion, RoBERTa for sentiment) with demo-mode keyword fallback |
| AI Chatbot (Helix) | Implemented | Groq LLM-powered (Llama 3.3 70B) context-aware companion with template fallback, intent classification, voice input, and page-aware quick replies |
| Emotion Journal | Implemented | Write journal entries, get instant AI emotion/sentiment analysis with confidence scores and supportive reframing |
| Cycle Energy Mode | Implemented | Menstrual phase tracking with mood/flow/symptom logging, phase-specific guidance, period calendar, and energy indicators |
| Calendar Integration | Implemented | Microsoft Teams OAuth 2.0 integration for real meeting data; demo fallback with realistic mock meetings |
| Dashboard | Implemented | Real-time wellness score, hydration tracker, break balance, screen time charts, focus timeline, self-care tracker, nudge feed, today's tasks |
| Weekly Reports | Implemented | Comprehensive reports with wellness scorecard, emotion charts, stress heatmap, work hours breakdown, self-care metrics, insights, and affirmations |
| Hydration Tracking | Implemented | Log water intake with running daily totals and goal progress |
| Self-Care Tracking | Implemented | Track stretch breaks and eye rest sessions with goal compliance |
| Todo/Reminders | Implemented | Personal task management with completion toggling and reminders |
| Multi-Channel Notifications | Implemented | Desktop toasts (plyer), browser Web Notifications API, and in-app notification overlay |
| Firebase Auth | Implemented | Email/password and Google OAuth 2.0 sign-in |
| Private Care Tracker | Implemented | Discreet period care logging (pad changes, freshen-up, etc.) — designed with privacy and sensitivity |
| Settings | Implemented | Configurable nudge frequency, hydration goals, eye rest intervals, meal reminders, cycle mode toggle |

### 1.4 Core Functionality Summary

The application works as a background assistant that:
1. **Monitors** keyboard, mouse, and screen activity in real-time via a daemon thread
2. **Analyzes** work patterns to detect fatigue, eye strain, and dehydration risk
3. **Generates** context-appropriate wellness nudges (hydration, stretch, eye rest, posture, emotional, wind-down, meeting prep)
4. **Provides** an AI chatbot companion that is page-aware, metric-aware, and emotionally intelligent
5. **Tracks** hydration, self-care actions, emotions, and journal entries
6. **Reports** weekly wellness with scores, trends, heatmaps, and personalized recommendations
7. **Integrates** with Microsoft Teams for real meeting data and pre-meeting calm tools
8. **Supports** optional menstrual cycle tracking with phase-aware wellness adjustments

---

## 2. System Architecture

### 2.1 High-Level Design

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                              │
│                                                                            │
│   React 18 SPA                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │  AuthProvider ─── WellnessProvider ─── PageContextProvider           │ │
│   │       │                  │                    │                       │ │
│   │  ┌────┴───┐    ┌────────┴────────┐    ┌─────┴──────┐               │ │
│   │  │Firebase │    │ Dashboard Poller│    │ Cross-Page  │               │ │
│   │  │  Auth   │    │   (30s cycle)   │    │ Context Bus │               │ │
│   │  └────┬───┘    └────────┬────────┘    └─────┬──────┘               │ │
│   │       │                  │                    │                       │ │
│   │  Pages: Dashboard | Journal | Reports | CycleMode | Calendar | ...  │ │
│   │       │                  │                    │                       │ │
│   │  ChatBot (floating) ── NotificationOverlay ── Sidebar               │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                              ▲                                             │
│                              │ Axios (REST)                                │
└──────────────────────────────┼─────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────────────────┐
│                              ▼                                             │
│                        BACKEND (Flask)                                     │
│                                                                            │
│   ┌──────────────────────────────────────────────────────────────────────┐ │
│   │  Flask App Factory (CORS, Blueprints, AI Model Init)                │ │
│   │                                                                      │ │
│   │  16 API Blueprints:                                                  │ │
│   │  auth | emotion | sentiment | journal | dashboard | reports |        │ │
│   │  tracker | nudge | calendar | cycle | hydration | selfcare |         │ │
│   │  privatecare | todo | user | chatbot                                 │ │
│   │                                                                      │ │
│   │  ┌────────────────┐  ┌────────────────┐  ┌───────────────────┐     │ │
│   │  │  AI Module      │  │  Tracker Module│  │  Services          │     │ │
│   │  │  - EmotionDet.  │  │  - ActivityMon.│  │  - FirebaseService │     │ │
│   │  │  - SentimentAn. │  │  - ScreenTrack.│  │  - CalendarService │     │ │
│   │  │  - NudgeEngine  │  │                │  │  - ChatbotService  │     │ │
│   │  │  - ChatbotSvc   │  │                │  │  - WellnessReport  │     │ │
│   │  └────────────────┘  └────────────────┘  └───────────────────┘     │ │
│   └──────────────────────────────────────────────────────────────────────┘ │
│                              │                                             │
│              ┌───────────────┼────────────────┐                            │
│              ▼               ▼                ▼                            │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────────┐                 │
│   │   Firestore   │  │  In-Memory   │  │  External APIs  │                 │
│   │   (prod)      │  │  (demo mode) │  │  - Groq LLM     │                 │
│   │              │  │              │  │  - MS Graph      │                 │
│   │  Collections: │  │  Same schema │  │  - Google Cal    │                 │
│   │  - users      │  │  dict-based  │  │  - HuggingFace   │                 │
│   │  - journal_   │  │  fallback    │  │                  │                 │
│   │    entries    │  │              │  │                  │                 │
│   │  - hydration_ │  │              │  │                  │                 │
│   │    logs       │  │              │  │                  │                 │
│   │  - mood_logs  │  │              │  │                  │                 │
│   │  - selfcare_  │  │              │  │                  │                 │
│   │    logs       │  │              │  │                  │                 │
│   │  - privatecare│  │              │  │                  │                 │
│   │    _logs      │  │              │  │                  │                 │
│   │  - personal_  │  │              │  │                  │                 │
│   │    todos      │  │              │  │                  │                 │
│   │  - screen_time│  │              │  │                  │                 │
│   │    _logs      │  │              │  │                  │                 │
│   └──────────────┘  └──────────────┘  └────────────────┘                 │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Style

The project follows a **layered monolith** architecture:

- **Presentation Layer:** React SPA with component-based UI
- **API Layer:** Flask REST API with 16 Blueprint-based route modules
- **Service Layer:** Business logic in dedicated service classes
- **Data Layer:** Firebase Firestore with transparent in-memory fallback

### 2.3 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Flask over Django** | Lightweight, fast prototyping for hackathon scope; no ORM needed with Firestore |
| **Firebase Firestore over SQL** | Schema-flexible NoSQL suits the varied document shapes (journals, mood logs, hydration logs); no migrations needed |
| **In-memory fallback** | Enables zero-config demo mode — the app runs fully without Firebase credentials |
| **Create React App** | Quick bootstrapping with Tailwind CSS integration; familiar toolchain |
| **Groq API over OpenAI** | Free tier with fast inference on Llama 3.3 70B; template fallback ensures the chatbot always works |
| **Background daemon thread** | Activity tracking runs in a `threading.Thread(daemon=True)` alongside Flask, avoiding a separate process |
| **Context-aware chatbot** | The chatbot receives real-time page context, wellness metrics, and page-specific data via `PageContext` — making responses relevant to what the user is currently viewing |
| **Polling over WebSockets** | Dashboard polls every 30s via HTTP; simpler to implement and sufficient for the update frequency needed |

### 2.4 Design Patterns Used

| Pattern | Where Used |
|---------|------------|
| **Factory Pattern** | `create_app()` in `app/__init__.py` — Flask application factory |
| **Service Layer** | `firebase_service.py`, `chatbot_service.py`, `calendar_service.py`, `wellness_report_service.py` encapsulate business logic |
| **Strategy Pattern** | AI models use strategy: real HuggingFace models in production, `_DemoEmotionDetector` / `_DemoSentimentAnalyzer` mocks in demo mode |
| **Observer/Polling** | `WellnessContext` polls the dashboard API every 30s; nudge generator runs every 2 minutes |
| **Blueprint Pattern** | Flask Blueprints for modular route organization (16 blueprints) |
| **Context Pattern** | React Context API for cross-cutting concerns: `AuthContext`, `WellnessContext`, `PageContext` |
| **Singleton** | `chatbot_service = ChatbotService()` at module level; `calendar_service` instantiated once |
| **Template Method** | `ChatbotService._generate_template_response()` uses a chain of handlers: distress → hydration → cycle → page-aware → generic fallback |
| **Repository Pattern** | `firebase_service.py` acts as a data repository, abstracting Firestore vs in-memory storage |

---

## 3. Codebase Breakdown

### 3.1 Folder Structure

```
Infinite_helix/
├── backend/                          # Python Flask REST API
│   ├── run.py                        # Entry point — starts Flask + activity tracker
│   ├── setup_demo.py                 # One-command demo setup script
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment variable template
│   ├── config/
│   │   └── settings.py               # Centralized Config class (env-based)
│   ├── app/
│   │   ├── __init__.py               # App factory, CORS, blueprint registration, AI init
│   │   ├── ai/
│   │   │   ├── emotion_detector.py   # HuggingFace emotion classification (7 classes)
│   │   │   ├── sentiment_analyzer.py # HuggingFace sentiment analysis (pos/neg/neutral)
│   │   │   └── nudge_engine.py       # Context-aware nudge generation with templates
│   │   ├── tracker/
│   │   │   ├── activity_monitor.py   # Keyboard/mouse tracking via pynput
│   │   │   └── screen_tracker.py     # Screen time aggregation (psutil-based)
│   │   ├── notifications/
│   │   │   └── notification_manager.py # Desktop notifications via plyer
│   │   ├── models/
│   │   │   ├── user.py               # User schema/factory helpers
│   │   │   ├── mood_log.py           # Mood log schema
│   │   │   └── work_session.py       # Work session schema
│   │   ├── routes/                   # 16 Flask Blueprints
│   │   │   ├── auth_routes.py        # Registration, profile sync, auth middleware
│   │   │   ├── chatbot_routes.py     # AI chatbot message handling
│   │   │   ├── dashboard_routes.py   # Today's metrics aggregation
│   │   │   ├── journal_routes.py     # CRUD for journal entries + AI analysis
│   │   │   ├── emotion_routes.py     # Standalone emotion detection endpoint
│   │   │   ├── sentiment_routes.py   # Standalone sentiment analysis endpoint
│   │   │   ├── reports_routes.py     # Weekly wellness report generation
│   │   │   ├── tracker_routes.py     # Activity tracker status/control
│   │   │   ├── nudge_routes.py       # Nudge generation + pending queue
│   │   │   ├── calendar_routes.py    # Microsoft Teams calendar OAuth + meetings
│   │   │   ├── cycle_routes.py       # Menstrual cycle phase suggestions
│   │   │   ├── hydration_routes.py   # Water intake logging
│   │   │   ├── selfcare_routes.py    # Stretch/eye-rest logging
│   │   │   ├── privatecare_routes.py # Private care logging (period care)
│   │   │   ├── todo_routes.py        # Personal tasks CRUD
│   │   │   └── user_routes.py        # User profile management
│   │   └── services/
│   │       ├── firebase_service.py   # Firestore CRUD + in-memory fallback (627 lines)
│   │       ├── chatbot_service.py    # AI chatbot with Groq LLM + templates (1017 lines)
│   │       ├── calendar_service.py   # MS Graph calendar integration
│   │       └── wellness_report_service.py # Weekly report computation
│   └── tests/
│       └── .gitkeep                  # Test directory (empty — tests not yet written)
│
├── frontend/                         # React 18 SPA
│   ├── package.json                  # NPM dependencies
│   ├── tailwind.config.js            # Custom Helix dark theme
│   ├── postcss.config.js             # PostCSS + Tailwind + Autoprefixer
│   ├── .env.example                  # Frontend environment template
│   ├── public/
│   │   └── index.html                # SPA shell with Google Fonts
│   └── src/
│       ├── index.js                  # React entry point
│       ├── index.css                 # Tailwind directives + custom animations
│       ├── App.jsx                   # Root: routing, providers, error boundary
│       ├── pages/
│       │   ├── AuthPage.jsx          # Login/register with Firebase Auth
│       │   ├── Dashboard.jsx         # Main dashboard with 8 widget components
│       │   ├── Journal.jsx           # Emotion journal with AI analysis
│       │   ├── Reports.jsx           # Weekly wellness reports
│       │   ├── CycleMode.jsx         # Menstrual cycle tracking
│       │   ├── Calendar.jsx          # Meetings + pre-meeting calm tools
│       │   └── Settings.jsx          # Preferences configuration
│       ├── components/
│       │   ├── ChatBot/
│       │   │   └── ChatBot.jsx       # Floating AI chatbot with voice input
│       │   ├── Common/
│       │   │   └── Sidebar.jsx       # Navigation sidebar
│       │   ├── Notifications/
│       │   │   └── NotificationOverlay.jsx  # In-app notification display
│       │   ├── Dashboard/
│       │   │   ├── ProductivityScore.jsx    # Animated wellness score ring
│       │   │   ├── HydrationTracker.jsx     # Water intake with glass logging
│       │   │   ├── BreakBalance.jsx         # Break tracking widget
│       │   │   ├── ScreenTimeChart.jsx      # Chart.js screen time bar chart
│       │   │   ├── FocusTimeline.jsx        # Focus session visualization
│       │   │   ├── NudgeFeed.jsx            # Active nudge display
│       │   │   ├── SelfCareTracker.jsx      # Stretch/eye-rest progress
│       │   │   └── TodayTasks.jsx           # Todo list widget
│       │   ├── Journal/
│       │   │   ├── JournalEntry.jsx         # Entry creation form
│       │   │   ├── AIResponse.jsx           # Emotion analysis results
│       │   │   ├── EmotionBadge.jsx         # Emotion tag display
│       │   │   └── EntryHistory.jsx         # Past entries list
│       │   ├── Calendar/
│       │   │   ├── MeetingTimeline.jsx      # Meeting schedule display
│       │   │   └── ConfidenceBreath.jsx     # Pre-meeting breathing exercise
│       │   ├── Reports/
│       │   │   ├── WellnessScorecard.jsx    # Score + grade display
│       │   │   ├── EmotionChart.jsx         # Emotion distribution pie chart
│       │   │   ├── StressHeatmap.jsx        # Hour-by-day stress heatmap
│       │   │   ├── WorkHoursChart.jsx       # Focus vs break hours chart
│       │   │   ├── WeeklyInsight.jsx        # AI-generated insights
│       │   │   └── SelfCareMetrics.jsx      # Self-care compliance stats
│       │   ├── CycleMode/
│       │   │   ├── CycleWeekStrip.jsx       # Week-at-a-glance strip
│       │   │   ├── EnergyIndicator.jsx      # Energy level display
│       │   │   ├── PeriodCalendarGrid.jsx   # Period calendar view
│       │   │   ├── PeriodEntriesList.jsx    # Historical entries
│       │   │   ├── PeriodEntryModal.jsx     # Log mood/flow/symptoms
│       │   │   ├── PeriodStats.jsx          # Cycle statistics
│       │   │   └── PrivateCareTracker.jsx   # Discreet care logging
│       │   └── Settings/
│       │       └── MealReminderSettings.jsx # Meal reminder configuration
│       ├── context/
│       │   ├── AuthContext.jsx              # Firebase Auth state management
│       │   ├── WellnessContext.jsx          # Wellness metrics + polling
│       │   └── PageContext.jsx              # Cross-page data sharing for chatbot
│       ├── hooks/
│       │   ├── useEmotionAnalysis.js        # Emotion API hook
│       │   ├── usePeriodTracker.js          # Cycle tracking logic
│       │   └── useWellnessPolling.js        # Polling hook
│       ├── services/
│       │   ├── api.js                       # Axios API client with 12 service modules
│       │   ├── firebase.js                  # Firebase SDK initialization
│       │   ├── notifications.js             # Web Notifications API wrapper
│       │   ├── mealReminders.js             # Meal reminder scheduler
│       │   ├── eyeRestReminder.js           # Eye rest reminder scheduler
│       │   ├── privateCareReminder.js       # Private care reminder scheduler
│       │   └── todoReminder.js              # Todo reminder scheduler
│       └── utils/
│           └── periodMath.js                # Menstrual cycle date calculations
│
├── prototype/                        # Standalone HTML demo for hackathon
│   ├── index.html                    # Self-contained demo site
│   ├── script.js                     # Demo interactions
│   ├── style.css                     # Demo styles
│   └── docs/                         # Hackathon documentation
│
└── docs/                             # Project documentation
    ├── CHATBOT_TEST_SUITE.md         # Chatbot testing scenarios
    └── architecture/
        └── ARCHITECTURE_PLAN.html    # Architecture diagram
```

### 3.2 Key Files and Their Responsibilities

#### Backend — Entry Points

| File | Lines | Responsibility |
|------|-------|----------------|
| `run.py` | 43 | Application entry point. Loads env vars, creates Flask app via factory, starts the `ActivityMonitor` in a daemon thread, and runs the Flask development server |
| `setup_demo.py` | 154 | One-command setup script: creates `.env` file, installs minimal Python dependencies, verifies Flask can start. Designed for zero-friction demo onboarding |
| `config/settings.py` | 36 | Centralized `Config` class that loads all environment variables with sensible defaults. Covers Flask, Firebase, Google/Microsoft OAuth, AI models, and tracker settings |

#### Backend — Application Core

| File | Lines | Responsibility |
|------|-------|----------------|
| `app/__init__.py` | 185 | Flask application factory. Configures CORS, registers 16 blueprints, initializes Firebase, loads AI models (real or demo mock). Contains `_DemoEmotionDetector` and `_DemoSentimentAnalyzer` — keyword-based fallbacks that simulate real model behavior without downloading 500MB+ transformers models |

#### Backend — Services (Business Logic)

| File | Lines | Responsibility |
|------|-------|----------------|
| `firebase_service.py` | 627 | **The data layer.** Provides CRUD operations for all 8 Firestore collections with transparent in-memory fallback. Functions: `save_journal_entry`, `get_journal_entries`, `log_hydration`, `get_hydration_today`, `save_mood_log`, `log_selfcare_action`, `log_privatecare`, `save_todo`, `toggle_todo`, `delete_todo`, `get_activity_streak`, and period-query helpers for reports |
| `chatbot_service.py` | 1017 | **The largest and most complex file.** Contains the full chatbot system: `SYSTEM_PROMPT` (87 lines of carefully crafted persona and safety guidelines), `INTENT_PATTERNS` (regex-based intent classification for 17 intents), `FALLBACK_TEMPLATES` (curated response templates for each intent), `GroqClient` (direct REST API calls to Groq's Llama 3.3 70B), `ChatbotService` (message processing, conversation history, context building, page-aware responses, template fallback chain) |
| `calendar_service.py` | 314 | Microsoft Graph API integration. Handles OAuth 2.0 authorization code flow, token refresh, meeting fetching via `calendarView` endpoint, Teams join URL extraction. Includes `DEMO_MEETINGS` for offline demo |
| `wellness_report_service.py` | 456 | Generates comprehensive weekly reports from real Firestore data. Computes daily wellness scores, emotion distribution, mood trends, stress heatmaps, hydration analysis, work hour breakdowns, insights, recommendations, and personalized affirmations |

#### Backend — AI Module

| File | Lines | Responsibility |
|------|-------|----------------|
| `emotion_detector.py` | ~60 | Loads `j-hartmann/emotion-english-distilroberta-base` from HuggingFace Transformers. Classifies text into 7 emotions: anger, disgust, fear, joy, neutral, sadness, surprise |
| `sentiment_analyzer.py` | ~70 | Loads `cardiffnlp/twitter-roberta-base-sentiment` from HuggingFace. Returns positive/negative/neutral sentiment with confidence scores and supportive reframing for negative sentiments |
| `nudge_engine.py` | 177 | Context-aware nudge generator. Evaluates work behavior context (continuous work minutes, typing intensity, hydration, time of day, upcoming meetings, detected emotions) and selects from 9 nudge types. Each type has 3-8 witty, personality-driven message templates |

#### Backend — Tracker Module

| File | Lines | Responsibility |
|------|-------|----------------|
| `activity_monitor.py` | 88 | Core work behavior tracking. Uses `pynput` to listen for keyboard and mouse events in daemon threads. Computes: `keystrokes_total`, `typing_intensity` (keystrokes/minute), `mouse_moves`, `idle_seconds`, `is_idle`, `continuous_work_minutes`, `session_duration_minutes`. Auto-detects breaks when idle > 5 minutes |
| `screen_tracker.py` | ~80 | Aggregates screen time using `psutil` process monitoring. Generates daily snapshots with category breakdown (coding, meetings, browsing, email) for storage and reporting |

#### Frontend — Core Files

| File | Lines | Responsibility |
|------|-------|----------------|
| `App.jsx` | 209 | Root component. Implements: `ErrorBoundary` (class component for crash recovery), `OfflineBanner` (offline detection), `ScrollToTop` (route change handler), `NotFound` (404 page), `AppRoutes` (auth-gated routing with provider nesting). Provider hierarchy: `ErrorBoundary` → `AuthProvider` → `BrowserRouter` → `WellnessProvider` → `PageContextProvider` |
| `api.js` | 115 | Axios-based API client. Creates a configured instance with base URL, 15s timeout, and error interceptor. Exports 12 API service objects: `authAPI`, `emotionAPI`, `sentimentAPI`, `dashboardAPI`, `journalAPI`, `reportsAPI`, `trackerAPI`, `nudgeAPI`, `calendarAPI`, `chatAPI`, `cycleAPI`, `hydrationAPI`, `selfCareAPI`, `todoAPI`, `privateCareAPI` |

#### Frontend — Context Providers

| File | Lines | Responsibility |
|------|-------|----------------|
| `AuthContext.jsx` | 129 | Manages Firebase Authentication state. Provides: `user` (mapped Firebase user with initials), `signIn`, `signUp`, `signInWithGoogle`, `signOut`. Handles registration flow (sign up → sync to backend → sign out for redirect to login). Auto-syncs profile to backend on auth state change |
| `WellnessContext.jsx` | 209 | **The real-time wellness engine.** Polls `/api/dashboard/today` every 30 seconds. Manages: `todayMetrics` (screen time, focus sessions, breaks, hydration, self-care, wellness score, mood, streak), `screenHistory`, `nudges`, `trackerStatus`. Provides: `addHydration`, `logSelfCare`, `dismissNudge`, `generateNudge`. Also starts background schedulers for meal, eye rest, and private care reminders. Generates nudges every 2 minutes based on current activity context |
| `PageContext.jsx` | 27 | Lightweight cross-page data bus. Each page registers its visible data (via `updatePageContext`), which the chatbot reads to provide context-aware responses. Uses `useRef` to avoid unnecessary re-renders |

#### Frontend — Key Components

| Component | Responsibility |
|-----------|----------------|
| `ChatBot.jsx` (413 lines) | Floating chatbot widget. Features: message history, typing indicator, quick replies, voice input via `SpeechRecognition` API, unread count badge, page context building, markdown-like formatting (`**bold**`, `*italic*`). Builds rich page context including current page, wellness metrics, and page-specific data for every message sent |
| `Sidebar.jsx` | Navigation sidebar with route links, user avatar, and responsive mobile menu |
| `NotificationOverlay.jsx` | Renders in-app notification toasts for wellness nudges |
| `ProductivityScore.jsx` | Animated circular progress ring showing the wellness score (0-100) |
| `HydrationTracker.jsx` | Water intake widget with glass-logging button and progress bar |
| `StressHeatmap.jsx` | Color-coded hour-by-day grid showing stress intensity patterns |

### 3.3 Reusable Components and Services

#### Reusable Frontend Services

| Service | Reuse Pattern |
|---------|---------------|
| `api.js` | All 12 API modules share a single configured Axios instance with consistent error handling |
| `notifications.js` | Wraps the Web Notifications API; used by `WellnessContext`, meal reminders, and eye rest reminders |
| `mealReminders.js` | Self-contained scheduler with configurable intervals; started once by `WellnessContext` |
| `eyeRestReminder.js` | 20-20-20 rule reminder scheduler; integrates with both browser and desktop notifications |
| `privateCareReminder.js` | Discreet period care reminders; respects user's cycle mode toggle |

#### Reusable Backend Services

| Service | Reuse Pattern |
|---------|---------------|
| `firebase_service.py` | Used by every route module for data persistence. The Firestore/in-memory dual-mode pattern is consistent across all 8 collection types |
| `NudgeEngine` | Used by both the nudge routes (on-demand) and the background tracker (automatic) |
| `ChatbotService` | Singleton instance shared across all chatbot route handlers |
| `CalendarService` | Singleton used by calendar routes; also queried by the nudge engine for pre-meeting nudges |

---

## 4. Data Flow

### 4.1 Request-Response Flow

```
User Action (e.g., "Log Water")
       │
       ▼
React Component (HydrationTracker)
       │
       ├─ Optimistic UI update (setState)
       │
       ▼
api.js → hydrationAPI.log(250, userId)
       │
       ▼
Axios POST /api/hydration/log
       │
       ▼
Flask Blueprint (hydration_routes.py)
       │
       ▼
firebase_service.log_hydration(user_id, 250)
       │
       ├─ Firestore? → db.collection('hydration_logs').add(doc)
       │
       └─ In-memory? → _in_memory_store['hydration_logs'].append(doc)
       │
       ▼
JSON Response → { ml_today, entries }
       │
       ▼
WellnessContext.addHydration()
       │
       ├─ Updates todayMetrics.hydration.ml_today
       │
       └─ toast.success("+250ml logged")
```

### 4.2 Real-Time Dashboard Polling

```
WellnessContext (useEffect on mount)
       │
       ├─ Immediate: fetchDashboard()
       │
       └─ setInterval(fetchDashboard, 30000)  ← every 30 seconds
              │
              ▼
       GET /api/dashboard/today
              │
              ▼
       dashboard_routes.py → aggregates:
              │
              ├─ activity_monitor.stats     (live keyboard/mouse data)
              ├─ screen_tracker.snapshot     (live screen time)
              ├─ get_hydration_today()       (Firestore/memory)
              ├─ get_selfcare_today()        (Firestore/memory)
              ├─ get_activity_streak()       (computed from history)
              └─ nudge_engine.generate()     (context-based nudge check)
              │
              ▼
       Returns composite JSON → todayMetrics state update
```

### 4.3 Chatbot Context-Aware Flow

```
User types message in ChatBot
       │
       ▼
ChatBot.sendMessage()
       │
       ├─ buildPageContext()  ← reads from WellnessContext + PageContext
       │    │
       │    ├─ current_page: "dashboard"
       │    ├─ wellness_metrics: { score: 72, hydration_ml: 1500, ... }
       │    ├─ page_data: { typing_activity: "active", ... }
       │    └─ other_pages_data: { journal: { entry_count: 5, ... }, ... }
       │
       ▼
POST /api/chat/message { message, user_id, page_context }
       │
       ▼
chatbot_routes.py → chatbot_service.process_message()
       │
       ├─ 1. Classify intent (regex patterns → 17 intent types)
       ├─ 2. Save to conversation history
       ├─ 3. Update user context (last_intent, message_count)
       │
       ├─ If Groq API available:
       │    │
       │    ├─ Build context prefix from page_context (wellness data, page data)
       │    ├─ Send conversation history + system prompt + context to Groq
       │    ├─ Llama 3.3 70B generates response
       │    ├─ _prepend_factual_data() ensures exact metrics are included
       │    └─ Return response with page-aware quick replies
       │
       └─ If Groq not available (template fallback):
            │
            ├─ Check distress → crisis resources
            ├─ Check hydration → personalized hydration message
            ├─ Check cycle → phase-specific guidance
            ├─ Try page-aware template (dashboard/journal/reports/etc.)
            └─ Fall back to generic intent template
```

### 4.4 State Management

The frontend uses **React Context API** for state management (no Redux/Zustand):

| Context | Scope | State Shape |
|---------|-------|-------------|
| `AuthContext` | Global (wraps entire app) | `{ user, loading, registrationInProgress }` |
| `WellnessContext` | Authenticated users only | `{ todayMetrics, screenHistory, nudges, trackerStatus, dashboardLoading }` |
| `PageContext` | Authenticated users only | `{ pageData: { [pageName]: { ...data, _updatedAt } } }` — ref-based to avoid re-renders |

**Local component state** is used extensively within pages for form inputs, modals, loading states, and transient UI data.

### 4.5 API Communication

- **Protocol:** REST over HTTP (no WebSockets)
- **Client:** Axios with a shared instance (`baseURL`, 15s timeout, JSON headers)
- **Authentication:** Firebase ID tokens sent as `Authorization: Bearer <token>` headers (used in auth routes; other routes use `user_id` query parameters)
- **Error Handling:** Global Axios interceptor logs warnings; components use try/catch with toast notifications and optimistic UI patterns
- **Polling:** Dashboard metrics polled every 30s; nudges generated every 2 minutes

---

## 5. Core Logic

### 5.1 Nudge Generation Algorithm

The `NudgeEngine` evaluates a multi-factor context dictionary and applies a prioritized rule chain:

```
Input: {
  continuous_work_minutes,    // from ActivityMonitor
  typing_intensity,           // keystrokes per minute
  minutes_since_break,        // time since last detected break
  meeting_in_minutes,         // from CalendarService (None if no meeting)
  recent_emotion,             // from last emotion detection
  ml_today,                   // hydration logged today
  hour_of_day                 // current hour (0-23)
}

Priority evaluation (first match wins):
1. hour >= 20 && continuous >= 30 → 'winddown'
2. hour < 9 && continuous < 5     → 'morning'
3. 5 <= meeting_in <= 15          → 'meeting'
4. emotion in (sadness, anger, fear) → 'emotional'
5. continuous >= 90               → 'posture' (30% chance) or 'stretch'
6. continuous >= 60               → 'stretch'
7. typing > 30 && continuous >= 25 → 'eyes'
8. minutes_since_break >= 45      → 'stretch'
9. ml_today < expected_ml && continuous >= 20 → 'hydration'
10. None (no nudge needed)

Cooldown: Each nudge type has an independent cooldown timer (default 15 min).
A nudge is suppressed if the same type fired within the cooldown window.
```

### 5.2 Emotion Detection Pipeline

**Production mode (DEMO_MODE=false):**
```
Text input
    → HuggingFace pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base")
    → Returns: { emotion: "sadness", confidence: 0.72, all_emotions: [...] }
```

**Demo mode (DEMO_MODE=true):**
```
Text input
    → Lowercase
    → Keyword scan against 4 mood profiles (stress, happy, angry, fear)
    → First keyword match returns pre-defined emotion profile
    → No match → 'neutral' with 0.65 confidence
```

The demo detector is deterministic (no randomness for neutral), which avoids mislabeling generic text as joy.

### 5.3 Chatbot Intent Classification

The chatbot uses regex-based intent classification with a scoring system:

```
1. DISTRESS CHECK (highest priority):
   - If distress regex matches → immediately return 'distress'
   - Includes: suicidal ideation, self-harm, hopelessness, crisis indicators
   - This is checked FIRST to ensure crisis situations are never missed

2. MULTI-INTENT SCORING:
   - For each of 16 remaining intent patterns, count regex matches
   - Intent with highest match count wins
   - Ties resolved by pattern evaluation order

3. FALLBACK:
   - No matches → 'general' (generic helpful response)
```

Intent types: `distress`, `greeting`, `farewell`, `hydration`, `emotion`, `stress`, `cycle`, `nutrition`, `productivity`, `sleep`, `exercise`, `break`, `meeting`, `mental_health`, `workplace`, `report`, `help`, `thanks`

### 5.4 Wellness Score Computation

**Daily score** (used in reports):
```
score = min(100, hydration_component + emotion_component + journal_component + screen_component)

Where:
  hydration_component = min(25, hydration_ml / 2000 * 25)     — max 25 points
  emotion_component   = min(20, emotion_count * 7)             — max 20 points
  journal_component   = 15 if has_journal_entry else 0         — max 15 points
  screen_component    = min(40, screen_hours / 8 * 40)         — max 40 points
```

**Weighted composite score** (used for real-time dashboard):
```
score = Σ(component_value × weight)

Weights:
  focus_time:        0.25
  break_balance:     0.20
  hydration:         0.15
  mood_stability:    0.15
  screen_time:       0.10
  stretch_compliance: 0.15
```

### 5.5 Activity Streak Calculation

```
Look back 60 days from today.
For each day (starting from today, going backwards):
  - Check if ANY hydration log OR journal entry exists for that date
  - If yes → increment streak counter
  - If no → break (streak is consecutive days ending today)
```

### 5.6 Mood Trend Analysis

```
Split the reporting period in half:
  first_half_days, second_half_days

For each half, compute:
  positive_ratio = count(emotions in POSITIVE_SET) / total_emotions

Compare:
  if second_half_ratio > first_half_ratio + 0.1 → 'improving'
  if second_half_ratio < first_half_ratio - 0.1 → 'declining'
  else → 'stable'
```

### 5.7 Stress Heatmap Generation

```
Grid: 7 days × 9 hours (9 AM to 5 PM)
Initialize all cells to 1 (baseline stress)

For each mood_log and journal_entry:
  - Parse timestamp to get day_index and hour_index
  - If emotion is negative (anger, sadness, fear, etc.) → bump cell by 2
  - If emotion is neutral/positive → bump cell by 1
  - Clamp cell value to max 7

Result: 2D array where higher values = more stress at that time slot
```

### 5.8 Microsoft Teams Calendar Integration

```
OAuth 2.0 Authorization Code Flow:
  1. Frontend calls GET /api/calendar/authorize
  2. Backend generates Microsoft authorize URL with:
     - client_id, redirect_uri, scope (Calendars.Read, User.Read)
     - response_mode: query, prompt: select_account
  3. User signs in with Microsoft work account
  4. Microsoft redirects to /api/calendar/callback with auth code
  5. Backend exchanges code for access + refresh tokens
  6. Backend fetches user profile from /me endpoint
  7. Tokens stored in-memory keyed by user email

Meeting fetching:
  - Calls Microsoft Graph /me/calendarView with today's date range
  - Parses each event for: subject, start/end times, attendee count,
    Teams join URL, organizer, online meeting provider
  - Detects Teams meetings via isOnlineMeeting + onlineMeetingProvider
  - Adds computed 'status' field (completed/upcoming based on current time)
```

---

## 6. Dependencies & Integrations

### 6.1 Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `flask` | >=3.0.0 | Web framework |
| `flask-cors` | >=4.0.0 | Cross-origin resource sharing |
| `transformers` | >=4.36.0 | HuggingFace NLP models for emotion/sentiment |
| `torch` | >=2.1.0 | PyTorch backend for transformers |
| `groq` | >=1.0.0 | Groq API SDK (optional — chatbot uses direct REST instead) |
| `google-genai` | >=1.0.0 | Google AI SDK (listed but not actively used in current code) |
| `psutil` | >=5.9.0 | System process monitoring for screen tracking |
| `pynput` | >=1.7.6 | Keyboard/mouse input listeners for activity tracking |
| `plyer` | >=2.1.0 | Cross-platform desktop notifications |
| `firebase-admin` | >=6.2.0 | Firebase Firestore server-side SDK |
| `google-api-python-client` | >=2.108.0 | Google Calendar API v3 |
| `google-auth-httplib2` | >=0.1.1 | Google auth transport |
| `google-auth-oauthlib` | >=1.1.0 | Google OAuth 2.0 flow |
| `requests` | >=2.31.0 | HTTP client for Microsoft Graph API + Groq REST |
| `python-dotenv` | >=1.0.0 | Environment variable loading |
| `apscheduler` | >=3.10.4 | Task scheduling (listed but not actively used in current code) |

### 6.2 Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.2.0 | UI framework |
| `react-dom` | ^18.2.0 | React DOM renderer |
| `react-router-dom` | ^6.20.0 | Client-side routing |
| `react-scripts` | 5.0.1 | Create React App build toolchain |
| `axios` | ^1.6.0 | HTTP client |
| `chart.js` | ^4.4.0 | Chart rendering engine |
| `react-chartjs-2` | ^5.2.0 | React bindings for Chart.js |
| `firebase` | ^10.7.0 | Firebase client SDK (auth) |
| `react-icons` | ^4.12.0 | Icon library |
| `react-hot-toast` | ^2.4.1 | Toast notifications |
| `tailwindcss` | ^3.4.0 | Utility-first CSS framework (dev) |
| `autoprefixer` | ^10.4.16 | CSS vendor prefixing (dev) |
| `postcss` | ^8.4.32 | CSS processing pipeline (dev) |

### 6.3 External Service Integrations

| Service | Purpose | Auth Method |
|---------|---------|-------------|
| **Firebase Authentication** | User sign-in (email/password + Google OAuth) | Firebase SDK |
| **Firebase Firestore** | Document database for all persistent data | Service account credentials |
| **Groq API** | LLM inference (Llama 3.3 70B) for chatbot | API key (REST) |
| **Microsoft Graph API** | Teams calendar events, user profile | OAuth 2.0 authorization code |
| **Google Calendar API** | Calendar events (secondary integration) | OAuth 2.0 |
| **HuggingFace Hub** | Pre-trained NLP model download | No auth (public models) |
| **Google Fonts** | Inter + Roboto font families | CDN link |

### 6.4 Demo Mode vs Production Mode

| Aspect | Demo Mode (`DEMO_MODE=true`) | Production Mode |
|--------|------------------------------|-----------------|
| AI Models | Keyword-based mock detectors | HuggingFace Transformers (500MB+ download) |
| Database | In-memory Python dicts | Firebase Firestore |
| Calendar | Static `DEMO_MEETINGS` list | Live Microsoft Graph API |
| Chatbot | Template responses only (unless GROQ_API_KEY set) | Groq LLM + template fallback |
| Nudge Cooldown | 5 minutes | 30 minutes |
| Desktop Notifications | Enabled via plyer | Enabled via plyer |
| Setup Required | Zero-config (`python setup_demo.py`) | Firebase credentials + env vars |

---

## 7. Strengths & Weaknesses

### 7.1 Strengths

#### Architecture & Design
- **Excellent demo-mode architecture:** The dual Firestore/in-memory pattern means the app runs completely without any external services. This is a gold-standard hackathon design — judges can run it instantly.
- **Clean separation of concerns:** Routes, services, AI modules, and tracker are well-isolated. Each route blueprint handles a single domain.
- **Factory pattern:** The Flask app factory with blueprint registration is textbook clean architecture.
- **Context-aware chatbot:** The `PageContext` + `WellnessContext` pipeline that feeds real-time data to the chatbot is sophisticated and well-executed. The chatbot genuinely knows what the user is looking at.

#### Code Quality
- **Well-crafted system prompt:** The chatbot's 87-line system prompt is one of the best-designed AI companion prompts I've seen — covering personality, boundaries, safety, and context awareness.
- **Comprehensive nudge templates:** The nudge messages have real personality — they're witty, supportive, and avoid the generic "drink water" tone.
- **Safety-first distress handling:** The chatbot checks for crisis indicators BEFORE any other intent, and provides real helpline numbers (iCall, Vandrevala Foundation, AASRA).
- **Thoughtful UX:** Offline banner, error boundary with recovery, scroll-to-top on navigation, optimistic UI updates, toast notifications.
- **Privacy-conscious design:** Cycle mode is optional and toggleable; private care tracking is designed with sensitivity.

#### Frontend
- **Cohesive dark theme:** The custom Tailwind `helix` color palette creates a visually unified, modern UI. Glass-card effects, gradient text, and subtle animations show attention to design.
- **Component composition:** Dashboard uses 8 focused widget components that could be independently tested and reused.
- **12 API service modules:** The `api.js` organization with separate objects for each domain is clean and maintainable.

#### Backend
- **Report generation:** The `WellnessReportService` does impressive data aggregation — combining mood logs, journal entries, hydration, screen time, and self-care into a comprehensive weekly report with computed insights and recommendations.
- **Graceful degradation:** Every external dependency has a fallback: Firebase → in-memory, HuggingFace → keyword mock, Groq → templates, Microsoft Graph → demo meetings.
- **Activity monitoring:** The `ActivityMonitor` with thread-safe locking and daemon threads is well-implemented for the scope.

### 7.2 Weaknesses

#### Security
- **No authentication on most API routes:** Only `auth_routes.py` has a `require_auth` decorator. All other routes (journal, hydration, dashboard, reports, chatbot, etc.) accept `user_id` as a plain query parameter or request body field — meaning **any user can access any other user's data** by guessing their UID.
- **CORS wildcard:** `origins: "*"` allows any domain to call the API. This is acceptable for development but must be restricted in production.
- **Groq API `verify=False`:** The chatbot's Groq API call disables SSL verification (`verify=False`), which is a security risk.
- **In-memory token storage:** Microsoft OAuth tokens are stored in a Python dict. Server restart loses all connected calendar accounts.
- **No rate limiting:** No protection against brute-force attacks or API abuse.

#### Data Persistence
- **In-memory store is volatile:** All data is lost on server restart in demo mode. For a production deployment, this silently drops user data without warning.
- **No data validation:** Routes accept JSON bodies without schema validation (no Marshmallow, Pydantic, or similar). Malformed requests could cause unexpected behavior.
- **No database indexing strategy:** Firestore queries use client-side date filtering (`if start_date <= ts_date <= end_date`) instead of compound queries, which won't scale.

#### Testing
- **Zero tests:** The `tests/` directory contains only a `.gitkeep`. No unit tests, integration tests, or end-to-end tests exist.
- **No CI/CD pipeline:** No GitHub Actions, Docker configuration, or deployment scripts.

#### Scalability
- **Single-process architecture:** The activity tracker runs as a thread in the Flask process. This works for a single user but cannot scale to multiple users on a server.
- **In-memory conversation history:** The chatbot stores all conversations in a Python dict (`_conversations`). This doesn't persist across restarts and will consume increasing memory.
- **Polling-based updates:** 30-second polling generates 2,880 API calls per user per day. WebSockets or Server-Sent Events would be more efficient.
- **No caching:** Report generation queries Firestore on every request. Computed reports should be cached.

#### Code Issues
- **Bug in chatbot context:** `chatbot_routes.py` uses `getattr(current_app, '_activity_monitor', None)` to get the activity monitor, but the monitor is stored as `app_module.activity_monitor` (a module-level variable in `app/__init__.py`). This means the chatbot never receives live activity data.
- **Unused dependencies:** `google-genai`, `groq` (SDK), and `apscheduler` are listed in requirements.txt but not used in the current codebase.
- **Mixed date handling:** Some code uses `datetime.utcnow()` and some uses `datetime.now()`. This creates inconsistencies between UTC and local time.
- **`dangerouslySetInnerHTML` in ChatBot:** The message formatting uses `dangerouslySetInnerHTML`. While HTML is escaped first, this pattern has inherent XSS risk if the escaping is incomplete.
- **No TypeScript:** The entire frontend is plain JavaScript with no type safety.

#### Documentation
- **Root README path mismatch:** The root `README.md` references `apps/infinite-helix/` which doesn't exist — the actual path is `Infinite_helix/`.
- **No API documentation:** Beyond the table in the project README, there's no OpenAPI/Swagger spec or detailed endpoint documentation.
- **No inline documentation:** Service classes and complex functions lack docstrings explaining business rules.

---

## 8. Recommendations

### 8.1 Critical (Security & Data Integrity)

#### 1. Add Authentication Middleware to All Routes
**Problem:** Any user can access any other user's data.
**Solution:** Create a `require_auth` decorator that verifies Firebase ID tokens and extracts `user_id` from the token. Apply it to all route blueprints.

```python
# Proposed pattern
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        try:
            decoded = firebase_admin.auth.verify_id_token(token)
            request.user_id = decoded['uid']
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
```

#### 2. Enable SSL Verification on Groq API
**Fix:** Remove `verify=False` from the Groq API call. If there are proxy/certificate issues, configure the certificate bundle properly instead.

#### 3. Add Request Schema Validation
**Solution:** Use `marshmallow` or `pydantic` to validate all incoming request bodies. This prevents malformed data from corrupting the database.

#### 4. Restrict CORS Origins
**Fix:** Replace `"origins": "*"` with a whitelist of allowed origins (e.g., `["http://localhost:3000", "https://your-domain.com"]`).

### 8.2 High Priority (Reliability & Quality)

#### 5. Add a Test Suite
**Scope:**
- **Unit tests:** NudgeEngine, emotion detectors, wellness score computation, intent classification, streak calculation
- **Integration tests:** API route tests with mock Firebase
- **Frontend tests:** React Testing Library for critical components (ChatBot, Dashboard, Journal)
- **Framework:** `pytest` (backend), `Jest + React Testing Library` (frontend)

#### 6. Fix the Activity Monitor Bug in Chatbot
**Problem:** `chatbot_routes.py` looks for `current_app._activity_monitor` but the monitor is at `app_module.activity_monitor`.
**Fix:**
```python
# In chatbot_routes.py, change:
monitor = getattr(current_app, '_activity_monitor', None)
# To:
import app as app_module
monitor = getattr(app_module, 'activity_monitor', None)
```

#### 7. Standardize Date/Time Handling
**Fix:** Use `datetime.now(timezone.utc)` consistently everywhere (both backend and Firestore timestamps). Store all timestamps as UTC; convert to local time only in the frontend.

#### 8. Add TypeScript
**Benefit:** Type safety prevents a large class of runtime errors, especially with complex nested data structures like wellness metrics and report data.
**Migration path:** Start with `jsconfig.json` → add `@ts-check` to critical files → gradually rename `.jsx` → `.tsx`.

### 8.3 Medium Priority (Scalability & Performance)

#### 9. Replace Polling with WebSockets or SSE
**Benefit:** Eliminates 2,880 unnecessary API calls per user per day.
**Solution:** Use Flask-SocketIO or Server-Sent Events for real-time dashboard updates and nudge delivery.

#### 10. Add Report Caching
**Solution:** Cache generated weekly reports in Firestore (or Redis) with a 1-hour TTL. Invalidate on new data writes.

#### 11. Move Conversation History to Firestore
**Problem:** Chatbot conversations are lost on server restart.
**Solution:** Store in a `chat_conversations` Firestore collection. Load on first message; lazy-save on each exchange.

#### 12. Add Compound Indexes in Firestore
**Problem:** Period queries fetch all user documents and filter client-side.
**Solution:** Create composite indexes on `(user_id, date)` and `(user_id, timestamp)` in Firestore. Use Firestore's native range queries instead of Python loops.

#### 13. Containerize with Docker
**Solution:**
```dockerfile
# Backend
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "run.py"]

# Frontend
FROM node:20-alpine
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

Add `docker-compose.yml` for one-command startup.

### 8.4 Low Priority (Polish & Maintainability)

#### 14. Add Error Boundary Per Route
**Current:** One `ErrorBoundary` wraps the entire app. A crash in Reports takes down everything.
**Solution:** Wrap each page in its own `ErrorBoundary` to isolate failures.

#### 15. Implement Proper Logging
**Solution:** Replace `print()` and `console.warn()` with structured logging (Python `logging` with JSON format; frontend with a logger utility). Add request IDs for tracing.

#### 16. Add OpenAPI/Swagger Documentation
**Solution:** Use `flask-restx` or `flasgger` to auto-generate API documentation from route decorators.

#### 17. Remove Unused Dependencies
Remove from `requirements.txt`:
- `google-genai` (not imported anywhere)
- `groq` (chatbot uses direct REST via `requests`)
- `apscheduler` (not imported anywhere)

#### 18. Add Linting and Formatting
- **Backend:** `ruff` for linting + formatting (replaces flake8 + black)
- **Frontend:** `eslint` + `prettier` with consistent config
- Add pre-commit hooks for enforcement

#### 19. Refactor `chatbot_service.py` (1017 Lines)
This file is too large. Split into:
- `chatbot/prompts.py` — system prompt, templates, quick reply maps
- `chatbot/intent.py` — intent patterns and classification
- `chatbot/groq_client.py` — LLM API client
- `chatbot/context.py` — page context formatting
- `chatbot/service.py` — core message processing

#### 20. Add Environment-Specific Config
**Current:** Single `Config` class with defaults.
**Solution:** Create `DevelopmentConfig`, `ProductionConfig`, `TestingConfig` classes that inherit from `Config`.

---

## Summary

**Infinite Helix** is an impressive hackathon-born project that demonstrates strong product thinking and thoughtful engineering. The dual-mode architecture (demo/production), context-aware AI chatbot, and women-centric wellness features are standout qualities. The codebase is well-organized with clear separation of concerns, and the frontend delivers a polished, modern UI.

The primary areas for improvement are **security** (authentication on all routes), **testing** (zero test coverage), and **scalability** (polling, in-memory storage, single-process tracker). Addressing the critical security recommendations should be the immediate priority before any production deployment.

For a hackathon project, this codebase is exceptionally well-structured and feature-complete. With the recommended improvements, it could evolve into a production-ready SaaS product.

---

*Analysis performed on the full codebase including 29 backend Python files, 43 frontend JavaScript/JSX files, and all configuration and documentation files.*
