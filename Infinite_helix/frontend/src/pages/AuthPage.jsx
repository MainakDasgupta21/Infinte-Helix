import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PASSWORD_RULES = [
  { id: 'length', test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { id: 'upper', test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { id: 'lower', test: (p) => /[a-z]/.test(p), label: 'One lowercase letter' },
  { id: 'number', test: (p) => /\d/.test(p), label: 'One number' },
  { id: 'special', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'One special character' },
];

function getStrength(password) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: 0, label: 'Very Weak', color: 'bg-red-500' };
  if (passed === 2) return { level: 1, label: 'Weak', color: 'bg-orange-500' };
  if (passed === 3) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
  if (passed === 4) return { level: 3, label: 'Strong', color: 'bg-helix-mint' };
  return { level: 4, label: 'Very Strong', color: 'bg-helix-accent' };
}

function FloatingOrb({ className }) {
  return <div className={`absolute rounded-full blur-3xl opacity-20 animate-float ${className}`} />;
}

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user, signIn, signUp, signInWithGoogle, loading, registrationInProgress } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !registrationInProgress) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate, registrationInProgress]);

  const isRegister = mode === 'register';

  function validate() {
    const errs = {};

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (isRegister && getStrength(password).level < 2) {
      errs.password = 'Password is too weak';
    }

    if (isRegister) {
      if (!displayName.trim()) errs.displayName = 'Name is required';
      if (!confirmPassword) {
        errs.confirmPassword = 'Confirm your password';
      } else if (password !== confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      if (isRegister) {
        const result = await signUp(email, password, displayName);
        if (result?.registered) {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
          setSuccessMsg('Account created. Please sign in with your email and password.');
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      const msg = err?.message || 'Something went wrong';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setServerError('Invalid email or password.');
      } else if (msg.includes('email-already-in-use')) {
        setServerError('An account with this email already exists.');
      } else if (msg.includes('too-many-requests')) {
        setServerError('Too many attempts. Please try again later.');
      } else {
        setServerError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogle() {
    setServerError('');
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setServerError(err?.message || 'Google sign-in failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setErrors({});
    setServerError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-helix-bg">
        <div className="w-10 h-10 border-2 border-helix-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const strength = getStrength(password);

  return (
    <div className="relative min-h-screen w-full bg-helix-bg flex items-center justify-center overflow-hidden font-body px-4 py-8">
      <FloatingOrb className="w-96 h-96 bg-helix-accent -top-20 -left-20" />
      <FloatingOrb className="w-80 h-80 bg-helix-pink top-1/2 -right-16" />
      <FloatingOrb className="w-64 h-64 bg-helix-sky -bottom-10 left-1/3" />

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-helix-accent to-helix-sky mb-4 glow-accent">
            <span className="text-white font-serif font-bold text-xl tracking-tight">IH</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-helix-text">Infinite Helix</h1>
          <p className="text-helix-muted text-sm mt-1">Your AI Wellness Companion</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 glow-accent">
          {/* Toggle */}
          <div className="flex bg-helix-bg/60 rounded-xl p-1 mb-8">
            <button
              type="button"
              onClick={() => mode !== 'login' && switchMode()}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                !isRegister
                  ? 'bg-gradient-to-r from-helix-accent to-helix-sky text-white shadow-lg'
                  : 'text-helix-muted hover:text-helix-text'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => mode !== 'register' && switchMode()}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isRegister
                  ? 'bg-gradient-to-r from-helix-accent to-helix-sky text-white shadow-lg'
                  : 'text-helix-muted hover:text-helix-text'
              }`}
            >
              Register
            </button>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 p-3 rounded-xl bg-helix-red/10 border border-helix-red/30 text-helix-red text-sm flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-3 rounded-xl bg-helix-mint/10 border border-helix-mint/30 text-helix-mint text-sm flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Display Name (register only) */}
            {isRegister && (
              <Field
                id="displayName"
                label="Full Name"
                type="text"
                value={displayName}
                onChange={setDisplayName}
                error={errors.displayName}
                placeholder="e.g. Ananya Sharma"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
            )}

            {/* Email */}
            <Field
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              error={errors.email}
              placeholder="you@example.com"
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            {/* Password */}
            <Field
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              error={errors.password}
              placeholder={isRegister ? 'Create a strong password' : 'Enter your password'}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-helix-muted hover:text-helix-text transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              }
            />

            {/* Strength meter (register only) */}
            {isRegister && password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i <= strength.level ? strength.color : 'bg-helix-border'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength.level < 2 ? 'text-helix-red' : strength.level < 4 ? 'text-helix-amber' : 'text-helix-mint'}`}>
                  {strength.label}
                </p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {PASSWORD_RULES.map((rule) => (
                    <li key={rule.id} className="flex items-center gap-1.5 text-xs">
                      {rule.test(password) ? (
                        <svg className="w-3.5 h-3.5 text-helix-mint shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-helix-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
                        </svg>
                      )}
                      <span className={rule.test(password) ? 'text-helix-mint' : 'text-helix-muted'}>{rule.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Confirm Password */}
            {isRegister && (
              <Field
                id="confirmPassword"
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={errors.confirmPassword}
                placeholder="Re-enter your password"
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                }
              />
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-helix-accent to-helix-sky text-white font-semibold text-sm
                         hover:shadow-lg hover:shadow-helix-accent/25 active:scale-[0.98] transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                         flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-helix-border" />
            <span className="text-xs text-helix-muted uppercase tracking-wider">or continue with</span>
            <div className="flex-1 h-px bg-helix-border" />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-helix-surface border border-helix-border hover:border-helix-border-light
                       text-helix-text font-semibold text-sm transition-all duration-200
                       hover:bg-helix-card active:scale-[0.98]
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Mode switch */}
          <p className="text-center text-sm text-helix-muted mt-6">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={switchMode} className="text-helix-accent hover:text-helix-pink font-semibold transition-colors">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-helix-muted/50 mt-6">
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}

function Field({ id, label, type, value, onChange, error, placeholder, icon, trailing }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-helix-text mb-1.5">
        {label}
      </label>
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-helix-bg/60 border transition-all duration-200 focus-within:border-helix-accent focus-within:ring-1 focus-within:ring-helix-accent/30 ${
        error ? 'border-helix-red/60' : 'border-helix-border'
      }`}>
        <span className="text-helix-muted shrink-0">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === 'password' ? (id === 'confirmPassword' ? 'new-password' : 'current-password') : id}
          className="flex-1 bg-transparent text-helix-text placeholder:text-helix-muted/50 text-sm outline-none"
        />
        {trailing && <span className="shrink-0">{trailing}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-helix-red">{error}</p>}
    </div>
  );
}
