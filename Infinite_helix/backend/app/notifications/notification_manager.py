import time
import json


class NotificationManager:
    """
    Multi-channel notification manager.
    Supports in-app notifications and can be extended for desktop/push.
    """

    def __init__(self):
        self._queue = []
        self._history = []
        self._id_counter = 0

    def send(self, nudge_type, message, priority='gentle', user_id=None):
        self._id_counter += 1
        notification = {
            'id': self._id_counter,
            'type': nudge_type,
            'message': message,
            'priority': priority,
            'user_id': user_id,
            'timestamp': time.time(),
            'read': False,
            'dismissed': False,
        }
        self._queue.append(notification)
        return notification

    def get_pending(self, user_id=None):
        return [
            n for n in self._queue
            if not n['dismissed'] and (user_id is None or n.get('user_id') == user_id)
        ]

    def dismiss(self, notification_id):
        for n in self._queue:
            if n['id'] == notification_id:
                n['dismissed'] = True
                self._history.append(n)
                return True
        return False

    def dismiss_all(self, user_id=None):
        for n in self._queue:
            if not n['dismissed'] and (user_id is None or n.get('user_id') == user_id):
                n['dismissed'] = True
                self._history.append(n)

    def get_history(self, user_id=None, limit=50):
        history = [
            n for n in self._history
            if user_id is None or n.get('user_id') == user_id
        ]
        return sorted(history, key=lambda x: x['timestamp'], reverse=True)[:limit]


notification_manager = NotificationManager()
