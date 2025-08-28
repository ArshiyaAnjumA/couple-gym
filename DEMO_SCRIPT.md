# Couples Workout App - Demo Script

## Overview
This demo script verifies all core functionality of the Couples Workout app after EAS build deployment.

## Prerequisites
- App installed via TestFlight (iOS) or Google Play Internal track (Android)
- Test accounts: `alex@example.com` / `password123` and `sam@example.com` / `password123`

---

## Demo Flow (15-20 minutes)

### 1. Registration & Login (2-3 minutes)
**Test both authentication methods:**
- **iOS**: Verify Apple Sign In button is visible and functional
- **Android**: Verify Apple Sign In is hidden, only Email/Password available
- **Both platforms**: Test email/password login with `alex@example.com` / `password123`

**Expected Results:**
✅ Successful login redirects to Dashboard  
✅ Apple Sign In visible only on iOS  
✅ Proper error handling for invalid credentials  

### 2. Dashboard Overview (2 minutes)
**Navigate to Dashboard and verify:**
- Welcome message with user's name
- Workout statistics (if any previous workouts)
- Habit completion rates
- Partner activity feed (if in a couple)
- Motivational messages for empty states

**Expected Results:**
✅ User greeting displays correctly  
✅ Stats show real data or appropriate empty states  
✅ UI responds smoothly to interactions  

### 3. Workout Template Creation (3-4 minutes)
**Create a custom workout template:**
1. Navigate to Workouts tab → Templates → "+" button
2. Fill in template details:
   - **Name**: "Demo Push Day"
   - **Description**: "Chest, shoulders, and triceps"
   - **Mode**: Select "Gym" 
3. Add exercises:
   - **Exercise 1**: "Bench Press" - 3 sets, 10 reps, 135 lbs
   - **Exercise 2**: "Push-ups" - 3 sets, 15 reps
   - **Exercise 3**: "Shoulder Press" - 3 sets, 8 reps, 95 lbs
4. Save template

**Expected Results:**
✅ Form validation works (required fields)  
✅ Can add/remove exercises dynamically  
✅ Template saves successfully  
✅ Returns to templates list with new template visible  

### 4. Workout Session Tracking (4-5 minutes)
**Complete a full workout session:**
1. From templates list, select "Demo Push Day" → "Start Workout"
2. Track exercises in real-time:
   - **Bench Press**: Log 3 sets (10, 10, 8 reps at 135 lbs)
   - **Push-ups**: Log 3 sets (15, 14, 12 reps)
   - **Shoulder Press**: Log 3 sets (8, 8, 6 reps at 95 lbs)
3. Add session notes: "Great workout, felt strong today!"
4. Finish session

**Expected Results:**
✅ Real-time session tracking interface works  
✅ Can log individual sets with different reps/weights  
✅ Session timer runs accurately  
✅ Finish redirects to summary screen  

### 5. Session Summary & Stats (1-2 minutes)
**Review completed workout:**
- Verify total duration calculation
- Check total volume (weight × reps) calculation  
- Confirm all exercises and sets logged correctly
- Return to dashboard and verify updated workout stats

**Expected Results:**
✅ Summary shows accurate totals and calculations  
✅ Dashboard reflects new workout in statistics  
✅ Data persists correctly  

### 6. Habit Creation & Logging (3 minutes)
**Set up daily habit tracking:**
1. Navigate to Habits tab → "+" button
2. Create habit:
   - **Name**: "Drink 8 glasses of water"
   - **Cadence**: Daily
   - **Reminder**: 8:00 AM
   - **Enable reminders**: Yes
3. Log today's habit:
   - Mark as "Done"
   - Add note: "Staying hydrated!"
4. Check calendar view for completion indicator

**Expected Results:**
✅ Habit creation form works with validation  
✅ Daily logging interface functions properly  
✅ Calendar shows completion indicators  
✅ Habit appears in dashboard completion rates  

### 7. Couple Management (2-3 minutes)
**Test couple functionality (if not already in couple):**
1. Navigate to Couple tab
2. Create couple or generate invite code
3. Enable data sharing:
   - **Workouts**: Enable sharing
   - **Habits**: Enable sharing  
   - **Progress**: Enable sharing
4. View shared activity feed

**Alternative (if already in couple):**
- View couple members
- Check shared activity feed
- Toggle sharing settings
- Verify partner's recent activity appears

**Expected Results:**
✅ Couple creation/invitation system works  
✅ Sharing settings control data visibility  
✅ Partner activity appears in shared feed  
✅ Privacy controls function properly  

### 8. Dashboard Final Check (1 minute)
**Return to dashboard and verify:**
- Updated workout statistics include new session
- Habit completion rate reflects today's logging
- Partner activity shows recent couple interactions
- All data reflects recent activities

**Expected Results:**
✅ All statistics updated correctly  
✅ Real-time data sync working  
✅ UI remains responsive and smooth  

---

## Cross-Platform Verification

### iOS Specific
- [ ] Apple Sign In button visible and functional
- [ ] Native iOS UI elements render correctly
- [ ] Haptic feedback works (if implemented)
- [ ] Status bar styling appropriate

### Android Specific  
- [ ] Apple Sign In button hidden completely
- [ ] Material Design elements render correctly
- [ ] Back button behavior consistent
- [ ] Navigation drawer/menu functions properly

### Both Platforms
- [ ] Email/password authentication works
- [ ] All core features function identically
- [ ] Offline state handling (if applicable)
- [ ] Performance acceptable on mid-range devices

---

## Troubleshooting

### Common Issues
**Login Problems:**
- Verify internet connection
- Check API base URL configuration
- Confirm test account credentials

**Data Not Persisting:**
- Check API connectivity
- Verify authentication token validity
- Confirm backend database is accessible

**UI/Navigation Issues:**
- Force close and restart app
- Check device compatibility
- Verify React Navigation setup

**Apple Sign In (iOS only):**
- Confirm Apple Developer account setup
- Verify app bundle identifier matches
- Check Apple Sign In capability enabled

---

## Acceptance Criteria

### ✅ Core Functionality
- [ ] User can register/login successfully
- [ ] Workout templates can be created and managed
- [ ] Workout sessions track in real-time
- [ ] Habits can be created and logged daily
- [ ] Couple features enable data sharing
- [ ] Dashboard displays accurate statistics
- [ ] All navigation flows work smoothly

### ✅ Platform Compliance
- [ ] Apple Sign In hidden on Android
- [ ] Privacy policy accessible
- [ ] Data safety requirements met
- [ ] Store listing requirements satisfied

### ✅ Performance & Quality
- [ ] App launches within 3 seconds
- [ ] No crashes during demo flow
- [ ] Smooth 60fps animations
- [ ] Proper error handling and user feedback

### ✅ Deployment Ready
- [ ] iOS build uploaded to TestFlight
- [ ] Android AAB uploaded to Play Console
- [ ] Internal testers can access and test
- [ ] All store assets and metadata ready

---

**Demo Completion Time**: 15-20 minutes  
**Test Accounts**: `alex@example.com` / `password123`, `sam@example.com` / `password123`  
**Backend API**: `https://duo-fitness.preview.emergentagent.com/api`

This demo script should be executed on both iOS and Android devices to verify cross-platform compatibility and feature parity.