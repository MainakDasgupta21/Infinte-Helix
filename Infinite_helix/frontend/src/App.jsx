import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Dashboard from './pages/Dashboard';
// Journal removed — stress detection is now automatic via Digital Body Language Tracker
import Todos from './pages/Todos';
import Reports from './pages/Reports';
import CycleMode from './pages/CycleMode';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';

import Sidebar from './components/Common/Sidebar';
import NotificationOverlay from './components/Notifications/NotificationOverlay';
import ChatBot from './components/ChatBot/ChatBot';
import StressInterventionToast from './components/Common/StressInterventionToast';
import BreakReminderToast from './components/Common/BreakReminderToast';
import useStressDetector from './hooks/useStressDetector';
import useBreakReminder from './hooks/useBreakReminder';

import { WellnessProvider } from './context/WellnessContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageContextProvider } from './context/PageContext';

/* ── Scroll to top on every route change ── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
}

/* ── Error Boundary ── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[Helix] Component crash:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-8">
          <div className="text-center max-w-md bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
            <div className="text-4xl mb-4">
              <span role="img" aria-label="warning">{'\u26A0\uFE0F'}</span>
            </div>
            <h1 className="text-xl font-serif font-semibold text-slate-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              The app ran into an unexpected error. Don't worry {'\u2014'} your data is safe.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-600/20"
            >
              Back to Dashboard
            </button>
            {this.state.error && (
              <p className="text-xs text-slate-400 mt-4 font-mono break-all bg-slate-50 p-2 rounded-lg border border-slate-200">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ── Offline Banner ── */
function OfflineBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-2 px-4 text-sm font-semibold animate-slide-up">
      You're offline {'\u2014'} some features may not work until you reconnect.
    </div>
  );
}

/* ── 404 Page ── */
function NotFound() {
  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh] animate-slide-up">
      <div className="text-center bento-card p-8 max-w-md mx-auto">
        <div className="text-7xl font-serif font-bold text-violet-600 mb-4">404</div>
        <h1 className="text-xl font-serif font-semibold text-slate-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all shadow-md shadow-violet-600/20"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const { isStressed, metrics, dismiss, snooze, breathingCompleted } = useStressDetector();
  const { activeReminder, markDone, snoozeReminder, dismissReminder } = useBreakReminder();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 bento-card p-8">
          <div className="w-10 h-10 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 animate-pulse font-medium">Loading your wellness space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  return (
    <WellnessProvider>
      <PageContextProvider>
        <div className="flex h-screen text-slate-800 font-body">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-6 py-6 max-lg:pt-16 transition-all duration-300 bg-[#f1f0f7]" id="main-content">
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/journal" element={<Navigate to="/reports" replace />} />
              <Route path="/todos" element={<Todos />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/cycle-mode" element={<CycleMode />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <NotificationOverlay />
          <OfflineBanner />
          <ChatBot />
          <StressInterventionToast
            isStressed={isStressed}
            metrics={metrics}
            onDismiss={dismiss}
            onSnooze={snooze}
            onBreathingDone={breathingCompleted}
          />
          <BreakReminderToast
            reminder={activeReminder}
            onDone={markDone}
            onSnooze={snoozeReminder}
            onDismiss={dismissReminder}
          />
        </div>
      </PageContextProvider>
    </WellnessProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(255,255,255,0.95)',
                color: '#2a2a3a',
                border: '1px solid #e8e8f0',
                borderRadius: '14px',
                fontSize: '13px',
                padding: '12px 16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: 'white' }, style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
              error: { iconTheme: { primary: '#dc2626', secondary: 'white' }, style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
