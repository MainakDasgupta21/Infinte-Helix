from flask import Blueprint, request, jsonify
from app.services.firebase_service import (
    save_todo, get_todos_today, toggle_todo, delete_todo,
)

todo_bp = Blueprint('todo', __name__)


@todo_bp.route('', methods=['POST'])
def create():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'demo-user-001')
    text = (data.get('text') or '').strip()
    remind_at = data.get('remind_at')  # HH:MM or null

    if not text:
        return jsonify({'error': 'text is required'}), 400

    entry = save_todo(user_id, text, remind_at)
    return jsonify({'status': 'created', 'todo': entry})


@todo_bp.route('/today', methods=['GET'])
def today():
    user_id = request.args.get('user_id', 'demo-user-001')
    todos = get_todos_today(user_id)
    return jsonify({'todos': todos})


@todo_bp.route('/<todo_id>/toggle', methods=['POST'])
def toggle(todo_id):
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'demo-user-001')
    updated = toggle_todo(user_id, todo_id)
    if not updated:
        return jsonify({'error': 'not found'}), 404
    return jsonify({'status': 'toggled', 'todo': updated})


@todo_bp.route('/<todo_id>', methods=['DELETE'])
def remove(todo_id):
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'demo-user-001')
    delete_todo(user_id, todo_id)
    return jsonify({'status': 'deleted'})
