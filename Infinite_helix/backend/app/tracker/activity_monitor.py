import time
import threading


class ActivityMonitor:
    """
    Monitors keyboard/mouse activity to detect work patterns.
    Uses pynput for input tracking and calculates typing intensity,
    idle periods, and continuous work duration.
    """

    def __init__(self, interval=30):
        self.interval = interval
        self._running = False
        self._keystrokes = 0
        self._mouse_moves = 0
        self._last_activity = time.time()
        self._session_start = time.time()
        self._last_break = time.time()
        self._idle_threshold = 60
        self._listeners_started = False
        self._lock = threading.Lock()

    @property
    def stats(self):
        now = time.time()
        with self._lock:
            elapsed = max(1, now - self._session_start)
            idle_seconds = now - self._last_activity
            return {
                'keystrokes_total': self._keystrokes,
                'typing_intensity': round(self._keystrokes / (elapsed / 60), 1),
                'mouse_moves': self._mouse_moves,
                'idle_seconds': round(idle_seconds, 1),
                'is_idle': idle_seconds > self._idle_threshold,
                'continuous_work_minutes': round((now - self._last_break) / 60, 1),
                'session_duration_minutes': round(elapsed / 60, 1),
            }

    def start(self):
        self._running = True
        self._start_listeners()

        while self._running:
            time.sleep(self.interval)
            stats = self.stats
            if stats['is_idle'] and stats['idle_seconds'] > 300:
                with self._lock:
                    self._last_break = time.time()

    def stop(self):
        self._running = False

    def reset(self):
        with self._lock:
            self._keystrokes = 0
            self._mouse_moves = 0
            self._session_start = time.time()
            self._last_break = time.time()

    def _start_listeners(self):
        if self._listeners_started:
            return
        try:
            from pynput import keyboard, mouse

            def on_key_press(key):
                with self._lock:
                    self._keystrokes += 1
                    self._last_activity = time.time()

            def on_mouse_move(x, y):
                with self._lock:
                    self._mouse_moves += 1
                    self._last_activity = time.time()

            kb_listener = keyboard.Listener(on_press=on_key_press)
            ms_listener = mouse.Listener(on_move=on_mouse_move)
            kb_listener.daemon = True
            ms_listener.daemon = True
            kb_listener.start()
            ms_listener.start()
            self._listeners_started = True
        except ImportError:
            pass
        except Exception:
            pass
