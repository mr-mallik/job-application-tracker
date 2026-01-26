#!/usr/bin/env python3
"""
Test Gemini API configuration
"""

import requests
import json
import os

# Load environment variables
def load_env():
    env_vars = {}
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print("❌ .env file not found")
    return env_vars

def test_gemini_api():
    env_vars = load_env()
    api_key = env_vars.get('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in environment")
        return False
    
    print(f"🔑 API Key: {api_key[:10]}...{api_key[-4:]}")
    
    # Test with Gemini REST API directly
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Hello, this is a test. Please respond with 'API Working'."
            }]
        }]
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        print("🧪 Testing Gemini API...")
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'candidates' in data:
                text = data['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ Gemini API Working: {text}")
                return True
        else:
            print(f"❌ API Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Request Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_gemini_api()