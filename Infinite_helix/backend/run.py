# Entry Point — Starts the Flask backend server
#
# Usage:
#   python run.py
#
# This script:
#   1. Loads environment variables from .env
#   2. Creates the Flask app via factory
#   3. Initializes AI models (emotion + sentiment)
#   4. Starts the background activity tracker
#   5. Starts the APScheduler for periodic tasks
#   6. Runs the Flask development server
#
# Production: Use gunicorn instead
#   gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"

# TODO: Implement startup sequence
# TODO: Graceful shutdown for background services
