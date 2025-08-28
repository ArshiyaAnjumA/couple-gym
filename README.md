# Couples Workout App

A comprehensive fitness tracking app designed for couples to workout together, track habits, and share progress. Built with React Native (Expo), FastAPI, and PostgreSQL.

## 🏗️ Architecture

- **Frontend**: React Native with Expo SDK 53, TypeScript, Zustand, React Navigation
- **Backend**: FastAPI with Python, PostgreSQL, JWT Authentication
- **State Management**: Zustand with immer and MMKV persistence
- **Testing**: Jest + React Native Testing Library + MSW
- **Deployment**: EAS Build for iOS/Android

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL 15+
- Expo CLI: `npm install -g @expo/cli`
- EAS CLI: `npm install -g eas-cli`

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Database Setup**
```bash
# Install PostgreSQL (if not installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# Create database
createdb couples_workout

# Set environment variables (or use .env file)
export POSTGRES_USER=your_user
export POSTGRES_PASSWORD=your_password
export POSTGRES_DB=couples_workout
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export SECRET_KEY=your-super-secret-key-here
```

3. **Run Migrations & Seed Data**
```bash
# Apply database migrations
alembic upgrade head

# Seed with sample data (optional)
python scripts/seed.py
```

4. **Start Backend Server**
```bash
python server.py
# Server runs on http://localhost:8001
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
yarn install
# or npm install
```

2. **Environment Configuration**
```bash
# Copy example environment file
cp .env.example .env

# Update API_BASE_URL if needed (defaults to production endpoint)
# For local development, change to: http://localhost:8001/api
```

3. **Start Development Server**
```bash
yarn start
# or npm start

# Run on specific platform
yarn ios     # iOS simulator
yarn android # Android emulator
yarn web     # Web browser
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest backend_test.py -v
# Runs comprehensive backend API tests
```

### Frontend Tests
```bash
cd frontend

# Run all tests
yarn test

# Watch mode for development
yarn test:watch

# Coverage report (requires ≥80% coverage)
yarn test:coverage

# CI mode (for automated testing)
yarn test:ci
```

### Test Coverage Requirements
- **Global Coverage**: ≥80% branches, functions, lines, statements
- **Critical Paths**: 100% coverage for auth, data persistence, API integration

## 📱 EAS Build & Deployment

### Build Status
✅ **Backend**: Fully functional and tested  
✅ **Frontend**: Complete with all Phase 2 features  
✅ **Testing**: Jest + RNTL + MSW suite implemented (≥80% coverage target)  
✅ **Configuration**: EAS configuration ready  

### EAS Build URLs
> **Note**: To generate actual builds, you need to login to EAS and run the build commands below.

#### iOS Builds
- **TestFlight Build**: `eas build --platform ios --profile preview`  
- **Simulator Build**: `eas build --platform ios --profile ios-simulator`  

#### Android Builds
- **Google Play AAB**: `eas build --platform android --profile android-internal`

### Initial EAS Setup
```bash
cd frontend

# Login to Expo (create account if needed)
eas login

# Configure project (if not already done)
eas build:configure
```

### iOS Builds

#### TestFlight Build (Production)
```bash
# Build for TestFlight distribution
eas build --platform ios --profile preview

# Submit to App Store Connect (requires Apple Developer account)
eas submit --platform ios
```

#### iOS Simulator Build (Development/Testing)
```bash
# Build for iOS Simulator (no Apple Developer account required)
eas build --platform ios --profile ios-simulator

# Download and run in Xcode Simulator
```

### Android Builds

#### Google Play Internal Track
```bash
# Build AAB for Google Play
eas build --platform android --profile android-internal

# Submit to Google Play Console (requires Play Developer account)
eas submit --platform android --profile android-internal
```

### Build Profiles Configuration

- **preview**: Production builds for TestFlight/Play testing
- **ios-simulator**: iOS Simulator builds for development
- **android-internal**: Android AAB builds for Play Console Internal track

## 📊 Google Play Console Submission Checklist

### Required Store Assets

- [ ] **App Icon**: 512 × 512 px, PNG, <1024 KB
- [ ] **Feature Graphic**: 1024 × 500 px, JPG/PNG, <1 MB
- [ ] **Screenshots (Phone)**: 6-8 screenshots, 1080×1920 to 1440×2560 px
  - [ ] Login/Registration flow
  - [ ] Dashboard with stats
  - [ ] Workout creation and tracking
  - [ ] Habit management
  - [ ] Couple management and sharing
  - [ ] Progress tracking and summaries

### App Store Listing

- [ ] **App Name**: "Couples Workout"
- [ ] **Short Description** (≤80 chars): "Track workouts & habits together as a couple. Stay motivated, stay connected."
- [ ] **Full Description** (≤4000 chars): Detailed feature description
- [ ] **Category**: Health & Fitness → Fitness
- [ ] **Content Rating**: Everyone 13+ (includes user-generated content with moderation)

### Console Setup Steps

1. **Create App**: Google Play Console → Create new app → "Couples Workout"
2. **App Access**: All functions available without restrictions
3. **Ads Declaration**: Does not contain ads
4. **Content Rating**: Complete questionnaire (13+, limited UGC with user controls)
5. **Target Audience**: Ages 13 and older
6. **Data Safety**: Copy content from `/docs/data-safety.md`
7. **Privacy Policy**: Link to hosted privacy policy from `/docs/privacy-policy.md`
8. **Upload AAB**: Upload AAB file from EAS build
9. **Internal Testing**: Add test users by email, roll out to internal track
10. **Review & Release**: Submit for review, then promote through testing tracks

### Platform-Specific Features

- **iOS**: Apple Sign In available (when `APPLE_SIGN_IN_ENABLED=true`)
- **Android**: Apple Sign In hidden, Email/Password authentication only
- **Cross-platform**: All core features (workouts, habits, couples, progress) work identically

## 🔧 Development Workflow

### Code Quality
```bash
cd frontend

# TypeScript checking
yarn typecheck

# Linting
yarn lint

# Format code
yarn format
```

### State Management
- **Auth Store**: Login, registration, Apple Sign In, token management
- **Workout Store**: Template management, session tracking, statistics
- **Habit Store**: Habit CRUD, daily logging, streak tracking
- **Couple Store**: Couple creation, invites, sharing permissions

### API Integration
- All API calls use authenticated axios client with automatic token refresh
- Backend endpoints prefixed with `/api` for proper routing
- Comprehensive error handling and loading states

## 🚨 Troubleshooting

### Backend Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify database exists
psql -l | grep couples_workout

# Check connection string in .env
```

**Server Won't Start**
```bash
# Check for port conflicts
lsof -i :8001

# Verify all dependencies installed
pip install -r requirements.txt

# Check logs
tail -f backend.log
```

### Frontend Issues

**Metro Bundle Failed**
```bash
# Clear Metro cache
npx expo start --clear

# Reset node_modules
rm -rf node_modules && yarn install
```

**EAS Build Failed**
```bash
# Check EAS login status
eas whoami

# Verify app.json configuration
eas build:configure

# Check build logs in EAS dashboard
```

**Tests Not Running**
```bash
# Check test environment setup
yarn test --detectEnvironment

# Clear Jest cache
yarn test --clearCache

# Verify all test dependencies installed
yarn install
```

### iOS Specific

**Apple Sign In Not Working**
- Ensure Apple Developer account is set up
- Verify bundle identifier matches app configuration
- Check Apple Sign In capability is enabled in Xcode/EAS

**TestFlight Upload Failed**
- Verify Apple Developer Program membership
- Check bundle identifier uniqueness
- Ensure proper code signing certificates

### Android Specific

**Google Play Upload Failed**
- Verify Android app bundle is properly signed
- Check package name uniqueness in Play Console
- Ensure all required store listing information is complete

**Gradle Build Failed**
- Check Android SDK and build tools versions
- Verify Java/Kotlin compatibility
- Clear Gradle cache: `cd android && ./gradlew clean`

## 📋 Post-Deployment Checklist

### Testing on Devices
- [ ] Download app from TestFlight (iOS) and Internal track (Android)
- [ ] Complete user registration flow
- [ ] Create and track workout session
- [ ] Set up and log daily habits
- [ ] Create couple and test data sharing
- [ ] Verify Apple Sign In hidden on Android
- [ ] Test offline functionality and sync
- [ ] Verify push notifications (if implemented)

### Store Optimization
- [ ] Monitor app store ratings and reviews
- [ ] Track download and engagement metrics
- [ ] A/B test store listing descriptions and screenshots
- [ ] Update app store keywords based on performance

### User Feedback
- [ ] Set up crash reporting and analytics
- [ ] Monitor user support emails
- [ ] Track feature usage and engagement
- [ ] Plan feature updates based on user feedback

## 📖 Demo Flow Script

Complete this flow to verify all core functionality:

1. **Registration**: Create account with `demo@example.com` / `password123`
2. **Dashboard**: View empty state with motivational messages
3. **Create Workout Template**: 
   - Name: "Push Day", Mode: Gym
   - Add exercises: Bench Press, Push-ups, Shoulder Press
   - Save template
4. **Track Workout Session**:
   - Start session with "Push Day" template
   - Log sets: Bench Press 3x10 @ 135lb, Push-ups 3x15, Shoulder Press 3x8 @ 95lb
   - Finish session, view summary with total volume and duration
5. **Create Habit**:
   - Name: "Drink 8 glasses of water"
   - Cadence: Daily, Reminder: 8:00 AM
   - Save habit
6. **Log Habit**: Mark today as "Done", verify calendar indicator
7. **Create Couple**:
   - Generate invite code
   - (Optional) Test with second device/account to accept invite
   - Enable sharing for workouts and habits
8. **Dashboard Update**: Verify workout stats, habit completion, and partner tiles show

Expected completion time: 15-20 minutes

## 🔒 Security & Privacy

### Data Protection
- All API communication uses HTTPS/TLS encryption
- User passwords hashed with bcrypt
- JWT tokens with configurable expiration
- Sensitive data stored in device secure storage (iOS Keychain, Android Keystore)

### Privacy Compliance
- **Privacy Policy**: Available at `/docs/privacy-policy.md`
- **Data Safety**: Documented in `/docs/data-safety.md`
- **User Controls**: Granular data sharing permissions
- **Data Export**: Users can request data export
- **Account Deletion**: Complete data removal within 30 days

### GDPR & CCPA Compliance
- Right to access, rectify, and delete personal data
- Data portability for user data export
- Consent management for data sharing with partners
- No sale of personal information

## 📞 Support & Contact

- **App Support**: support@emergent.com
- **Privacy Questions**: dpo@emergent.com
- **Bug Reports**: GitHub Issues or support email
- **Feature Requests**: GitHub Discussions

## 📄 License

Copyright © 2024 Emergent. All rights reserved.

## ✅ Final Deployment Checklist

### Pre-Build Verification
- [x] **Backend API**: Fully functional at `https://duo-fitness.preview.emergentagent.com/api`
- [x] **Authentication**: Login with `alex@example.com` / `password123` working  
- [x] **Core Features**: Workouts, Habits, Couples, Progress tracking all operational
- [x] **Database**: PostgreSQL connected with seeded sample data
- [x] **TypeScript**: Clean compilation with no errors
- [x] **EAS Configuration**: `eas.json` and `app.json` properly configured

### Testing Status  
- [x] **Backend Testing**: All 8 comprehensive test suites passing
- [x] **Frontend Testing**: Jest + RNTL + MSW infrastructure implemented
- [x] **Type Safety**: All TypeScript compilation errors resolved
- [x] **Coverage Target**: ≥80% coverage threshold configured

### Store Readiness
- [x] **Compliance Docs**: Privacy Policy and Data Safety documentation created
- [x] **Platform Features**: Apple Sign In hidden on Android, Email/Password on both platforms  
- [x] **App Metadata**: Proper bundle identifiers and app information configured
- [x] **CI/CD**: GitHub Actions workflows configured for automated testing

### Build Generation Ready
```bash
# iOS TestFlight Build
cd frontend && eas build --platform ios --profile preview

# iOS Simulator Build (no Apple Developer account required)  
cd frontend && eas build --platform ios --profile ios-simulator

# Android Google Play AAB
cd frontend && eas build --platform android --profile android-internal
```

### Next Steps
1. **Login to EAS**: Run `eas login` in frontend directory
2. **Generate Builds**: Execute the build commands above
3. **TestFlight**: Upload iOS build to App Store Connect  
4. **Google Play**: Upload Android AAB to Play Console Internal track
5. **Test on Devices**: Verify all functionality on actual devices

---

*For additional questions or support, please contact our development team or refer to the comprehensive documentation in the `/docs` folder.*
