# Infinite Helix — AI Micro Wellness Assistant

A gentle, AI-powered desktop wellness companion designed for women employees.
Runs quietly in the background, observing work behavior and providing calm,
context-aware wellness nudges — not irritating reminders.

---

## Project Structure

```
Infinite_helix/
│
├── frontend/                          # React + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   │   ├── ScreenTimeChart.jsx      # Donut chart — daily screen time
│   │   │   │   ├── FocusTimeline.jsx        # Line chart — focus intensity
│   │   │   │   ├── BreakBalance.jsx         # Progress bar — breaks taken
│   │   │   │   ├── ProductivityScore.jsx    # Gauge — daily score
│   │   │   │   ├── HydrationTracker.jsx     # Drop icons — water intake
│   │   │   │   └── NudgeFeed.jsx            # List — recent nudges
│   │   │   ├── Journal/
│   │   │   │   ├── JournalEntry.jsx         # Textarea — mood input
│   │   │   │   ├── EmotionBadge.jsx         # Badge — detected emotion
│   │   │   │   ├── AIResponse.jsx           # Card — supportive AI message
│   │   │   │   └── EntryHistory.jsx         # Timeline — past entries
│   │   │   ├── Calendar/
│   │   │   │   ├── MeetingTimeline.jsx      # List — today's meetings
│   │   │   │   └── ConfidenceBreath.jsx     # Widget — breathing exercise
│   │   │   ├── CycleMode/
│   │   │   │   ├── PhaseSelector.jsx        # Selector — cycle phase
│   │   │   │   └── EnergyIndicator.jsx      # Visual — energy level
│   │   │   ├── Reports/
│   │   │   │   ├── WorkHoursChart.jsx       # Bar chart — weekly hours
│   │   │   │   ├── StressHeatmap.jsx        # Grid — stress patterns
│   │   │   │   └── WeeklyInsight.jsx        # Card — AI weekly insight
│   │   │   ├── Notifications/
│   │   │   │   └── NotificationOverlay.jsx  # Toast — nudge display
│   │   │   ├── Settings/                    # Settings sub-components
│   │   │   └── Common/
│   │   │       └── Sidebar.jsx              # Navigation sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx                # /dashboard
│   │   │   ├── Journal.jsx                  # /journal
│   │   │   ├── Reports.jsx                  # /reports
│   │   │   ├── CycleMode.jsx               # /cycle-mode
│   │   │   ├── Calendar.jsx                 # /calendar
│   │   │   └── Settings.jsx                 # /settings
│   │   ├── context/
│   │   │   ├── WellnessContext.jsx          # Global wellness state
│   │   │   └── AuthContext.jsx              # Firebase auth state
│   │   ├── hooks/
│   │   │   ├── useEmotionAnalysis.js        # Real-time emotion hook
│   │   │   └── useWellnessPolling.js        # Backend polling hook
│   │   ├── services/
│   │   │   ├── api.js                       # Axios API client
│   │   │   ├── firebase.js                  # Firebase SDK init
│   │   │   └── notifications.js             # Browser Notification API
│   │   ├── utils/                           # Helpers & formatters
│   │   ├── assets/
│   │   │   ├── icons/
│   │   │   └── images/
│   │   └── App.jsx                          # Root component + routing
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/                           # Python Flask
│   ├── app/
│   │   ├── __init__.py                      # Flask app factory
│   │   ├── routes/
│   │   │   ├── emotion_routes.py            # POST /api/emotion/analyze
│   │   │   ├── sentiment_routes.py          # POST /api/sentiment/analyze
│   │   │   ├── journal_routes.py            # /api/journal/*
│   │   │   ├── dashboard_routes.py          # GET /api/dashboard/today
│   │   │   ├── reports_routes.py            # GET /api/reports/weekly
│   │   │   ├── tracker_routes.py            # /api/tracker/*
│   │   │   ├── nudge_routes.py              # POST /api/nudge/generate
│   │   │   ├── calendar_routes.py           # GET /api/calendar/meetings
│   │   │   ├── cycle_routes.py              # /api/cycle/*
│   │   │   ├── hydration_routes.py          # POST /api/hydration/log
│   │   │   └── user_routes.py               # /api/user/settings
│   │   ├── models/
│   │   │   ├── user.py                      # User document schema
│   │   │   ├── mood_log.py                  # MoodLog document schema
│   │   │   └── work_session.py              # WorkSession document schema
│   │   ├── services/
│   │   │   ├── firebase_service.py          # Firebase Admin SDK wrapper
│   │   │   ├── calendar_service.py          # Google Calendar API client
│   │   │   └── wellness_report_service.py   # Weekly report generator
│   │   ├── ai/
│   │   │   ├── emotion_detector.py          # HuggingFace emotion model
│   │   │   ├── sentiment_analyzer.py        # HuggingFace sentiment model
│   │   │   └── nudge_engine.py              # Context-aware nudge generator
│   │   ├── tracker/
│   │   │   ├── activity_monitor.py          # Keyboard/mouse tracker
│   │   │   └── screen_tracker.py            # Screen time & focus tracker
│   │   ├── notifications/
│   │   │   └── notification_manager.py      # Multi-channel notification dispatch
│   │   └── utils/                           # Shared helpers
│   ├── config/
│   │   └── settings.py                      # App configuration
│   ├── tests/                               # Test files
│   ├── run.py                               # Entry point
│   ├── requirements.txt                     # Python dependencies
│   └── .env.example                         # Environment template
│
└── docs/
    ├── architecture/
    │   └── ARCHITECTURE_PLAN.html           # Visual architecture blueprint
    └── screens/                             # Screen mockups
```

---

## Screens Overview

| # | Screen | Route | Purpose |
|---|--------|-------|---------|
| 1 | Daily Wellness Dashboard | `/dashboard` | At-a-glance daily metrics: screen time, focus, breaks, hydration, score |
| 2 | Mood Journal | `/journal` | Free-form journaling with real-time AI emotion & sentiment analysis |
| 3 | Weekly Report Card | `/reports` | Weekly trends, charts, stress patterns, AI-generated insight |
| 4 | Cycle Energy Mode | `/cycle-mode` | Optional cycle phase logging with energy-adapted suggestions |
| 5 | Calendar & Meeting Prep | `/calendar` | Google Calendar meetings + pre-meeting calm nudges |
| 6 | Settings & Profile | `/settings` | Notifications, privacy, calendar connection, work hours |

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/emotion/analyze` | Analyze text for emotion |
| `POST` | `/api/sentiment/analyze` | Analyze text for sentiment |
| `POST` | `/api/journal/entry` | Save mood journal entry |
| `GET` | `/api/journal/history` | Get past journal entries |
| `GET` | `/api/dashboard/today` | Daily wellness metrics |
| `GET` | `/api/reports/weekly` | Weekly wellness report |
| `POST` | `/api/tracker/activity` | Log work activity data |
| `GET` | `/api/tracker/status` | Background tracker health |
| `POST` | `/api/nudge/generate` | Generate context-aware nudge |
| `GET` | `/api/calendar/meetings` | Fetch upcoming meetings |
| `POST` | `/api/cycle/log` | Log cycle phase |
| `GET` | `/api/cycle/suggestions` | Energy-based suggestions |
| `POST` | `/api/hydration/log` | Log hydration event |
| `GET` | `/api/user/settings` | Get user preferences |
| `PUT` | `/api/user/settings` | Update user preferences |

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Tailwind CSS | Dashboard UI, Journal, Reports |
| Charts | Chart.js (react-chartjs-2) | Data visualizations |
| Backend | Python Flask, Flask-CORS | REST APIs, AI integration |
| AI — Emotion | j-hartmann/emotion-english-distilroberta-base | Detect joy, sadness, anger, fear, etc. |
| AI — Sentiment | cardiffnlp/twitter-roberta-base-sentiment | Detect positive/negative/neutral sentiment |
| AI Runtime | PyTorch, HuggingFace Transformers | Model inference |
| Tracking | psutil, pynput | Keyboard, idle, screen time tracking |
| Database | Firebase Firestore | User data, logs, reports |
| Auth | Firebase Authentication | Google sign-in |
| Calendar | Google Calendar API v3 | Meeting detection, pre-meeting nudges |
| Notifications | Browser Notification API | Gentle desktop nudges |
| Scheduler | APScheduler | Weekly reports, periodic tasks |

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- Firebase project (Firestore + Auth enabled)
- Google Cloud project (Calendar API enabled)

### 1. Clone & Navigate

```bash
cd Infinite_helix
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
copy .env.example .env
# Edit .env with your Firebase credentials, Google OAuth keys, etc.

# Place your Firebase service account JSON at:
#   backend/config/firebase-credentials.json

# Start the server
python run.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment config
copy .env.example .env
# Edit .env with your Firebase web config and backend URL

# Start development server
npm run dev
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Firestore Database** (start in test mode)
4. Enable **Authentication** → Sign-in method → Google
5. Go to Project Settings → Service accounts → Generate new private key
6. Save the JSON file as `backend/config/firebase-credentials.json`
7. Copy web app config values into `frontend/.env`

### 5. Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application)
4. Set redirect URI to `http://localhost:5000/api/calendar/callback`
5. Copy Client ID and Secret into `backend/.env`

### 6. AI Models (First Run)

On first startup, HuggingFace Transformers will automatically download:
- `j-hartmann/emotion-english-distilroberta-base` (~300MB)
- `cardiffnlp/twitter-roberta-base-sentiment` (~500MB)

Models are cached in `backend/model_cache/` for subsequent runs.

---

## Implementation Phases

### Phase 1 — Foundation
- Project scaffolding (React + Flask)
- Tailwind CSS theme setup
- Firebase connection
- Routing & layout shell
- Sidebar navigation

### Phase 2 — Core AI
- Background activity tracker (psutil + pynput)
- Emotion detection API (HuggingFace)
- Sentiment analysis API (HuggingFace)
- Nudge generation engine
- Mood journal page

### Phase 3 — Integrations
- Google Calendar API connection
- Pre-meeting calm nudges
- Cycle energy mode (optional, private)
- Smart hydration logic (behavior-based)
- Browser notification system

### Phase 4 — Polish & Reports
- Dashboard charts (Chart.js)
- Weekly wellness report card
- System tray background service
- Privacy controls & data export
- Testing & documentation

---

## Design Philosophy

> "A gentle AI companion that cares about the employee's well-being."

- **Calm over urgent** — nudges feel like suggestions, not commands
- **Context over schedule** — reminders are triggered by behavior, not timers
- **Private by default** — all personal data (especially cycle) is encrypted
- **Supportive over judgmental** — no guilt-tripping, only encouragement
- **Background over foreground** — the assistant stays out of the way
