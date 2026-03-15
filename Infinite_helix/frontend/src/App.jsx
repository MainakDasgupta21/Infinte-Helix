// Root application component
// Sets up routing, context providers, and the main layout shell

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Pages
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Reports from './pages/Reports';
import CycleMode from './pages/CycleMode';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';

// Layout
import Sidebar from './components/Common/Sidebar';
import NotificationOverlay from './components/Notifications/NotificationOverlay';

// Context
import { WellnessProvider } from './context/WellnessContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <WellnessProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-helix-bg text-helix-text font-body">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/cycle-mode" element={<CycleMode />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
            <NotificationOverlay />
          </div>
        </BrowserRouter>
      </WellnessProvider>
    </AuthProvider>
  );
}

export default App;
