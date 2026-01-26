#!/usr/bin/env python3
"""
List available Gemini models and test with correct model
"""

import requests
import json

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

def list_models():
    env_vars = load_env()
    api_key = env_vars.get('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return []
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        response = requests.get(url, timeout=30)
        print(f"List Models Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f"✅ Found {len(models)} models:")
            
            available_models = []
            for model in models:
                name = model.get('name', '')
                supported_methods = model.get('supportedGenerationMethods', [])
                if 'generateContent' in supported_methods:
                    available_models.append(name)
                    print(f"  - {name} (supports generateContent)")
                else:
                    print(f"  - {name} (no generateContent support)")
            
            return available_models
        else:
            print(f"❌ Error listing models: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Request Error: {str(e)}")
        return []

def test_with_model(model_name):
    env_vars = load_env()
    api_key = env_vars.get('GEMINI_API_KEY')
    
    # Remove the models/ prefix if present
    model_id = model_name.replace('models/', '')
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{
                "text": "Hello, this is a test. Please respond with 'API Working'."
            }]
        }]
    }
    
    try:
        print(f"🧪 Testing model: {model_id}")
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            if 'candidates' in data:
                text = data['candidates'][0]['content']['parts'][0]['text']
                print(f"✅ {model_id} Working: {text}")
                return True
        else:
            print(f"❌ {model_id} Error ({response.status_code}): {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ {model_id} Request Error: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔍 Listing available Gemini models...")
    models = list_models()
    
    if models:
        print(f"\n🧪 Testing first available model...")
        test_with_model(models[0])
    else:
        print("❌ No models available for testing")