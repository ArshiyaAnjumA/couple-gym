#!/usr/bin/env python3
"""
Final Verification Test for Couples Workout Backend API
Specific tests for the review request requirements
"""

import requests
import json
from datetime import datetime, date, timedelta

BASE_URL = "https://duo-fitness.preview.emergentagent.com/api"
TIMEOUT = 30

def log(message: str, level: str = "INFO"):
    """Log test messages with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_specific_authentication():
    """Test specific authentication requirements from review"""
    log("🔐 Testing specific authentication requirements...")
    
    # Test login with alex@example.com / password123
    response = requests.post(f"{BASE_URL}/auth/login", 
                           json={"email": "alex@example.com", "password": "password123"},
                           timeout=TIMEOUT)
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        
        log("✅ Login with alex@example.com successful")
        
        # Test token refresh functionality
        refresh_response = requests.post(f"{BASE_URL}/auth/refresh",
                                       json={"refresh_token": refresh_token},
                                       timeout=TIMEOUT)
        
        if refresh_response.status_code == 200:
            log("✅ Token refresh functionality working")
        else:
            log(f"❌ Token refresh failed: {refresh_response.status_code}", "ERROR")
            return False
            
        # Test user profile endpoints
        profile_response = requests.get(f"{BASE_URL}/me",
                                      headers={"Authorization": f"Bearer {access_token}"},
                                      timeout=TIMEOUT)
        
        if profile_response.status_code == 200:
            profile_data = profile_response.json()
            log(f"✅ User profile retrieved: {profile_data.get('display_name')}")
            return True
        else:
            log(f"❌ User profile retrieval failed: {profile_response.status_code}", "ERROR")
            return False
    else:
        log(f"❌ Login failed: {response.status_code}", "ERROR")
        return False

def test_core_features():
    """Test core features mentioned in review"""
    log("🏋️ Testing core features...")
    
    # Login to get token
    login_response = requests.post(f"{BASE_URL}/auth/login", 
                                 json={"email": "alex@example.com", "password": "password123"},
                                 timeout=TIMEOUT)
    
    if login_response.status_code != 200:
        log("❌ Failed to login for core features test", "ERROR")
        return False
        
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    success = True
    
    # Test workout templates
    log("Testing workout templates...")
    
    # Create template
    template_data = [
        {"name": "Bench Press", "sets": 3, "reps": 10, "weight_kg": 80.0},
        {"name": "Squats", "sets": 3, "reps": 12, "weight_kg": 100.0}
    ]
    
    create_response = requests.post(f"{BASE_URL}/workout-templates/",
                                  params={"name": "Final Test Template", "workout_type": "gym"},
                                  json=template_data,
                                  headers=headers,
                                  timeout=TIMEOUT)
    
    if create_response.status_code == 200:
        template_id = create_response.json().get("id")
        log("✅ Workout template creation successful")
        
        # List templates
        list_response = requests.get(f"{BASE_URL}/workout-templates/", headers=headers, timeout=TIMEOUT)
        if list_response.status_code == 200:
            log("✅ Workout template listing successful")
        else:
            log("❌ Workout template listing failed", "ERROR")
            success = False
            
        # Update template
        update_response = requests.patch(f"{BASE_URL}/workout-templates/{template_id}",
                                       params={"name": "Updated Final Test Template"},
                                       headers=headers,
                                       timeout=TIMEOUT)
        if update_response.status_code == 200:
            log("✅ Workout template update successful")
        else:
            log("❌ Workout template update failed", "ERROR")
            success = False
    else:
        log("❌ Workout template creation failed", "ERROR")
        success = False
    
    # Test workout sessions
    log("Testing workout sessions...")
    
    session_data = [
        {"name": "Bench Press", "sets": 3, "reps": 10, "weight_kg": 82.5},
        {"name": "Squats", "sets": 3, "reps": 12, "weight_kg": 102.5}
    ]
    
    session_params = {
        "mode": "gym",
        "notes": "Final verification test session",
        "start_time": datetime.utcnow().isoformat(),
        "end_time": (datetime.utcnow() + timedelta(hours=1)).isoformat()
    }
    
    session_response = requests.post(f"{BASE_URL}/workout-sessions/",
                                   params=session_params,
                                   json=session_data,
                                   headers=headers,
                                   timeout=TIMEOUT)
    
    if session_response.status_code == 200:
        log("✅ Workout session tracking successful")
    else:
        log("❌ Workout session tracking failed", "ERROR")
        success = False
    
    # Test habit management
    log("Testing habit management...")
    
    habit_response = requests.post(f"{BASE_URL}/habits/",
                                 params={
                                     "name": "Final Test Habit",
                                     "cadence": "daily",
                                     "reminder_time_local": "09:00"
                                 },
                                 headers=headers,
                                 timeout=TIMEOUT)
    
    if habit_response.status_code == 200:
        habit_id = habit_response.json().get("id")
        log("✅ Habit creation successful")
        
        # Log habit
        log_response = requests.post(f"{BASE_URL}/habits/{habit_id}/logs",
                                   params={
                                       "log_date": date.today().isoformat(),
                                       "status": "done",
                                       "notes": "Final verification test"
                                   },
                                   headers=headers,
                                   timeout=TIMEOUT)
        
        if log_response.status_code == 200:
            log("✅ Habit logging successful")
        else:
            log("❌ Habit logging failed", "ERROR")
            success = False
            
        # Weekly stats
        stats_response = requests.get(f"{BASE_URL}/habits/stats/weekly", headers=headers, timeout=TIMEOUT)
        if stats_response.status_code == 200:
            log("✅ Habit weekly stats successful")
        else:
            log("❌ Habit weekly stats failed", "ERROR")
            success = False
    else:
        log("❌ Habit creation failed", "ERROR")
        success = False
    
    # Test couple operations
    log("Testing couple operations...")
    
    # Get couple info (user should already be in a couple from seeded data)
    couple_response = requests.get(f"{BASE_URL}/couples/members", headers=headers, timeout=TIMEOUT)
    if couple_response.status_code == 200:
        log("✅ Couple member listing successful")
    else:
        log("❌ Couple member listing failed", "ERROR")
        success = False
    
    # Test progress tracking
    log("Testing progress tracking...")
    
    progress_data = {
        "weight_kg": 75.0,
        "bodyfat_pct": 15.0,
        "waist_cm": 85.0,
        "workouts_completed_week": 4,
        "habits_completed_week": 6
    }
    
    progress_response = requests.post(f"{BASE_URL}/progress/snapshots",
                                    params={"snapshot_date": date.today().isoformat()},
                                    json=progress_data,
                                    headers=headers,
                                    timeout=TIMEOUT)
    
    if progress_response.status_code == 200:
        log("✅ Progress tracking successful")
    else:
        log("❌ Progress tracking failed", "ERROR")
        success = False
    
    return success

def test_api_health():
    """Test API health and database connectivity"""
    log("🏥 Testing API health and database connectivity...")
    
    # Health check
    health_response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
    if health_response.status_code == 200:
        health_data = health_response.json()
        if health_data.get("status") == "healthy" and health_data.get("database") == "connected":
            log("✅ API health check passed - database connected")
            return True
        else:
            log("❌ API health check failed - database issue", "ERROR")
            return False
    else:
        log(f"❌ API health check failed: {health_response.status_code}", "ERROR")
        return False

def test_data_persistence():
    """Test data persistence by retrieving previously created data"""
    log("💾 Testing data persistence...")
    
    # Login
    login_response = requests.post(f"{BASE_URL}/auth/login", 
                                 json={"email": "alex@example.com", "password": "password123"},
                                 timeout=TIMEOUT)
    
    if login_response.status_code != 200:
        log("❌ Failed to login for persistence test", "ERROR")
        return False
        
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    success = True
    
    # Check if seeded data exists
    templates_response = requests.get(f"{BASE_URL}/workout-templates/", headers=headers, timeout=TIMEOUT)
    if templates_response.status_code == 200:
        templates = templates_response.json()
        if len(templates) > 0:
            log(f"✅ Data persistence verified - {len(templates)} workout templates found")
        else:
            log("❌ No workout templates found - data persistence issue", "ERROR")
            success = False
    else:
        log("❌ Failed to retrieve workout templates", "ERROR")
        success = False
    
    # Check habits
    habits_response = requests.get(f"{BASE_URL}/habits/", headers=headers, timeout=TIMEOUT)
    if habits_response.status_code == 200:
        habits = habits_response.json()
        if len(habits) > 0:
            log(f"✅ Data persistence verified - {len(habits)} habits found")
        else:
            log("❌ No habits found - data persistence issue", "ERROR")
            success = False
    else:
        log("❌ Failed to retrieve habits", "ERROR")
        success = False
    
    return success

def main():
    """Run final verification tests"""
    log("🚀 Starting Final Verification Test for Couples Workout Backend API")
    log(f"Testing against: {BASE_URL}")
    log("=" * 80)
    
    results = {}
    
    # Run all verification tests
    results["Authentication Flow"] = test_specific_authentication()
    results["Core Features"] = test_core_features()
    results["API Health"] = test_api_health()
    results["Data Persistence"] = test_data_persistence()
    
    # Print summary
    log("=" * 80)
    log("FINAL VERIFICATION RESULTS")
    log("=" * 80)
    
    passed = 0
    total = len(results)
    
    for test_name, success in results.items():
        status = "✅ PASSED" if success else "❌ FAILED"
        log(f"{test_name:<25} {status}")
        if success:
            passed += 1
    
    log(f"\nOverall: {passed}/{total} verification tests passed")
    
    if passed == total:
        log("🎉 ALL VERIFICATION TESTS PASSED! Backend is ready for EAS build generation.")
        log("✅ Authentication with alex@example.com working")
        log("✅ All core features functional")
        log("✅ API health confirmed")
        log("✅ Data persistence verified")
        log("✅ Sample data accessible")
        log("✅ No critical errors detected")
    else:
        log(f"⚠️  {total - passed} verification test(s) failed.")
        
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)