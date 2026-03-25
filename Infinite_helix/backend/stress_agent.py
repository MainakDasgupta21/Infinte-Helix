"""
Infinite Helix — Digital Body Language Agent
Monitors system-wide keyboard patterns (NOT content) to detect stress.

Privacy: Only counts keystrokes and deletion keys. Never records what you type.

Usage:
    pip install pynput requests
    python stress_agent.py
"""

import time
import threading
import requests
from collections import deque
from pynput import keyboard

API_URL = "http://localhost:5000/api/stress/ingest"
WINDOW_SEC = 30
SEND_INTERVAL = 10

buffer_lock = threading.Lock()
key_buffer = deque()

def on_press(key):
    now = time.time()
    is_delete = key in (keyboard.Key.backspace, keyboard.Key.delete)
    with buffer_lock:
        key_buffer.append((now, is_delete))

def get_metrics():
    now = time.time()
    cutoff = now - WINDOW_SEC
    with buffer_lock:
        while key_buffer and key_buffer[0][0] < cutoff:
            key_buffer.popleft()
        total = len(key_buffer)
        backspaces = sum(1 for _, d in key_buffer if d)
    speed = round((total / WINDOW_SEC) * 60) if total > 0 else 0
    return {"keystrokes": total, "backspaces": backspaces, "speed": speed, "window_sec": WINDOW_SEC}

def sender_loop():
    while True:
        time.sleep(SEND_INTERVAL)
        metrics = get_metrics()
        try:
            requests.post(API_URL, json=metrics, timeout=3)
        except Exception:
            pass

def main():
    print("=" * 50)
    print("  Infinite Helix - Stress Detection Agent")
    print("  Tracking typing PATTERNS (not content)")
    print("  Press Ctrl+C to stop")
    print("=" * 50)

    t = threading.Thread(target=sender_loop, daemon=True)
    t.start()

    with keyboard.Listener(on_press=on_press) as listener:
        try:
            listener.join()
        except KeyboardInterrupt:
            print("\nAgent stopped.")

if __name__ == "__main__":
    main()
