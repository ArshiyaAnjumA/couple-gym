#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for CouplesWorkout FastAPI Application
Tests all implemented endpoints with realistic data scenarios
"""

import requests
import json
import uuid
from datetime import datetime, date, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://pairgym.preview.emergentagent.com/api"
TIMEOUT = 30

# Test users from seeded data
TEST_USERS = {
    "alex": {"email": "alex@example.com", "password": "password123"},
    "sam": {"email": "sam@example.com", "password": "password123"},
    "demo": {"email": "demo@example.com", "password": "password123"}
}

class CouplesWorkoutAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.tokens = {}
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
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            raise
            
    def test_health_check(self) -> bool:
        """Test basic health check endpoint"""
        self.log("Testing health check endpoint...")
        
        try:
            response = self.make_request("GET", "/health")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log("✅ Health check passed")
                    return True
                else:
                    self.log(f"❌ Health check failed: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ Health check failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Health check exception: {e}", "ERROR")
            return False
            
    def test_authentication(self) -> bool:
        """Test user registration and login"""
        self.log("Testing authentication system...")
        
        success = True
        
        # Test login for existing users
        for user_key, credentials in TEST_USERS.items():
            try:
                response = self.make_request("POST", "/auth/login", json=credentials)
                
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data and "refresh_token" in data:
                        self.tokens[user_key] = data["access_token"]
                        self.log(f"✅ Login successful for {user_key}")
                    else:
                        self.log(f"❌ Login response missing tokens for {user_key}", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Login failed for {user_key}: {response.status_code} - {response.text}", "ERROR")
                    success = False
                    
            except Exception as e:
                self.log(f"❌ Login exception for {user_key}: {e}", "ERROR")
                success = False
                
        # Test registration with new user
        try:
            new_user = {
                "email": f"testuser_{int(datetime.now().timestamp())}@example.com",
                "password": "testpass123",
                "display_name": "Test User"
            }
            
            response = self.make_request("POST", "/auth/register", json=new_user)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.tokens["new_user"] = data["access_token"]
                    self.test_data["new_user_email"] = new_user["email"]
                    self.log("✅ Registration successful")
                else:
                    self.log("❌ Registration response missing token", "ERROR")
                    success = False
            else:
                self.log(f"❌ Registration failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Registration exception: {e}", "ERROR")
            success = False
            
        # Test token refresh
        if "alex" in self.tokens:
            try:
                # First get a refresh token by logging in again
                response = self.make_request("POST", "/auth/login", json=TEST_USERS["alex"])
                if response.status_code == 200:
                    refresh_token = response.json().get("refresh_token")
                    
                    # Test refresh endpoint
                    refresh_response = self.make_request("POST", "/auth/refresh", 
                                                       json={"refresh_token": refresh_token})
                    
                    if refresh_response.status_code == 200:
                        self.log("✅ Token refresh successful")
                    else:
                        self.log(f"❌ Token refresh failed: {refresh_response.status_code}", "ERROR")
                        success = False
                        
            except Exception as e:
                self.log(f"❌ Token refresh exception: {e}", "ERROR")
                success = False
                
        return success
        
    def test_user_management(self) -> bool:
        """Test user profile endpoints"""
        self.log("Testing user management...")
        
        if "alex" not in self.tokens:
            self.log("❌ No auth token for user management tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test get current user
            response = self.make_request("GET", "/me", token=self.tokens["alex"])
            
            if response.status_code == 200:
                user_data = response.json()
                if "email" in user_data and "display_name" in user_data:
                    self.log("✅ Get current user successful")
                    self.test_data["alex_user_id"] = user_data.get("id")
                else:
                    self.log("❌ User data missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get current user failed: {response.status_code}", "ERROR")
                success = False
                
            # Test update user profile
            update_data = {"display_name": "Alex Updated"}
            response = self.make_request("PATCH", "/me", token=self.tokens["alex"], json=update_data)
            
            if response.status_code == 200:
                updated_user = response.json()
                if updated_user.get("display_name") == "Alex Updated":
                    self.log("✅ Update user profile successful")
                else:
                    self.log("❌ User profile not updated correctly", "ERROR")
                    success = False
            else:
                self.log(f"❌ Update user profile failed: {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ User management exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_couple_management(self) -> bool:
        """Test couple creation, invites, and member management"""
        self.log("Testing couple management...")
        
        if "demo" not in self.tokens or "new_user" not in self.tokens:
            self.log("❌ Missing auth tokens for couple management tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test create couple (using demo user)
            response = self.make_request("POST", "/couples/", token=self.tokens["demo"])
            
            if response.status_code == 200:
                couple_data = response.json()
                couple_id = couple_data.get("id")
                if couple_id:
                    self.test_data["couple_id"] = couple_id
                    self.log("✅ Couple creation successful")
                else:
                    self.log("❌ Couple creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ Couple creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test generate invite code
            if "couple_id" in self.test_data:
                couple_id = self.test_data["couple_id"]
                response = self.make_request("POST", f"/couples/{couple_id}/invite", 
                                           token=self.tokens["demo"])
                
                if response.status_code == 200:
                    invite_data = response.json()
                    invite_code = invite_data.get("invite_code")
                    if invite_code:
                        self.test_data["invite_code"] = invite_code
                        self.log("✅ Invite code generation successful")
                    else:
                        self.log("❌ Invite code missing", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Invite code generation failed: {response.status_code}", "ERROR")
                    success = False
                    
            # Test accept invite (using new_user)
            if "couple_id" in self.test_data and "invite_code" in self.test_data:
                couple_id = self.test_data["couple_id"]
                invite_code = self.test_data["invite_code"]
                
                response = self.make_request("POST", f"/couples/{couple_id}/accept", 
                                           token=self.tokens["new_user"],
                                           params={"code": invite_code})
                
                if response.status_code == 200:
                    self.log("✅ Invite acceptance successful")
                else:
                    self.log(f"❌ Invite acceptance failed: {response.status_code} - {response.text}", "ERROR")
                    success = False
                    
            # Test get couple members
            if "couple_id" in self.test_data:
                couple_id = self.test_data["couple_id"]
                response = self.make_request("GET", f"/couples/{couple_id}/members", 
                                           token=self.tokens["demo"])
                
                if response.status_code == 200:
                    members = response.json()
                    if isinstance(members, list) and len(members) >= 1:
                        self.log("✅ Get couple members successful")
                    else:
                        self.log("❌ Couple members data invalid", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Get couple members failed: {response.status_code}", "ERROR")
                    success = False
                    
            # Test update couple settings
            if "couple_id" in self.test_data:
                couple_id = self.test_data["couple_id"]
                response = self.make_request("PATCH", f"/couples/{couple_id}/settings", 
                                           token=self.tokens["demo"],
                                           params={"share_progress_enabled": True, 
                                                  "share_habits_enabled": False})
                
                if response.status_code == 200:
                    settings = response.json()
                    if settings.get("share_progress_enabled") == True:
                        self.log("✅ Update couple settings successful")
                    else:
                        self.log("❌ Couple settings not updated correctly", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Update couple settings failed: {response.status_code}", "ERROR")
                    success = False
                    
        except Exception as e:
            self.log(f"❌ Couple management exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_workout_system(self) -> bool:
        """Test workout templates and sessions"""
        self.log("Testing workout system...")
        
        if "alex" not in self.tokens:
            self.log("❌ No auth token for workout tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test create workout template
            exercises_data = [
                {"name": "Bench Press", "sets": 3, "reps": 10, "weight_kg": 80.0},
                {"name": "Shoulder Press", "sets": 3, "reps": 12, "weight_kg": 40.0},
                {"name": "Push-ups", "sets": 2, "reps": 15}
            ]
            
            response = self.make_request("POST", "/workout-templates/", 
                                       token=self.tokens["alex"], 
                                       params={
                                           "name": "Push Day Workout",
                                           "workout_type": "gym"
                                       },
                                       json=exercises_data)
            
            if response.status_code == 200:
                template = response.json()
                template_id = template.get("id")
                if template_id:
                    self.test_data["template_id"] = template_id
                    self.log("✅ Workout template creation successful")
                else:
                    self.log("❌ Template creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ Workout template creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test get workout templates
            response = self.make_request("GET", "/workout-templates/", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                templates = response.json()
                if isinstance(templates, list):
                    self.log("✅ Get workout templates successful")
                else:
                    self.log("❌ Templates response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get workout templates failed: {response.status_code}", "ERROR")
                success = False
                
            # Test create workout session (gym mode)
            exercises_performed = [
                {"name": "Bench Press", "sets": 3, "reps": 10, "weight_kg": 82.5},
                {"name": "Shoulder Press", "sets": 3, "reps": 12, "weight_kg": 42.5}
            ]
            
            session_params = {
                "mode": "gym",
                "notes": "Great workout today!",
                "start_time": datetime.utcnow().isoformat(),
                "end_time": (datetime.utcnow() + timedelta(hours=1)).isoformat()
            }
            
            if "template_id" in self.test_data:
                session_params["template_id"] = str(self.test_data["template_id"])
            
            response = self.make_request("POST", "/workout-sessions/", 
                                       token=self.tokens["alex"], 
                                       params=session_params,
                                       json=exercises_performed)
            
            if response.status_code == 200:
                session = response.json()
                if session.get("mode") == "gym":
                    self.test_data["session_id"] = session.get("id")
                    self.log("✅ Gym workout session creation successful")
                else:
                    self.log("❌ Workout session data invalid", "ERROR")
                    success = False
            else:
                self.log(f"❌ Workout session creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test create home workout session
            home_exercises = [
                {"name": "Push-ups", "sets": 3, "reps": 20},
                {"name": "Squats", "sets": 3, "reps": 25},
                {"name": "Plank", "duration_sec": 60}
            ]
            
            home_params = {
                "mode": "home",
                "notes": "Home workout - bodyweight exercises",
                "start_time": datetime.utcnow().isoformat(),
                "end_time": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
            }
            
            response = self.make_request("POST", "/workout-sessions/", 
                                       token=self.tokens["alex"], 
                                       params=home_params,
                                       json=home_exercises)
            
            if response.status_code == 200:
                session = response.json()
                if session.get("mode") == "home":
                    self.log("✅ Home workout session creation successful")
                else:
                    self.log("❌ Home workout session data invalid", "ERROR")
                    success = False
            else:
                self.log(f"❌ Home workout session creation failed: {response.status_code}", "ERROR")
                success = False
                
            # Test get workout sessions
            response = self.make_request("GET", "/workout-sessions/", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                sessions = response.json()
                if isinstance(sessions, list):
                    self.log("✅ Get workout sessions successful")
                else:
                    self.log("❌ Sessions response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get workout sessions failed: {response.status_code}", "ERROR")
                success = False
                
            # Test weekly workout stats
            response = self.make_request("GET", "/workout-sessions/stats/weekly", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                stats = response.json()
                if "total_sessions" in stats and "gym_sessions" in stats:
                    self.log("✅ Weekly workout stats successful")
                else:
                    self.log("❌ Weekly stats missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ Weekly workout stats failed: {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Workout system exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_habit_tracking(self) -> bool:
        """Test habit creation, logging, and tracking"""
        self.log("Testing habit tracking...")
        
        if "sam" not in self.tokens:
            self.log("❌ No auth token for habit tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test create habit
            response = self.make_request("POST", "/habits/", 
                                       token=self.tokens["sam"], 
                                       params={
                                           "name": "Drink 8 glasses of water",
                                           "cadence": "daily",
                                           "reminder_time_local": "08:00"
                                       })
            
            if response.status_code == 200:
                habit = response.json()
                habit_id = habit.get("id")
                if habit_id:
                    self.test_data["habit_id"] = habit_id
                    self.log("✅ Habit creation successful")
                else:
                    self.log("❌ Habit creation missing ID", "ERROR")
                    success = False
            else:
                self.log(f"❌ Habit creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test get habits
            response = self.make_request("GET", "/habits/", token=self.tokens["sam"])
            
            if response.status_code == 200:
                habits = response.json()
                if isinstance(habits, list):
                    self.log("✅ Get habits successful")
                else:
                    self.log("❌ Habits response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get habits failed: {response.status_code}", "ERROR")
                success = False
                
            # Test create habit log
            if "habit_id" in self.test_data:
                habit_id = self.test_data["habit_id"]
                log_data = {
                    "log_date": date.today().isoformat(),
                    "status": "done",
                    "notes": "Completed successfully!"
                }
                
                response = self.make_request("POST", f"/habits/{habit_id}/logs", 
                                           token=self.tokens["sam"], json=log_data)
                
                if response.status_code == 200:
                    log = response.json()
                    if log.get("status") == "done":
                        self.log("✅ Habit log creation successful")
                    else:
                        self.log("❌ Habit log data invalid", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Habit log creation failed: {response.status_code} - {response.text}", "ERROR")
                    success = False
                    
            # Test update habit
            if "habit_id" in self.test_data:
                habit_id = self.test_data["habit_id"]
                
                response = self.make_request("PATCH", f"/habits/{habit_id}", 
                                           token=self.tokens["sam"], 
                                           params={
                                               "name": "Drink 10 glasses of water",
                                               "reminder_time_local": "09:00"
                                           })
                
                if response.status_code == 200:
                    updated_habit = response.json()
                    if updated_habit.get("name") == "Drink 10 glasses of water":
                        self.log("✅ Habit update successful")
                    else:
                        self.log("❌ Habit not updated correctly", "ERROR")
                        success = False
                else:
                    self.log(f"❌ Habit update failed: {response.status_code}", "ERROR")
                    success = False
                    
            # Test get habit logs
            response = self.make_request("GET", "/habits/logs", token=self.tokens["sam"])
            
            if response.status_code == 200:
                logs = response.json()
                if isinstance(logs, list):
                    self.log("✅ Get habit logs successful")
                else:
                    self.log("❌ Habit logs response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get habit logs failed: {response.status_code}", "ERROR")
                success = False
                
            # Test weekly habit stats
            response = self.make_request("GET", "/habits/stats/weekly", 
                                       token=self.tokens["sam"])
            
            if response.status_code == 200:
                stats = response.json()
                if "active_habits" in stats and "completion_rate" in stats:
                    self.log("✅ Weekly habit stats successful")
                else:
                    self.log("❌ Weekly habit stats missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ Weekly habit stats failed: {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Habit tracking exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_progress_tracking(self) -> bool:
        """Test progress snapshots and partner progress sharing"""
        self.log("Testing progress tracking...")
        
        if "alex" not in self.tokens:
            self.log("❌ No auth token for progress tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test create progress snapshot
            metrics = {
                "weight_kg": 75.5,
                "bodyfat_pct": 15.2,
                "waist_cm": 85.0,
                "workouts_completed_week": 4,
                "habits_completed_week": 6
            }
            
            response = self.make_request("POST", "/progress/snapshots", 
                                       token=self.tokens["alex"], 
                                       params={"snapshot_date": date.today().isoformat()},
                                       json=metrics)
            
            if response.status_code == 200:
                snapshot = response.json()
                if "metrics" in snapshot and snapshot["metrics"].get("weight_kg") == 75.5:
                    self.log("✅ Progress snapshot creation successful")
                else:
                    self.log("❌ Progress snapshot data invalid", "ERROR")
                    success = False
            else:
                self.log(f"❌ Progress snapshot creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test get progress snapshots
            response = self.make_request("GET", "/progress/snapshots", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                snapshots = response.json()
                if isinstance(snapshots, list):
                    self.log("✅ Get progress snapshots successful")
                else:
                    self.log("❌ Progress snapshots response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get progress snapshots failed: {response.status_code}", "ERROR")
                success = False
                
            # Test progress summary
            response = self.make_request("GET", "/progress/summary", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                summary = response.json()
                if "current" in summary:
                    self.log("✅ Progress summary successful")
                else:
                    self.log("❌ Progress summary missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ Progress summary failed: {response.status_code}", "ERROR")
                success = False
                
            # Test partner progress (should fail if no permissions set)
            response = self.make_request("GET", "/progress/partner", 
                                       token=self.tokens["alex"])
            
            # This might fail if Alex doesn't have a partner or permissions aren't set
            # That's expected behavior, so we'll just log the result
            if response.status_code == 200:
                self.log("✅ Partner progress access successful")
            elif response.status_code in [403, 404]:
                self.log("✅ Partner progress correctly restricted (expected)")
            else:
                self.log(f"❌ Partner progress unexpected status: {response.status_code}", "ERROR")
                success = False
                
        except Exception as e:
            self.log(f"❌ Progress tracking exception: {e}", "ERROR")
            success = False
            
        return success
        
    def test_data_sharing(self) -> bool:
        """Test data sharing permissions between users"""
        self.log("Testing data sharing system...")
        
        if "alex" not in self.tokens or "sam" not in self.tokens:
            self.log("❌ Missing auth tokens for sharing tests", "ERROR")
            return False
            
        success = True
        
        try:
            # Test create share permissions (Alex shares with Sam)
            permission_data = {
                "viewer_email": "sam@example.com",
                "can_view_progress": True,
                "can_view_habits": False
            }
            
            response = self.make_request("POST", "/share/permissions", 
                                       token=self.tokens["alex"], json=permission_data)
            
            if response.status_code == 200:
                permission = response.json()
                if permission.get("can_view_progress") == True:
                    self.test_data["permission_id"] = permission.get("id")
                    self.log("✅ Share permission creation successful")
                else:
                    self.log("❌ Share permission data invalid", "ERROR")
                    success = False
            else:
                self.log(f"❌ Share permission creation failed: {response.status_code} - {response.text}", "ERROR")
                success = False
                
            # Test get share permissions
            response = self.make_request("GET", "/share/permissions", 
                                       token=self.tokens["alex"])
            
            if response.status_code == 200:
                permissions = response.json()
                if "sharing_with_others" in permissions and "receiving_from_others" in permissions:
                    self.log("✅ Get share permissions successful")
                else:
                    self.log("❌ Share permissions response missing required fields", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get share permissions failed: {response.status_code}", "ERROR")
                success = False
                
            # Test get available shared data (from Sam's perspective)
            response = self.make_request("GET", "/share/available", 
                                       token=self.tokens["sam"])
            
            if response.status_code == 200:
                available = response.json()
                if isinstance(available, list):
                    self.log("✅ Get available shared data successful")
                else:
                    self.log("❌ Available shared data response not a list", "ERROR")
                    success = False
            else:
                self.log(f"❌ Get available shared data failed: {response.status_code}", "ERROR")
                success = False
                
            # Test revoke permission
            if "permission_id" in self.test_data:
                permission_id = self.test_data["permission_id"]
                response = self.make_request("DELETE", f"/share/permissions/{permission_id}", 
                                           token=self.tokens["alex"])
                
                if response.status_code == 200:
                    self.log("✅ Revoke share permission successful")
                else:
                    self.log(f"❌ Revoke share permission failed: {response.status_code}", "ERROR")
                    success = False
                    
        except Exception as e:
            self.log(f"❌ Data sharing exception: {e}", "ERROR")
            success = False
            
        return success
        
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all test suites and return results"""
        self.log("Starting comprehensive backend API tests...")
        self.log(f"Testing against: {BASE_URL}")
        
        results = {}
        
        # Run tests in order
        test_suites = [
            ("Health Check", self.test_health_check),
            ("Authentication", self.test_authentication),
            ("User Management", self.test_user_management),
            ("Couple Management", self.test_couple_management),
            ("Workout System", self.test_workout_system),
            ("Habit Tracking", self.test_habit_tracking),
            ("Progress Tracking", self.test_progress_tracking),
            ("Data Sharing", self.test_data_sharing)
        ]
        
        for suite_name, test_func in test_suites:
            self.log(f"\n{'='*50}")
            self.log(f"Running {suite_name} Tests")
            self.log(f"{'='*50}")
            
            try:
                results[suite_name] = test_func()
            except Exception as e:
                self.log(f"❌ {suite_name} test suite failed with exception: {e}", "ERROR")
                results[suite_name] = False
                
        return results
        
    def print_summary(self, results: Dict[str, bool]):
        """Print test results summary"""
        self.log(f"\n{'='*60}")
        self.log("TEST RESULTS SUMMARY")
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
            self.log("🎉 All tests passed! Backend is working correctly.")
        else:
            self.log(f"⚠️  {total - passed} test suite(s) failed. Check logs above for details.")
            
        return passed == total

def main():
    """Main test execution"""
    tester = CouplesWorkoutAPITester()
    
    try:
        results = tester.run_all_tests()
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