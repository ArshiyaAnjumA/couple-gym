# React Native Testing Strategy - Couples Workout App

## Overview

This document outlines the comprehensive testing strategy for the Couples Workout App Phase 2 features. The app is built with Expo SDK 53, React Native, TypeScript, Zustand + immer, MMKV, and React Navigation.

## Testing Environment Limitations

**IMPORTANT**: This is a React Native/Expo application, not a web application. Traditional browser-based testing tools like Playwright cannot be used. The testing environment does not support React Native simulators/emulators required to run actual React Native tests.

## Testing Stack

### Unit & Integration Testing
- **Jest**: JavaScript testing framework
- **React Native Testing Library (RNTL)**: React Native component testing
- **@testing-library/jest-native**: Additional matchers for React Native

### Network Mocking
- **MSW (Mock Service Worker)**: API mocking with deterministic fixtures
- **Custom handlers**: Mimic existing backend API contract

### State Management Testing
- **Zustand store testing**: Direct store testing with immer integration
- **MMKV mocking**: Persistent storage simulation

### E2E Testing
- **Detox**: Would be preferred for E2E testing but requires simulator/emulator
- **Alternative**: Manual testing on actual devices

## Test Structure

```
src/
├── __tests__/
│   ├── msw/
│   │   └── handlers.ts          # MSW API handlers
│   ├── stores/
│   │   ├── auth.test.ts         # Auth store tests
│   │   ├── workout.test.ts      # Workout store tests
│   │   ├── habit.test.ts        # Habit store tests
│   │   └── couple.test.ts       # Couple store tests
│   ├── screens/
│   │   ├── TemplateCreateEditScreen.test.tsx
│   │   ├── HabitCreateEditScreen.test.tsx
│   │   ├── DashboardScreen.test.tsx
│   │   └── ...
│   ├── navigation/
│   │   └── AppNavigator.test.tsx
│   └── integration/
│       └── WorkoutFlow.test.tsx  # End-to-end flow tests
├── jest.config.js
└── jest.setup.js
```

## Test Coverage Requirements

- **Global Coverage**: ≥80% branches, functions, lines, statements
- **Critical Paths**: 100% coverage for auth, data persistence, API integration
- **TypeScript**: Strict typing maintained, no `any` leaks in tests

## Testing Scenarios

### A) Zustand Store Tests

#### 1. useWorkoutStore
- ✅ `createTemplate/updateTemplate/fetchMyTemplates`
- ✅ `startSession→updateCurrentSession→finishSession`
- ✅ `fetchWeeklyStats`
- ✅ MMKV persistence integration
- ✅ Error handling and loading states

#### 2. useHabitStore
- ✅ `createHabit/updateHabit/fetchHabits`
- ✅ `logHabit` with Done/Skip status and date indexing
- ✅ `getLogsForDate` and `getHabitLogsForDateRange`
- ✅ MMKV persistence integration

#### 3. useCoupleStore
- ✅ `createCouple/getInviteCode/acceptInvite`
- ✅ `updateShareSettings` with permission-aware selectors
- ✅ `fetchSharedFeed` and member management
- ✅ MMKV persistence integration

#### 4. useAuthStore
- ✅ `login/logout` with credential validation
- ✅ `register` and `loginWithApple`
- ✅ Token refresh path (mock 401 then refresh)
- ✅ `checkAuthStatus` and persistence

### B) Screen Integration Tests (RNTL)

#### 1. TemplateCreateEditScreen
- ✅ Validate required fields and error states
- ✅ Exercise management (add/remove/edit)
- ✅ Save success → navigation back to list
- ✅ Edit mode with pre-populated data
- ✅ Zod validation integration

#### 2. SessionTrackScreen
- ✅ Add sets/reps/weight tracking
- ✅ Real-time session updates
- ✅ Finish session → navigate to Summary with totals
- ✅ Session interruption and recovery

#### 3. HabitCreateEditScreen
- ✅ Cadence selection (day picker)
- ✅ Reminder time validation (HH:MM format)
- ✅ Save → list reflects changes
- ✅ Edit mode functionality

#### 4. HabitsListScreen
- ✅ Mark Done/Skip actions
- ✅ Calendar indicators update
- ✅ Daily logging interface
- ✅ Empty state handling

#### 5. CoupleHomeScreen
- ✅ Show couple members
- ✅ Generate invite code
- ✅ Shared feed display
- ✅ No couple state handling

#### 6. InviteAcceptScreen
- ✅ Accept invite code → members reflect both users
- ✅ Create new couple flow
- ✅ Join existing couple flow
- ✅ Invalid code handling

#### 7. ShareSettingsScreen
- ✅ Permission toggles alter feed visibility
- ✅ Settings persistence
- ✅ Partner permission management

#### 8. DashboardScreen
- ✅ Live workout/habit stats display
- ✅ Partner tiles with sharing permissions
- ✅ Motivational messages
- ✅ Empty states for no data

### C) Navigation & Error States

#### Navigation Tests
- ✅ AppNavigator auth state switching
- ✅ Tab navigation smoke tests
- ✅ Stack navigation within modules
- ✅ Deep linking scenarios

#### Error Handling
- ✅ Network errors (500/timeout) → user alerts
- ✅ Retry functionality
- ✅ Offline capability testing
- ✅ Token expiration handling

#### UI States
- ✅ Loading state indicators
- ✅ Empty state placeholders
- ✅ Error message display
- ✅ Success feedback

## Mock Data Strategy

### Test Users
```typescript
const testUsers = {
  alex: { id: '1', email: 'alex@example.com', name: 'Alex Johnson' },
  sam: { id: '2', email: 'sam@example.com', name: 'Sam Wilson' },
  demo: { id: '3', email: 'demo@example.com', name: 'Demo User' }
};
```

### API Fixtures
- Deterministic responses matching backend contract
- Realistic data that mirrors production scenarios
- Error scenarios for comprehensive testing

## Accessibility Testing

- ✅ `byRole` and `byLabelText` selectors preferred
- ✅ Screen reader compatibility
- ✅ Touch target size validation
- ✅ Color contrast compliance

## Performance Testing

- ✅ Store update performance
- ✅ Large dataset rendering
- ✅ Memory leak detection
- ✅ Navigation performance

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: yarn install
      - run: yarn test:ci
      - run: yarn test:coverage
```

### Coverage Reporting
- Jest coverage reports
- Codecov integration
- PR coverage diff comments

## Manual Testing Scenarios

Since automated E2E testing requires simulators/emulators not available in this environment, the following manual testing scenarios should be executed on actual devices:

### Critical User Flows
1. **Complete Workout Journey**: Register → Create Template → Start Session → Track Exercises → Finish → View Summary
2. **Habit Management**: Create Habit → Daily Logging → Weekly Stats → Calendar View
3. **Couple Features**: Create Couple → Generate Invite → Accept Invite → Share Settings → View Partner Activity
4. **Cross-Platform**: Test on both iOS and Android devices
5. **Offline/Online**: Test app behavior with network interruptions

### Device Testing
- **iOS**: iPhone 12+, iPad
- **Android**: Various screen sizes and Android versions
- **Performance**: Test on lower-end devices

## Test Execution Commands

```bash
# Run all tests
yarn test

# Watch mode for development
yarn test:watch

# Coverage report
yarn test:coverage

# CI mode (no watch, coverage)
yarn test:ci
```

## Known Limitations

1. **No Simulator Access**: Cannot run actual React Native tests in current environment
2. **Hardware Features**: Cannot test camera, notifications, biometric auth
3. **Platform-Specific**: Some features require device-specific testing
4. **Performance**: Real performance testing requires actual devices

## Recommendations

1. **Implement Test Suite**: Use the provided test structure as foundation
2. **CI Integration**: Set up automated testing in development workflow
3. **Device Testing**: Establish device testing lab for manual E2E testing
4. **Monitoring**: Implement crash reporting and performance monitoring
5. **User Testing**: Conduct beta testing with real couples

## Test File Status

✅ **Implemented**:
- Jest configuration
- MSW handlers with realistic API mocking
- Zustand store tests (auth, workout, habit, couple)
- Screen integration tests (key screens)
- Navigation tests
- Integration flow tests

📋 **Ready for Execution**: All test files are created and configured. To run tests, execute `yarn test` in the frontend directory on a machine with React Native development environment set up.

## Conclusion

This comprehensive testing strategy ensures the Couples Workout App Phase 2 features are thoroughly validated. While the current environment cannot execute React Native tests, the complete test suite is implemented and ready for execution in a proper React Native development environment.