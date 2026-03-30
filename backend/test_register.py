import requests
import json

url = "http://localhost:8000/api/register"
data = {
    "username": "aman_test",
    "email": "aman@test.com",
    "password": "password123"
}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
