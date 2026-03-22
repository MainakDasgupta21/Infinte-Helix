import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Reports from './pages/Reports';
import CycleMode from './pages/CycleMode';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';

import Sidebar from './components/Common/Sidebar';
import NotificationOverlay from './components/Notifications/NotificationOverlay';
import ChatBot from './components/ChatBot/ChatBot';

import { WellnessProvider } from './context/WellnessContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
        <div className="h-screen w-full flex items-center justify-center bg-helix-bg p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">
              <span role="img" aria-label="warning">{'\u26A0\uFE0F'}</span>
            </div>
            <h1 className="text-xl font-display font-semibold text-helix-text mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-helix-muted mb-6 leading-relaxed">
              The app ran into an unexpected error. Don't worry {'\u2014'} your data is safe.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              className="px-6 py-2.5 rounded-xl bg-helix-accent text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              Back to Dashboard
            </button>
            {this.state.error && (
              <p className="text-xs text-helix-muted/50 mt-4 font-mono break-all">
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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-helix-red/90 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-medium animate-slide-up">
      You're offline {'\u2014'} some features may not work until you reconnect.
    </div>
  );
}

/* ── 404 Page ── */
function NotFound() {
  return (
    <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh] animate-slide-up">
      <div className="text-center">
        <div className="text-7xl font-display font-bold gradient-text mb-4">404</div>
        <h1 className="text-xl font-display font-semibold text-helix-text mb-2">
          Page not found
        </h1>
        <p className="text-sm text-helix-muted mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-helix-accent text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-helix-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-helix-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-helix-muted animate-pulse">Loading your wellness space...</p>
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
      <div className="flex h-screen bg-helix-bg text-helix-text font-body">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 max-lg:pt-16 transition-all duration-300" id="main-content">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
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
      </div>
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
                background: '#121218',
                color: '#f0f0f3',
                border: '1px solid #26262f',
                borderRadius: '14px',
                fontSize: '13px',
                padding: '12px 16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: '#3db89a', secondary: '#121218' } },
              error: { iconTheme: { primary: '#e07070', secondary: '#121218' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
