from flask import Blueprint, jsonify, request
from app.services.wellness_report_service import WellnessReportService

reports_bp = Blueprint('reports', __name__)
report_service = WellnessReportService()


@reports_bp.route('/weekly', methods=['GET'])
def get_weekly_report():
    user_id = request.args.get('user_id', 'demo-user-001')
    report = report_service.generate_weekly(user_id)
    return jsonify(report)
