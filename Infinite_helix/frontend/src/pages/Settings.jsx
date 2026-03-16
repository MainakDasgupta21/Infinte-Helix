import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUser, HiOutlineBell, HiOutlineShieldCheck, HiOutlineColorSwatch } from 'react-icons/hi';

function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${enabled ? 'bg-helix-accent' : 'bg-helix-border'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SettingsSection({ icon: Icon, title, children }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-helix-accent/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-helix-accent" />
        </div>
        <h3 className="text-sm font-medium text-helix-text">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-helix-text">{label}</p>
        {description && <p className="text-xs text-helix-muted mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    desktopNotifs: true,
    soundEnabled: false,
    nudgeFrequency: 'balanced',
    hydrationGoal: 8,
    cycleModeEnabled: true,
    dataSharing: false,
    darkMode: true,
  });

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-display font-semibold text-helix-text">Settings</h1>
        <p className="text-sm text-helix-muted mt-1">Personalize your wellness experience</p>
      </div>

      <SettingsSection icon={HiOutlineUser} title="Profile">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-helix-pink to-helix-accent flex items-center justify-center text-xl font-bold text-white">
            {user?.initials}
          </div>
          <div>
            <p className="text-sm font-medium text-helix-text">{user?.displayName}</p>
            <p className="text-xs text-helix-muted">{user?.email}</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={HiOutlineBell} title="Notifications">
        <SettingRow label="Enable Notifications" description="Receive wellness nudges throughout the day">
          <ToggleSwitch enabled={settings.notifications} onChange={v => update('notifications', v)} />
        </SettingRow>
        <SettingRow label="Desktop Notifications" description="Show system-level notification popups">
          <ToggleSwitch enabled={settings.desktopNotifs} onChange={v => update('desktopNotifs', v)} />
        </SettingRow>
        <SettingRow label="Sound Effects" description="Play gentle sounds with nudges">
          <ToggleSwitch enabled={settings.soundEnabled} onChange={v => update('soundEnabled', v)} />
        </SettingRow>
        <SettingRow label="Nudge Frequency">
          <select
            value={settings.nudgeFrequency}
            onChange={e => update('nudgeFrequency', e.target.value)}
            className="bg-helix-bg border border-helix-border rounded-lg px-3 py-1.5 text-sm text-helix-text focus:outline-none focus:border-helix-accent"
          >
            <option value="minimal">Minimal</option>
            <option value="balanced">Balanced</option>
            <option value="frequent">Frequent</option>
          </select>
        </SettingRow>
      </SettingsSection>

      <SettingsSection icon={HiOutlineColorSwatch} title="Wellness Goals">
        <SettingRow label="Daily Hydration Goal" description="Number of glasses per day">
          <div className="flex items-center gap-2">
            <button onClick={() => update('hydrationGoal', Math.max(4, settings.hydrationGoal - 1))}
                    className="w-7 h-7 rounded-lg bg-helix-bg text-helix-muted hover:text-helix-text transition-colors">−</button>
            <span className="text-sm font-medium text-helix-text w-6 text-center">{settings.hydrationGoal}</span>
            <button onClick={() => update('hydrationGoal', Math.min(16, settings.hydrationGoal + 1))}
                    className="w-7 h-7 rounded-lg bg-helix-bg text-helix-muted hover:text-helix-text transition-colors">+</button>
          </div>
        </SettingRow>
        <SettingRow label="Cycle Energy Mode" description="Adjust suggestions based on menstrual cycle phase">
          <ToggleSwitch enabled={settings.cycleModeEnabled} onChange={v => update('cycleModeEnabled', v)} />
        </SettingRow>
      </SettingsSection>

      <SettingsSection icon={HiOutlineShieldCheck} title="Privacy">
        <SettingRow label="Data Sharing" description="Share anonymized wellness data for product improvement">
          <ToggleSwitch enabled={settings.dataSharing} onChange={v => update('dataSharing', v)} />
        </SettingRow>
        <div className="bg-helix-mint/5 border border-helix-mint/20 rounded-xl p-4">
          <p className="text-xs text-helix-mint font-medium mb-1">Your Data is Safe</p>
          <p className="text-xs text-helix-muted leading-relaxed">
            All emotion analysis is processed locally. Cycle data never leaves your device.
            We use Firebase only for preferences sync — no wellness data is transmitted.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
}
