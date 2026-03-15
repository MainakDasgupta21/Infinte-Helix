# Reports Routes — /api/reports/*
#
# GET /api/reports/weekly?userId=...&weekStart=2026-03-09
#   Response: {
#     "weekStart": "2026-03-09",
#     "weekEnd": "2026-03-15",
#     "totalWorkHours": 38.5,
#     "dailyHours": [{ "day": "Mon", "hours": 7.5 }, ...],
#     "stressPatterns": [{ "day": "Wed", "hour": 14, "level": "high" }],
#     "hydrationFrequency": { "completed": 32, "target": 56 },
#     "breakBalance": { "taken": 22, "recommended": 30 },
#     "emotionalSummary": { "joy": 12, "neutral": 8, "sadness": 3 },
#     "aiInsight": "You focused deeply this week but skipped breaks on Wednesday."
#   }

# TODO: Blueprint registration
# TODO: get_weekly() — aggregate weekly data + generate AI insight
