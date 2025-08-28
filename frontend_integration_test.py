#!/usr/bin/env python3
"""
Frontend Integration Test - Specific API endpoints for Workout and Habit modules
Tests the exact endpoints that the new frontend modules will be calling
"""

import requests
import json
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://couple-fitness.preview.emergentagent.com/api"
TIMEOUT = 30

# Demo account as specified in the request
DEMO_USER = {"email": "alex@example.com", "password": "password123"}

class FrontendIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.token = None
        self.test_data = {}
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def make_request(self, method: str, endpoint: str, token: str = None, **kwargs) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{BASE_URL}{endpoint}"
        headers = kwargs.get('headers', {})
        
        if token:
            headers['Authorization'] = f"Bearer {token}"
            
        kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            self.log(f"{method} {endpoint} -> {response.status_code}")
            if response.status_code >= 400:
                self.log(f"Response body: {response.text}")
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            raise
            
    def authenticate(self) -> bool:
        """Authenticate with demo account"""
        self.log("Authenticating with demo account...")
        
        try:
            response = self.make_request("POST", "/auth/login", json=DEMO_USER)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.token = data["access_token"]
                    self.log("✅ Authentication successful")
                    
                    # Verify token works by testing /me endpoint
                    me_response = self.make_request("GET", "/me", token=self.token)
                    if me_response.status_code == 200:
                        user_data = me_response.json()
                        self.log(f"✅ Token verification successful - User: {user_data.get('email')}")
                        return True
                    else:
                        self.log(f"❌ Token verification failed: {me_response.status_code}", "ERROR")
                        return False
                else:
                    self.log("❌ Authentication response missing token", "ERROR")
                    return False
            else:
                self.log(f"❌ Authentication failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication exception: {e}", "ERROR")
            return False
            
    def test_workout_endpoints(self) -> bool:
        """Test all workout endpoints that frontend will use"""
        self.log("\n" + "="*60)
        self.log("TESTING WORKOUT ENDPOINTS FOR FRONTEND")
        self.log("="*60)
        
        success = True
        
        try:
            # 1. GET /workout-templates (mine=true)
            self.log("Testing GET /workout-templates?mine=true...")
            response = self.make_request("GET", "/workout-templates", 
                                       token=self.token, 
                                       params={"mine": "true"})
            
            if response.status_code == 200:
                my_templates = response.json()
                self.log(f"✅ GET /workout-templates?mine=true successful - Found {len(my_templates)} templates")
            else:
                self.log(f"❌ GET /workout-templates?mine=true failed: {response.status_code}", "ERROR")
                success = False
                
            # 2. GET /workout-templates (mine=false)
            self.log("Testing GET /workout-templates?mine=false...")
            response = self.make_request("GET", "/workout-templates", 
                                       token=self.token, 
                                       params={"mine": "false"})
            
            if response.status_code == 200:
                public_templates = response.json()
                self.log(f"✅ GET /workout-templates?mine=false successful - Found {len(public_templates)} templates")
            else:
                self.log(f"❌ GET /workout-templates?mine=false failed: {response.status_code}", "ERROR")
                success = False
                
            # 3. POST /workout-templates (create custom template)
            self.log("Testing POST /workout-templates (create custom template)...")
            exercises_data = [
                {"name": "Deadlift", "sets": 3, "reps": 8, "weight_kg": 100.0},
                {"name": "Barbell Row", "sets": 3, "reps": 10, "weight_kg": 70.0},
                {"name": "Pull-ups", "sets": 3, "reps": 12}
            ]
            
            response = self.make_request("POST", "/workout-templates", 
                                       token=self.token, 
                                       params={
                                           "name": "Pull Day - Frontend Test",
                                           "workout_type": "gym"
                                       },
                                       json=exercises_data)
            
            if response.status_code == 200:
                template = response.json()
                template_id = template.get("id")
                if template_id:
                    self.test_data["template_id"] = template_id
                    self.log("✅ POST /workout-templates successful - Template created")
                else:
                    self.log("❌ Template creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ POST /workout-templates failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # 4. POST /workout-sessions (start session)
            self.log("Testing POST /workout-sessions (start session)...")
            exercises_performed = [
                {"name": "Deadlift", "sets": 3, "reps": 8, "weight_kg": 102.5},
                {"name": "Barbell Row", "sets": 3, "reps": 10, "weight_kg": 72.5},
                {"name": "Pull-ups", "sets": 3, "reps": 10}
            ]
            
            session_params = {
                "mode": "gym",
                "notes": "Frontend integration test session",
                "start_time": datetime.utcnow().isoformat(),
                "end_time": (datetime.utcnow() + timedelta(hours=1, minutes=15)).isoformat()
            }
            
            if "template_id" in self.test_data:
                session_params["template_id"] = str(self.test_data["template_id"])
            
            response = self.make_request("POST", "/workout-sessions", 
                                       token=self.token, 
                                       params=session_params,
                                       json=exercises_performed)
            
            if response.status_code == 200:
                session = response.json()
                session_id = session.get("id")
                if session_id:
                    self.test_data["session_id"] = session_id
                    self.log("✅ POST /workout-sessions successful - Session created")
                else:
                    self.log("❌ Session creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ POST /workout-sessions failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # 5. PATCH /workout-sessions/{id} (finish session)
            if "session_id" in self.test_data:
                self.log("Testing PATCH /workout-sessions/{id} (finish session)...")
                session_id = self.test_data["session_id"]
                
                finish_data = {
                    "end_time": datetime.utcnow().isoformat(),
                    "notes": "Session completed via frontend test",
                    "rating": 4
                }
                
                response = self.make_request("PATCH", f"/workout-sessions/{session_id}", 
                                           token=self.token, 
                                           json=finish_data)
                
                if response.status_code == 200:
                    updated_session = response.json()
                    self.log("✅ PATCH /workout-sessions/{id} successful - Session finished")
                else:
                    self.log(f"❌ PATCH /workout-sessions/{session_id} failed: {response.status_code} - {response.text}", "ERROR")
                    success = False
            else:
                self.log("⚠️ Skipping PATCH /workout-sessions/{id} - no session ID available", "WARN")
                
            # 6. GET /workout-stats/weekly
            self.log("Testing GET /workout-stats/weekly...")
            response = self.make_request("GET", "/workout-sessions/stats/weekly", 
                                       token=self.token)
            
            if response.status_code == 200:
                stats = response.json()
                if "total_sessions" in stats and "gym_sessions" in stats:
                    self.log(f"✅ GET /workout-stats/weekly successful - {stats.get('total_sessions', 0)} total sessions")
                else:
                    self.log("❌ Weekly stats missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ GET /workout-stats/weekly failed: {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Workout endpoints exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_habit_endpoints(self) -> bool:
        """Test all habit endpoints that frontend will use"""
        self.log("\n" + "="*60)
        self.log("TESTING HABIT ENDPOINTS FOR FRONTEND")
        self.log("="*60)
        
        success = True
        
        try:
            # 1. GET /habits
            self.log("Testing GET /habits...")
            response = self.make_request("GET", "/habits", token=self.token)
            
            if response.status_code == 200:
                habits = response.json()
                self.log(f"✅ GET /habits successful - Found {len(habits)} habits")
            else:
                self.log(f"❌ GET /habits failed: {response.status_code}", "ERROR")
                success = False
                
            # 2. POST /habits (create habit)
            self.log("Testing POST /habits (create habit)...")
            response = self.make_request("POST", "/habits", 
                                       token=self.token, 
                                       params={
                                           "name": "Morning Meditation - Frontend Test",
                                           "cadence": "daily",
                                           "reminder_time_local": "07:00"
                                       })
            
            if response.status_code == 200:
                habit = response.json()
                habit_id = habit.get("id")
                if habit_id:
                    self.test_data["habit_id"] = habit_id
                    self.log("✅ POST /habits successful - Habit created")
                else:
                    self.log("❌ Habit creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ POST /habits failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # 3. PATCH /habits/{id} (update habit)
            if "habit_id" in self.test_data:
                self.log("Testing PATCH /habits/{id} (update habit)...")
                habit_id = self.test_data["habit_id"]
                
                response = self.make_request("PATCH", f"/habits/{habit_id}", 
                                           token=self.token, 
                                           params={
                                               "name": "Morning Meditation - Updated via Frontend",
                                               "reminder_time_local": "07:30"
                                           })
                
                if response.status_code == 200:
                    updated_habit = response.json()
                    if "Morning Meditation - Updated via Frontend" in updated_habit.get("name", ""):
                        self.log("✅ PATCH /habits/{id} successful - Habit updated")
                    else:
                        self.log("❌ Habit not updated correctly", "ERROR")
                        success = False
                else:
                    self.log(f"❌ PATCH /habits/{habit_id} failed: {response.status_code}", "ERROR")
                    success = False
            else:
                self.log("⚠️ Skipping PATCH /habits/{id} - no habit ID available", "WARN")
                
            # 4. GET /habits/logs (fetch logs)
            self.log("Testing GET /habits/logs (fetch logs)...")
            response = self.make_request("GET", "/habits/logs", token=self.token)
            
            if response.status_code == 200:
                logs = response.json()
                self.log(f"✅ GET /habits/logs successful - Found {len(logs)} logs")
            else:
                self.log(f"❌ GET /habits/logs failed: {response.status_code}", "ERROR")
                success = False
                
            # 5. POST /habits/{id}/logs (log habit)
            if "habit_id" in self.test_data:
                self.log("Testing POST /habits/{id}/logs (log habit)...")
                habit_id = self.test_data["habit_id"]
                
                response = self.make_request("POST", f"/habits/{habit_id}/logs", 
                                           token=self.token, 
                                           params={
                                               "log_date": date.today().isoformat(),
                                               "status": "done",
                                               "notes": "Completed via frontend integration test"
                                           })
                
                if response.status_code == 200:
                    log = response.json()
                    if log.get("status") == "done":
                        self.log("✅ POST /habits/{id}/logs successful - Habit logged")
                    else:
                        self.log("❌ Habit log data invalid", "ERROR")
                        success = False
                else:
                    self.log(f"❌ POST /habits/{habit_id}/logs failed: {response.status_code} - {response.text}", "ERROR")
                    success = False
            else:
                self.log("⚠️ Skipping POST /habits/{id}/logs - no habit ID available", "WARN")
                
        except Exception as e:
            self.log(f"❌ Habit endpoints exception: {e}", "ERROR")
            success = False
            
        return success
        
    def run_frontend_integration_tests(self) -> Dict[str, bool]:
        """Run all frontend integration tests"""
        self.log("Starting Frontend Integration Tests...")
        self.log(f"Testing against: {BASE_URL}")
        self.log(f"Using demo account: {DEMO_USER['email']}")
        
        results = {}
        
        # Authenticate first
        if not self.authenticate():
            self.log("❌ Authentication failed - cannot proceed with tests", "ERROR")
            return {"Authentication": False}
            
        results["Authentication"] = True
        
        # Run specific endpoint tests
        test_suites = [
            ("Workout Endpoints", self.test_workout_endpoints),
            ("Habit Endpoints", self.test_habit_endpoints)
        ]
        
        for suite_name, test_func in test_suites:
            try:
                results[suite_name] = test_func()
            except Exception as e:
                self.log(f"❌ {suite_name} test suite failed with exception: {e}", "ERROR")
                results[suite_name] = False
                
        return results
        
    def print_summary(self, results: Dict[str, bool]):
        """Print test results summary"""
        self.log(f"\n{'='*60}")
        self.log("FRONTEND INTEGRATION TEST SUMMARY")
        self.log(f"{'='*60}")
        
        passed = 0
        total = len(results)
        
        for suite_name, success in results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            self.log(f"{suite_name:<20} {status}")
            if success:
                passed += 1
                
        self.log(f"\nOverall: {passed}/{total} test suites passed")
        
        if passed == total:
            self.log("🎉 All frontend integration tests passed!")
            self.log("✅ Backend APIs are ready for frontend Workout and Habit modules")
        else:
            self.log(f"⚠️  {total - passed} test suite(s) failed. Check logs above for details.")
            
        return passed == total

def main():
    """Main test execution"""
    tester = FrontendIntegrationTester()
    
    try:
        results = tester.run_frontend_integration_tests()
        overall_success = tester.print_summary(results)
        
        # Exit with appropriate code
        exit(0 if overall_success else 1)
        
    except KeyboardInterrupt:
        tester.log("\n❌ Tests interrupted by user", "ERROR")
        exit(1)
    except Exception as e:
        tester.log(f"\n❌ Test execution failed: {e}", "ERROR")
        exit(1)

if __name__ == "__main__":
    main()