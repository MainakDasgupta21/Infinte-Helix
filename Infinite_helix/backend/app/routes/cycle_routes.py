from flask import Blueprint, request, jsonify
from app.middleware import require_auth

cycle_bp = Blueprint('cycle', __name__)

CYCLE_SUGGESTIONS = {
    'menstrual': {
        'phase': 'menstrual',
        'energy_level': 25,
        'energy_label': 'Low Energy',
        'focus_suggestion': 'Rest & Reflect',
        'nudge_adjustments': [
            'Warm tea reminder every 90 min',
            'Gentle stretching only — no intense exercise',
            'Power nap reminder at 2 PM',
            'Self-compassion prompt every 2 hours',
        ],
        'work_tips': [
            'Schedule lighter tasks',
            'Avoid back-to-back meetings',
            'Use comfort items at desk',
            'Shorter work sessions with longer breaks',
        ],
    },
    'follicular': {
        'phase': 'follicular',
        'energy_level': 65,
        'energy_label': 'Rising Energy',
        'focus_suggestion': 'Plan & Create',
        'nudge_adjustments': [
            'Creative brainstorming windows scheduled',
            'Active break suggestions enabled',
            'Social collaboration nudges active',
            'New project planning prompts',
        ],
        'work_tips': [
            'Great time for brainstorming',
            'Start new projects',
            'Schedule social meetings',
            'Try new routines and habits',
        ],
    },
    'ovulatory': {
        'phase': 'ovulatory',
        'energy_level': 95,
        'energy_label': 'Peak Energy',
        'focus_suggestion': 'Present & Lead',
        'nudge_adjustments': [
            'Presentation confidence boosters',
            'Deep work focus blocks maximized',
            'High-energy exercise suggestions',
            'Leadership opportunity nudges',
        ],
        'work_tips': [
            'Schedule important presentations',
            'Lead meetings and discussions',
            'Tackle the hardest problems',
            'Leverage peak social energy',
        ],
    },
    'luteal': {
        'phase': 'luteal',
        'energy_level': 45,
        'energy_label': 'Winding Down',
        'focus_suggestion': 'Complete & Organize',
        'nudge_adjustments': [
            'Task completion & cleanup prompts',
            'Comfort food & tea reminders',
            'Detail-oriented work suggestions',
            'Extra self-care reminders',
        ],
        'work_tips': [
            'Finish existing tasks',
            'Detail-oriented work',
            'Organize and clean up',
            'More frequent breaks needed',
        ],
    },
}


@cycle_bp.route('/suggestions/<phase>', methods=['GET'])
@require_auth
def get_suggestions(phase):
    if phase not in CYCLE_SUGGESTIONS:
        return jsonify({'error': 'Invalid phase. Use: menstrual, follicular, ovulatory, luteal'}), 400
    return jsonify(CYCLE_SUGGESTIONS[phase])


@cycle_bp.route('/phase', methods=['POST'])
@require_auth
def set_phase():
    data = request.get_json()
    phase = data.get('phase', '')
    if phase not in CYCLE_SUGGESTIONS:
        return jsonify({'error': 'Invalid phase'}), 400
    return jsonify({'status': 'phase_updated', 'phase': phase, **CYCLE_SUGGESTIONS[phase]})
