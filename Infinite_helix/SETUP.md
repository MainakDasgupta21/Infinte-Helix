# Infinite Helix — Setup & Run Instructions

## Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.9
- **pip** (Python package manager)
- **Git**

## Quick Start (Demo Mode)

The prototype runs fully in demo mode without Firebase or Google Calendar credentials.

### 1. Backend Setup

```bash
cd Infinite_helix/backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install flask flask-cors transformers torch psutil pynput python-dotenv apscheduler

# Start the server
python run.py
```

The API will be available at `http://localhost:5000/api`.

**Note:** On first run, AI models will be downloaded (~500MB). The server works in demo fallback mode until models finish downloading.

### 2. Frontend Setup

```bash
cd Infinite_helix/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`.

### 3. Verify Setup

- Visit `http://localhost:3000` — you should see the Dashboard
- Visit `http://localhost:5000/api/health` — should return `{"status": "ok"}`

## Project Structure

```
Infinite_helix/
├── frontend/                     # React + Tailwind CSS
│   ├── public/index.html         # HTML template
│   ├── src/
│   │   ├── index.js              # React entry point
│   │   ├── index.css             # Tailwind base + custom styles
│   │   ├── App.jsx               # Root component with routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Daily wellness metrics
│   │   │   ├── Journal.jsx       # Emotion journal + AI analysis
│   │   │   ├── Reports.jsx       # Weekly report card
│   │   │   ├── Calendar.jsx      # Meeting timeline + breathing
│   │   │   ├── CycleMode.jsx     # Cycle energy mode
│   │   │   └── Settings.jsx      # User preferences
│   │   ├── components/
│   │   │   ├── Dashboard/        # ProductivityScore, ScreenTimeChart, etc.
│   │   │   ├── Journal/          # JournalEntry, EmotionBadge, AIResponse
│   │   │   ├── Reports/          # WorkHoursChart, StressHeatmap, WeeklyInsight
│   │   │   ├── Calendar/         # MeetingTimeline, ConfidenceBreath
│   │   │   ├── CycleMode/        # PhaseSelector, EnergyIndicator
│   │   │   ├── Notifications/    # NotificationOverlay
│   │   │   └── Common/           # Sidebar
│   │   ├── context/              # AuthContext, WellnessContext
│   │   ├── hooks/                # useEmotionAnalysis, useWellnessPolling
│   │   └── services/             # api.js, firebase.js, notifications.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                      # Python Flask
│   ├── run.py                    # Entry point
│   ├── config/settings.py        # Environment config
│   ├── app/
│   │   ├── __init__.py           # Flask factory
│   │   ├── routes/               # API blueprints (11 modules)
│   │   ├── ai/
│   │   │   ├── emotion_detector.py    # HuggingFace emotion model
│   │   │   ├── sentiment_analyzer.py  # HuggingFace sentiment model
│   │   │   └── nudge_engine.py        # Context-aware nudge generator
│   │   ├── tracker/
│   │   │   ├── activity_monitor.py    # Keyboard/mouse tracking
│   │   │   └── screen_tracker.py      # Screen time via psutil
│   │   ├── services/
│   │   │   ├── firebase_service.py    # Firestore CRUD
│   │   │   ├── calendar_service.py    # Google Calendar
│   │   │   └── wellness_report_service.py
│   │   ├── models/               # Firestore schemas
│   │   └── notifications/        # NotificationManager
│   └── requirements.txt
│
└── SETUP.md                      # This file
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/emotion/analyze` | POST | Emotion detection (HuggingFace) |
| `/api/sentiment/analyze` | POST | Sentiment analysis + reframing |
| `/api/dashboard/today` | GET | Today's wellness metrics |
| `/api/journal` | GET/POST | Journal CRUD |
| `/api/reports/weekly` | GET | Weekly report card |
| `/api/tracker/status` | GET | Activity tracker status |
| `/api/nudge/generate` | POST | Generate wellness nudge |
| `/api/nudge/pending` | GET | Get pending nudges |
| `/api/calendar/meetings` | GET | Today's meetings |
| `/api/cycle/suggestions/:phase` | GET | Cycle-based suggestions |
| `/api/hydration/log` | POST | Log water intake |
| `/api/hydration/today` | GET | Today's hydration stats |

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3.4, Chart.js 4 |
| Backend | Python Flask 3, Flask-CORS |
| AI Models | HuggingFace Transformers (emotion + sentiment) |
| Behavior Tracking | psutil, pynput |
| Database | Firebase Firestore (with in-memory fallback) |
| Calendar | Google Calendar API |
| Notifications | Browser Notification API |

## Optional: Full Setup with Firebase & Google Calendar

1. Create a Firebase project and download `firebase-credentials.json`
2. Place it at `backend/config/firebase-credentials.json`
3. Update `backend/.env` with your Firebase config
4. Update `frontend/.env` with your Firebase web config
5. Set up Google Calendar OAuth in Google Cloud Console
6. Add client ID and secret to `backend/.env`
