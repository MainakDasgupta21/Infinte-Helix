import os
import sys
import threading
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from config.settings import Config


def start_background_tracker(app):
    """Start the activity monitor in a background thread."""
    try:
        from app.tracker.activity_monitor import ActivityMonitor
        monitor = ActivityMonitor(interval=Config.TRACKER_INTERVAL_SECONDS)
        tracker_thread = threading.Thread(target=monitor.start, daemon=True)
        tracker_thread.start()
        app.logger.info(f'Activity tracker started (interval: {Config.TRACKER_INTERVAL_SECONDS}s)')
    except Exception as e:
        app.logger.warning(f'Activity tracker not started: {e}')


def main():
    app = create_app()

    start_background_tracker(app)

    port = Config.FLASK_PORT
    debug = Config.FLASK_DEBUG
    app.logger.info(f'Infinite Helix API starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)


if __name__ == '__main__':
    main()
