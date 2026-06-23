import requests
import json

url = "http://localhost:8000/api/tasks"
data = {
    "title": "Prepare hackathon submission",
    "deadline": "2026-06-29T14:00:00",
    "estimated_minutes": 480,
    "priority": "high",
    "status": "pending",
    "complexity_level": 5
}

response = requests.post(url, json=data)
print(response.status_code)
print(json.dumps(response.json(), indent=2))