#!/usr/bin/env python3
"""
Job Application Tracker Backend API Tests
Tests all authentication, job management, and AI features
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://jobtracker-77.preview.emergentagent.com/api"

# Test data
TEST_USER = {
    "email": "testuser@jobtracker.com",
    "password": "testpass123",
    "name": "Test User"
}

EXISTING_USER = {
    "email": "demo@jobtracker.com", 
    "password": "demo123"
}

class JobTrackerAPITest:
    def __init__(self):
        self.auth_token = None
        self.test_job_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log_test(self, test_name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def make_request(self, method, endpoint, data=None, auth=True):
        """Make HTTP request with proper error handling"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
            
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            print(f"Request error: {e}")
            return None
    
    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = self.make_request('GET', '/', auth=False)
            if response and response.status_code == 200:
                data = response.json()
                if 'message' in data:
                    self.log_test("API Root", True, f"API accessible: {data['message']}")
                    return True
            self.log_test("API Root", False, f"Status: {response.status_code if response else 'No response'}")
            return False
        except Exception as e:
            self.log_test("API Root", False, f"Error: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration with email verification"""
        try:
            # Use unique email for each test run
            test_email = f"test_{int(time.time())}@jobtracker.com"
            user_data = {
                "email": test_email,
                "password": TEST_USER["password"],
                "name": TEST_USER["name"]
            }
            
            response = self.make_request('POST', '/auth/register', user_data, auth=False)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'message' in data and 'verification code' in data['message'].lower():
                    self.log_test("User Registration", True, "User registered, verification code logged to console")
                    # Store for verification test
                    self.test_user_email = test_email
                    return True
            
            self.log_test("User Registration", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}")
            return False
    
    def test_user_login_existing(self):
        """Test login with existing verified user"""
        try:
            response = self.make_request('POST', '/auth/login', EXISTING_USER, auth=False)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.auth_token = data['token']
                    self.log_test("User Login (Existing)", True, f"Login successful, token received")
                    return True
            
            self.log_test("User Login (Existing)", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("User Login (Existing)", False, f"Error: {str(e)}")
            return False
    
    def test_get_current_user(self):
        """Test getting current user info"""
        try:
            response = self.make_request('GET', '/auth/me')
            
            if response and response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    user = data['user']
                    self.log_test("Get Current User", True, f"User: {user.get('name', 'N/A')} ({user.get('email', 'N/A')})")
                    return True
            
            self.log_test("Get Current User", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Get Current User", False, f"Error: {str(e)}")
            return False
    
    def test_profile_update(self):
        """Test profile update"""
        try:
            update_data = {
                "name": "Updated Test User",
                "phone": "+1234567890"
            }
            
            response = self.make_request('PUT', '/auth/profile', update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'user' in data:
                    user = data['user']
                    if user.get('name') == update_data['name']:
                        self.log_test("Profile Update", True, f"Profile updated successfully")
                        return True
            
            self.log_test("Profile Update", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Profile Update", False, f"Error: {str(e)}")
            return False
    
    def test_password_reset_request(self):
        """Test password reset request"""
        try:
            reset_data = {"email": EXISTING_USER["email"]}
            
            response = self.make_request('POST', '/auth/forgot-password', reset_data, auth=False)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'message' in data and 'reset code' in data['message'].lower():
                    self.log_test("Password Reset Request", True, "Reset code sent (check console)")
                    return True
            
            self.log_test("Password Reset Request", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Password Reset Request", False, f"Error: {str(e)}")
            return False
    
    def test_create_job(self):
        """Test creating a new job application"""
        try:
            job_data = {
                "title": "Senior Software Engineer",
                "company": "Tech Corp",
                "location": "London, UK",
                "salary": "£70,000 - £90,000",
                "closingDate": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
                "appliedDate": datetime.now().strftime("%Y-%m-%d"),
                "status": "applied",
                "url": "https://example.com/job/123",
                "description": "We are looking for a senior software engineer...",
                "requirements": "5+ years experience, Python, JavaScript",
                "benefits": "Health insurance, pension, flexible working",
                "notes": "Applied through company website"
            }
            
            response = self.make_request('POST', '/jobs', job_data)
            
            if response and response.status_code == 201:
                data = response.json()
                if 'job' in data:
                    job = data['job']
                    self.test_job_id = job.get('id')
                    self.log_test("Create Job", True, f"Job created: {job.get('title')} at {job.get('company')}")
                    return True
            
            self.log_test("Create Job", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("Create Job", False, f"Error: {str(e)}")
            return False
    
    def test_get_all_jobs(self):
        """Test getting all jobs for user"""
        try:
            response = self.make_request('GET', '/jobs')
            
            if response and response.status_code == 200:
                data = response.json()
                if 'jobs' in data:
                    jobs = data['jobs']
                    self.log_test("Get All Jobs", True, f"Retrieved {len(jobs)} jobs")
                    return True
            
            self.log_test("Get All Jobs", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Get All Jobs", False, f"Error: {str(e)}")
            return False
    
    def test_get_single_job(self):
        """Test getting a single job"""
        if not self.test_job_id:
            self.log_test("Get Single Job", False, "No test job ID available")
            return False
            
        try:
            response = self.make_request('GET', f'/jobs/{self.test_job_id}')
            
            if response and response.status_code == 200:
                data = response.json()
                if 'job' in data:
                    job = data['job']
                    self.log_test("Get Single Job", True, f"Retrieved job: {job.get('title')}")
                    return True
            
            self.log_test("Get Single Job", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Get Single Job", False, f"Error: {str(e)}")
            return False
    
    def test_update_job(self):
        """Test updating a job"""
        if not self.test_job_id:
            self.log_test("Update Job", False, "No test job ID available")
            return False
            
        try:
            update_data = {
                "status": "interview",
                "notes": "Updated: Phone interview scheduled for next week"
            }
            
            response = self.make_request('PUT', f'/jobs/{self.test_job_id}', update_data)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'job' in data:
                    job = data['job']
                    if job.get('status') == update_data['status']:
                        self.log_test("Update Job", True, f"Job updated: status = {job.get('status')}")
                        return True
            
            self.log_test("Update Job", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Update Job", False, f"Error: {str(e)}")
            return False
    
    def test_job_scraping(self):
        """Test job URL scraping with Gemini AI"""
        try:
            # Use a real job posting URL for testing
            scrape_data = {
                "url": "https://jobs.ac.uk/job/CYG234/research-associate"
            }
            
            response = self.make_request('POST', '/jobs/scrape', scrape_data)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'jobDetails' in data:
                    job_details = data['jobDetails']
                    self.log_test("Job Scraping", True, f"Extracted job: {job_details.get('title', 'N/A')}")
                    return True
            
            self.log_test("Job Scraping", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("Job Scraping", False, f"Error: {str(e)}")
            return False
    
    def test_document_refinement(self):
        """Test document refinement with Gemini AI"""
        try:
            refine_data = {
                "documentType": "resume",
                "content": "John Smith\nSoftware Engineer\n\nExperience:\n- 3 years Python development\n- Web applications with Django\n- Database design and optimization",
                "jobDescription": "We are seeking a Senior Python Developer with experience in Django, PostgreSQL, and cloud deployment. The role involves building scalable web applications and mentoring junior developers.",
                "userPreferences": "Focus on technical skills and leadership experience"
            }
            
            response = self.make_request('POST', '/documents/refine', refine_data)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'refinedContent' in data:
                    refined = data['refinedContent']
                    self.log_test("Document Refinement", True, f"Document refined ({len(refined)} chars)")
                    return True
            
            self.log_test("Document Refinement", False, f"Status: {response.status_code if response else 'No response'}")
            if response:
                print(f"Response: {response.text}")
            return False
            
        except Exception as e:
            self.log_test("Document Refinement", False, f"Error: {str(e)}")
            return False
    
    def test_delete_job(self):
        """Test deleting a job"""
        if not self.test_job_id:
            self.log_test("Delete Job", False, "No test job ID available")
            return False
            
        try:
            response = self.make_request('DELETE', f'/jobs/{self.test_job_id}')
            
            if response and response.status_code == 200:
                data = response.json()
                if 'message' in data and 'deleted' in data['message'].lower():
                    self.log_test("Delete Job", True, "Job deleted successfully")
                    return True
            
            self.log_test("Delete Job", False, f"Status: {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Delete Job", False, f"Error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        try:
            # Temporarily remove auth token
            original_token = self.auth_token
            self.auth_token = None
            
            response = self.make_request('GET', '/jobs')
            
            # Restore token
            self.auth_token = original_token
            
            if response and response.status_code == 401:
                self.log_test("Unauthorized Access", True, "Properly rejected unauthorized request")
                return True
            
            self.log_test("Unauthorized Access", False, f"Expected 401, got {response.status_code if response else 'No response'}")
            return False
            
        except Exception as e:
            self.log_test("Unauthorized Access", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🧪 JOB TRACKER BACKEND API TESTS")
        print("=" * 60)
        print(f"Base URL: {BASE_URL}")
        print()
        
        test_results = []
        
        # Core API tests
        test_results.append(self.test_api_root())
        
        # Authentication tests
        test_results.append(self.test_user_registration())
        test_results.append(self.test_user_login_existing())
        test_results.append(self.test_get_current_user())
        test_results.append(self.test_profile_update())
        test_results.append(self.test_password_reset_request())
        
        # Job management tests
        test_results.append(self.test_create_job())
        test_results.append(self.test_get_all_jobs())
        test_results.append(self.test_get_single_job())
        test_results.append(self.test_update_job())
        
        # AI feature tests (may take longer)
        print("\n🤖 Testing AI Features (may take a few seconds)...")
        test_results.append(self.test_job_scraping())
        test_results.append(self.test_document_refinement())
        
        # Security tests
        test_results.append(self.test_unauthorized_access())
        
        # Cleanup
        test_results.append(self.test_delete_job())
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(test_results)
        total = len(test_results)
        
        print(f"Tests Passed: {passed}/{total}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {total - passed} tests failed")
        
        return passed == total

if __name__ == "__main__":
    tester = JobTrackerAPITest()
    success = tester.run_all_tests()
    exit(0 if success else 1)