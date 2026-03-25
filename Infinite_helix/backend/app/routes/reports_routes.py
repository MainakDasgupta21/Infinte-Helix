from flask import Blueprint, jsonify, request
from app.services.wellness_report_service import WellnessReportService
from app.middleware import require_auth

reports_bp = Blueprint('reports', __name__)
report_service = WellnessReportService()


@reports_bp.route('/weekly', methods=['GET'])
@require_auth
def get_weekly_report():
    user_id = request.uid
    report = report_service.generate_weekly(user_id)
    return jsonify(report)
