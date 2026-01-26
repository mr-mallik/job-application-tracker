#!/usr/bin/env python3
"""
Test AI endpoints specifically
"""

import requests
import json
import time

BASE_URL = "https://jobtracker-77.preview.emergentagent.com/api"
EXISTING_USER = {"email": "demo@jobtracker.com", "password": "demo123"}

def login_and_get_token():
    """Login and get auth token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=EXISTING_USER)
        if response.status_code == 200:
            data = response.json()
            return data.get('token')
    except Exception as e:
        print(f"Login error: {e}")
    return None

def test_document_refinement(token):
    """Test document refinement"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "documentType": "resume",
        "content": "John Smith\nSoftware Engineer\n\nExperience:\n- 3 years Python development\n- Web applications with Django",
        "jobDescription": "We are seeking a Senior Python Developer with Django experience.",
        "userPreferences": "Focus on technical skills"
    }
    
    try:
        print("🧪 Testing Document Refinement...")
        response = requests.post(f"{BASE_URL}/documents/refine", json=data, headers=headers, timeout=60)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'refinedContent' in result:
                print(f"✅ Document Refinement Working: {len(result['refinedContent'])} chars")
                return True
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request Error: {str(e)}")
    
    return False

def test_job_scraping(token):
    """Test job scraping"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "url": "https://jobs.ac.uk/job/CYG234/research-associate"
    }
    
    try:
        print("🧪 Testing Job Scraping...")
        response = requests.post(f"{BASE_URL}/jobs/scrape", json=data, headers=headers, timeout=60)
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            if 'jobDetails' in result:
                job_details = result['jobDetails']
                print(f"✅ Job Scraping Working: {job_details.get('title', 'N/A')}")
                return True
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request Error: {str(e)}")
    
    return False

if __name__ == "__main__":
    print("🤖 Testing AI Endpoints")
    print("=" * 40)
    
    # Login first
    token = login_and_get_token()
    if not token:
        print("❌ Failed to get auth token")
        exit(1)
    
    print("✅ Login successful")
    
    # Test AI endpoints
    doc_result = test_document_refinement(token)
    scrape_result = test_job_scraping(token)
    
    print("\n" + "=" * 40)
    print("📊 AI Test Results:")
    print(f"Document Refinement: {'✅ PASS' if doc_result else '❌ FAIL'}")
    print(f"Job Scraping: {'✅ PASS' if scrape_result else '❌ FAIL'}")
    
    if doc_result and scrape_result:
        print("🎉 All AI features working!")
    else:
        print("⚠️ Some AI features failed")