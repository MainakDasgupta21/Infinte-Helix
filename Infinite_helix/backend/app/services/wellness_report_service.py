from datetime import datetime, timedelta
from collections import Counter, defaultdict

from app.services.firebase_service import (
    get_mood_logs_for_period,
    get_journal_entries_for_period,
    get_hydration_for_period,
    get_activity_streak,
    get_screen_time_history,
    get_selfcare_for_period,
)
from app.services.settings_service import get_user_settings

DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
DEFAULT_HYDRATION_GOAL = 2000
SCREEN_GOAL_HOURS = 8
POSITIVE_EMOTIONS = {'joy', 'happy', 'surprise', 'excited', 'grateful'}
NEGATIVE_EMOTIONS = {'anger', 'sadness', 'fear', 'disgust', 'anxious', 'stressed'}


class WellnessReportService:
    """Generates weekly wellness reports from real user data stored in the DB."""

    def generate_weekly(self, user_id):
        settings = get_user_settings(user_id)
        hydration_goal = settings.get('hydration_goal_ml', DEFAULT_HYDRATION_GOAL)

        today = datetime.utcnow()
        monday = today - timedelta(days=today.weekday())
        sunday = monday + timedelta(days=6)
        end_date = min(sunday, today)

        start_str = monday.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')

        mood_logs = get_mood_logs_for_period(user_id, start_str, end_str)
        journal_entries = get_journal_entries_for_period(user_id, start_str, end_str)
        hydration_logs = get_hydration_for_period(user_id, start_str, end_str)
        streak = get_activity_streak(user_id)

        days_in_range = []
        cur = monday
        while cur <= end_date:
            days_in_range.append(cur.strftime('%Y-%m-%d'))
            cur += timedelta(days=1)
        num_days = max(len(days_in_range), 1)

        # ── Screen time (real data from tracker + Firestore) ────────────
        screen_history = self._get_screen_data(user_id, days_in_range)
        daily_screen = {h['date']: h for h in screen_history}

        # ── Hydration per day ───────────────────────────────────────────
        daily_hydration = defaultdict(int)
        for log in hydration_logs:
            day = log.get('date', log.get('timestamp', '')[:10])
            daily_hydration[day] += log.get('amount_ml', 250)

        # ── Emotions per day ────────────────────────────────────────────
        daily_emotions = defaultdict(list)
        all_emotions = []
        for log in mood_logs:
            day = log.get('timestamp', '')[:10]
            emo = log.get('emotion', 'neutral')
            daily_emotions[day].append(emo)
            all_emotions.append(emo)
        for entry in journal_entries:
            day = entry.get('timestamp', '')[:10]
            emo = entry.get('emotion', 'neutral')
            daily_emotions[day].append(emo)
            all_emotions.append(emo)

        emotion_counts = Counter(all_emotions)
        total_emo = max(len(all_emotions), 1)
        emotion_distribution = {
            e: round(c / total_emo * 100)
            for e, c in emotion_counts.most_common()
        }
        if not emotion_distribution:
            emotion_distribution = {'neutral': 100}

        # ── Hydration summary ───────────────────────────────────────────
        hydration_totals = [daily_hydration.get(d, 0) for d in days_in_range]
        total_hydration = sum(hydration_totals)
        avg_hydration = round(total_hydration / num_days)
        best_idx = (hydration_totals.index(max(hydration_totals))
                    if hydration_totals and max(hydration_totals) > 0 else 0)
        best_hydration_day = DAY_NAMES[monday.weekday() + best_idx] if hydration_totals else 'N/A'
        hydration_pct = min(100, round(avg_hydration / hydration_goal * 100)) if hydration_goal else 0

        top_emotion = emotion_counts.most_common(1)[0][0] if emotion_counts else 'neutral'
        mood_trend = self._mood_trend(daily_emotions, days_in_range)

        # ── Work hours from real screen time ────────────────────────────
        work_labels = [DAY_NAMES[monday.weekday() + i] for i in range(len(days_in_range))]
        focus_hours = []
        break_hours = []
        for day_str in days_in_range:
            scr = daily_screen.get(day_str)
            if scr:
                total_h = scr.get('total_hours', 0)
                bdown = scr.get('breakdown', {})
                coding = bdown.get('coding', 0)
                meetings = bdown.get('meetings', 0)
                foc = round(coding + meetings + total_h * 0.15, 1)
                focus_hours.append(min(foc, total_h))
                break_hours.append(round(max(0, total_h - foc) * 0.3, 1))
            else:
                focus_hours.append(0)
                break_hours.append(0)

        total_focus = round(sum(focus_hours), 1)
        total_breaks_est = sum(max(1, round(f / 1.5)) for f in focus_hours if f > 0) or 0
        avg_break_interval = round(total_focus * 60 / max(total_breaks_est, 1)) if total_breaks_est else 0

        # ── Daily wellness scores (uses screen time + hydration + journal/mood) ─
        journal_dates = {e.get('timestamp', '')[:10] for e in journal_entries}
        daily_scores = []
        for i, day_str in enumerate(days_in_range):
            day_name = DAY_NAMES[monday.weekday() + i]
            day_emos = daily_emotions.get(day_str, [])
            day_mood = day_emos[0] if day_emos else 'neutral'
            scr = daily_screen.get(day_str)
            screen_h = scr.get('total_hours', 0) if scr else 0
            dscore = self._daily_score(
                    daily_hydration.get(day_str, 0),
                    len(day_emos),
                    day_str in journal_dates,
                    screen_h,
                    hydration_goal,
                )
            daily_scores.append({'day': day_name, 'score': dscore, 'mood': day_mood})

        current_score = round(sum(d['score'] for d in daily_scores) / num_days) if daily_scores else 0
        journal_count = len(journal_entries)

        stress_heatmap = self._stress_heatmap(mood_logs, journal_entries, days_in_range, monday)

        # ── Total screen hours (used in summary) ────────────────────────
        total_screen_h = sum(
            (daily_screen.get(d, {}).get('total_hours', 0)) for d in days_in_range
        )

        # ── Self-care: real tracked data from selfcare_logs ──────────────
        selfcare_logs = get_selfcare_for_period(user_id, start_str, end_str)
        stretch_done = sum(1 for l in selfcare_logs if l.get('action') == 'stretch')
        eye_rest_done = sum(1 for l in selfcare_logs if l.get('action') == 'eye_rest')
        stretch_suggested = num_days * 25
        eye_rest_suggested = num_days * 30

        insights = self._insights(
            journal_count, avg_hydration, hydration_goal,
            top_emotion, emotion_distribution, daily_scores, streak,
            total_focus,
        )
        recommendations = self._recommendations(
            avg_hydration, hydration_goal, journal_count, num_days,
            emotion_distribution, daily_scores, total_focus,
        )

        return {
            'period': {
                'start': monday.strftime('%Y-%m-%d'),
                'end': end_date.strftime('%Y-%m-%d'),
                'label': f"{monday.strftime('%b %d')} — {end_date.strftime('%b %d, %Y')}",
            },
            'wellness_score': {
                'current': current_score,
                'previous': current_score,
                'change': 0,
                'grade': self._grade(current_score),
            },
            'summary': {
                'total_focus_hours': total_focus,
                'avg_daily_focus': round(total_focus / num_days, 1),
                'total_breaks': total_breaks_est,
                'breaks_per_day': round(total_breaks_est / num_days, 1),
                'avg_break_interval_min': avg_break_interval,
                'hydration_avg_ml': avg_hydration,
                'hydration_goal_ml': hydration_goal,
                'mood_trend': mood_trend,
                'top_emotion': top_emotion,
                'journal_entries': journal_count,
                'streak_days': streak,
                'total_screen_hours': round(total_screen_h, 1),
            },
            'daily_scores': daily_scores,
            'work_hours': {
                'labels': work_labels,
                'focus': focus_hours,
                'breaks': break_hours,
            },
            'emotion_distribution': emotion_distribution,
            'stress_heatmap': stress_heatmap,
            'self_care': {
                'hydration': {
                    'avg_ml': avg_hydration,
                    'goal_ml': hydration_goal,
                    'completion_pct': hydration_pct,
                    'best_day': best_hydration_day,
                    'total_ml': total_hydration,
                },
                'breaks': {
                    'total': total_breaks_est,
                    'avg_interval_min': avg_break_interval,
                    'ideal_interval': 90,
                    'compliance_pct': min(100, round(total_breaks_est / max(num_days * 4, 1) * 100)),
                },
                'stretches': {
                    'done': stretch_done,
                    'suggested': stretch_suggested,
                    'compliance_pct': min(100, round(stretch_done / max(stretch_suggested, 1) * 100)),
                },
                'eye_rest': {
                    'done': min(eye_rest_done, eye_rest_suggested),
                    'suggested': eye_rest_suggested,
                    'compliance_pct': min(100, round(eye_rest_done / max(eye_rest_suggested, 1) * 100)),
                },
            },
            'cycle_insights': {
                'enabled': False,
                'current_phase': 'unknown',
                'phase_scores': {},
                'tip': '',
            },
            'insights': insights,
            'recommendations': recommendations,
            'affirmation': self._affirmation(current_score, streak, journal_count),
        }

    # ------------------------------------------------------------------
    # Data helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _get_screen_data(user_id, days_in_range):
        """
        Merge Firestore history with today's live tracker snapshot so the
        report always reflects the most up-to-date numbers.
        """
        num_days = len(days_in_range)
        history = get_screen_time_history(user_id, num_days) if num_days else []

        try:
            from app.tracker.screen_tracker import screen_tracker
            today_snap = screen_tracker.get_snapshot_for_save(user_id)
            today_date = today_snap['date']
            history = [h for h in history if h.get('date') != today_date]
            history.append(today_snap)
        except Exception:
            pass

        return history

    # ------------------------------------------------------------------
    # Score helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _daily_score(hydration_ml, emotion_count, has_journal, screen_hours,
                     hydration_goal=DEFAULT_HYDRATION_GOAL):
        h = min(25, round(hydration_ml / max(hydration_goal, 1) * 25))
        e = min(20, emotion_count * 7)
        j = 15 if has_journal else 0
        s = min(40, round(screen_hours / SCREEN_GOAL_HOURS * 40))
        return min(100, max(0, h + e + j + s))

    @staticmethod
    def _grade(score):
        for threshold, g in [(90, 'A'), (85, 'A-'), (80, 'B+'), (75, 'B'),
                              (70, 'B-'), (65, 'C+'), (60, 'C'), (50, 'D')]:
            if score >= threshold:
                return g
        return 'F'

    @staticmethod
    def _mood_trend(daily_emotions, days_in_range):
        if len(days_in_range) < 2:
            return 'stable'
        mid = len(days_in_range) // 2
        first_half, second_half = days_in_range[:mid], days_in_range[mid:]

        def ratio(days):
            emos = [e for d in days for e in daily_emotions.get(d, [])]
            if not emos:
                return 0.5
            return sum(1 for e in emos if e in POSITIVE_EMOTIONS) / len(emos)

        r1, r2 = ratio(first_half), ratio(second_half)
        if r2 > r1 + 0.1:
            return 'improving'
        if r2 < r1 - 0.1:
            return 'declining'
        return 'stable'

    @staticmethod
    def _stress_heatmap(mood_logs, journal_entries, days_in_range, monday):
        hours = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM']
        hour_map = {9: 0, 10: 1, 11: 2, 12: 3, 13: 4, 14: 5, 15: 6, 16: 7, 17: 8}
        day_labels = [DAY_NAMES[monday.weekday() + i] for i in range(len(days_in_range))]
        data = [[1] * len(hours) for _ in range(len(days_in_range))]

        for log in mood_logs + journal_entries:
            ts = log.get('timestamp', '')
            if len(ts) < 13:
                continue
            try:
                dt = datetime.fromisoformat(ts)
                day_str = dt.strftime('%Y-%m-%d')
                if day_str not in days_in_range:
                    continue
                di = days_in_range.index(day_str)
                hi = hour_map.get(dt.hour)
                if hi is None:
                    continue
                emo = log.get('emotion', 'neutral')
                bump = 2 if emo in NEGATIVE_EMOTIONS else 1
                data[di][hi] = min(7, data[di][hi] + bump)
            except (ValueError, IndexError):
                pass

        return {'days': day_labels, 'hours': hours, 'data': data}

    @staticmethod
    def _insights(journal_count, avg_hydration, goal, top_emotion,
                  emotion_dist, daily_scores, streak, total_focus):
        items = []
        if total_focus > 0:
            items.append({
                'type': 'positive',
                'title': f'{total_focus}h Focus Logged',
                'detail': (f"You logged {total_focus} hours of focus time this week "
                           "based on your screen activity. That's real productivity data."),
            })
        if streak >= 3:
            items.append({
                'type': 'achievement',
                'title': f'{streak}-Day Streak',
                'detail': (f"You've been active for {streak} consecutive days. "
                           "Consistency is the foundation of wellness — keep showing up."),
            })
        if journal_count >= 3:
            items.append({
                'type': 'positive',
                'title': 'Active Journaler',
                'detail': (f"You wrote {journal_count} journal entries this week. "
                           "Regular journaling builds self-awareness and emotional clarity."),
            })
        elif journal_count == 0:
            items.append({
                'type': 'improvement',
                'title': 'Start Journaling',
                'detail': ("No journal entries this week. Even one sentence a day "
                           "can improve emotional clarity over time."),
            })
        hp = round(avg_hydration / goal * 100) if goal else 0
        if hp >= 80:
            items.append({
                'type': 'achievement',
                'title': 'Hydration Star',
                'detail': f"Averaging {avg_hydration} ml/day — {hp}% of your goal. Great self-care!",
            })
        elif hp > 0:
            items.append({
                'type': 'improvement',
                'title': 'Hydration Needs Attention',
                'detail': (f"Averaging {avg_hydration} ml/day vs {goal} ml goal ({hp}%). "
                           "Try setting regular water reminders."),
            })
        else:
            items.append({
                'type': 'improvement',
                'title': 'Track Your Hydration',
                'detail': ("No hydration data this week. Tap the water button on your "
                           "dashboard to start tracking."),
            })
        if daily_scores:
            scores = [d['score'] for d in daily_scores]
            best = daily_scores[scores.index(max(scores))]
            if best['score'] > 0:
                items.append({
                    'type': 'tip',
                    'title': f"Best Day: {best['day']}",
                    'detail': (f"Your highest score was {best['score']} on {best['day']}. "
                               "Replicate what you did differently that day."),
                })
        return items[:4]

    @staticmethod
    def _recommendations(avg_hydration, goal, journal_count, num_days,
                         emotion_dist, daily_scores, total_focus):
        recs = []
        if avg_hydration < goal * 0.6:
            recs.append({
                'category': 'Hydration',
                'tip': (f"You're averaging {avg_hydration} ml/day. Keep a water bottle visible "
                        "and log each glass — small sips throughout the day add up."),
            })
        if journal_count < num_days:
            recs.append({
                'category': 'Journaling',
                'tip': (f"You journaled {journal_count} out of {num_days} days. "
                        "Even one sentence at day's end builds emotional awareness."),
            })
        neg_pct = sum(emotion_dist.get(e, 0) for e in ['sadness', 'anger', 'fear'])
        if neg_pct > 30:
            recs.append({
                'category': 'Emotional Wellness',
                'tip': (f"{neg_pct}% of recorded emotions were negative this week. "
                        "Short mindfulness breaks or talking to someone you trust can help."),
            })
        if total_focus > num_days * 6:
            recs.append({
                'category': 'Screen Balance',
                'tip': (f"You averaged {round(total_focus / num_days, 1)}h/day of focus screen time. "
                        "Consider scheduling screen-free breaks to protect your eyes and energy."),
            })
        if daily_scores:
            low = [d for d in daily_scores if d['score'] < 30]
            if low:
                recs.append({
                    'category': 'Self-Care Routine',
                    'tip': (f"{len(low)} day(s) had low wellness scores. A simple morning "
                            "routine (hydrate, stretch, set intentions) gives each day a stronger start."),
                })
        recs.append({
            'category': 'Work-Life Balance',
            'tip': ("Take at least one screen-free break every 90 minutes. "
                    "Even a 5-minute walk resets focus and reduces stress."),
        })
        return recs[:4]

    @staticmethod
    def _affirmation(score, streak, journal_count):
        if score >= 70 and streak >= 3:
            return (f"You're building beautiful momentum — {streak} days of consistent "
                    f"self-care and a wellness score of {score}. Your dedication to both "
                    "productivity and well-being is inspiring. Keep honoring what your "
                    "body and mind need.")
        if score >= 50:
            return (f"Every step counts, and you took real ones this week. With "
                    f"{journal_count} journal entries and a score of {score}, you're "
                    "laying the groundwork for lasting habits. Be proud of what "
                    "you've started.")
        return ("This week is a fresh chapter. Whatever happened before doesn't "
                "define what comes next. Start with one small act of self-care today "
                "— drink water, write a thought, take a deep breath. You've got this.")

    def calculate_score(self, metrics):
        weights = {
            'focus_time': 0.25,
            'break_balance': 0.20,
            'hydration': 0.15,
            'mood_stability': 0.15,
            'screen_time': 0.10,
            'stretch_compliance': 0.15,
        }
        score = 0
        for key, weight in weights.items():
            value = metrics.get(key, 50)
            score += value * weight
        return min(100, max(0, round(score)))
