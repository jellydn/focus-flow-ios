# FocusFlow Quickstart Guide

## Development Setup

### Prerequisites
- Node.js 18+
- Bun package manager
- Expo CLI
- iOS Simulator (Xcode) or physical iOS device

### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd focus-flow-ios

# Install dependencies with Bun
bun install

# Start Expo development server
bun expo start
```

### Project Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── services/           # Business logic (timer, settings, history)
├── store/              # XState store configuration
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── constants/          # App constants

tests/
├── integration/        # Integration tests for user flows
├── unit/              # Unit tests for services and utils
└── __mocks__/         # Test mocks
```

## User Flow Validation

### Primary Flow: Complete Pomodoro Cycle

**Test Steps:**
1. Launch app (should show timer in idle state)
2. Tap "Start" button (should begin 25-minute work session)
3. Verify timer counts down from 25:00
4. Verify progress ring updates
5. Background app (timer should continue)
6. Wait for work session to complete (or simulate completion)
7. Verify notification appears
8. Verify app transitions to 5-minute break
9. Complete break session
10. Repeat for 4 work sessions total
11. Verify long break (15 minutes) offered after 4th work session
12. Complete full cycle

**Expected Results:**
- Timer accuracy within ±1 second over 25 minutes
- Background operation maintains timer state
- Notifications appear at session transitions
- Cycle progress updates correctly (1/4, 2/4, 3/4, 4/4)
- Long break triggers after 4 work sessions
- Session history records completed sessions

### Secondary Flows

#### Settings Flow (MVP)
1. Navigate to Settings screen
2. Toggle notification preferences
3. Toggle sound preferences
4. Change theme (light/dark/system)
5. Verify settings persist across app restarts
6. Verify notification and sound changes apply to active sessions

#### Pause/Resume Flow
1. Start work session
2. Tap pause button (timer should stop)
3. Verify timer remains paused in background
4. Resume session (timer should continue from paused time)
5. Complete session normally

#### History/Analytics Flow
1. Complete multiple sessions over several days
2. Navigate to History/Stats screen
3. Verify daily session counts
4. Verify total focus time calculations
5. Verify streak tracking

## Performance Validation

### Startup Performance
- **Target**: <2 seconds from tap to interactive
- **Test**: Measure time from app launch to timer display
- **Validation**: Use Flipper or React Native performance tools

### Battery Usage
- **Target**: Minimal battery drain during background operation
- **Test**: Run 4-hour session with app backgrounded
- **Validation**: Monitor battery usage in iOS Settings

### Memory Usage
- **Target**: <50MB active, <20MB background
- **Validation**: Use Xcode Memory Graph or Flipper

### Timer Accuracy
- **Target**: ±1 second accuracy over 25-minute period
- **Test**: Compare app timer with system clock over full session
- **Validation**: Automated test with system time APIs

## Notification Testing

### Local Notifications
1. Start work session
2. Background app completely
3. Wait for session completion
4. Verify notification appears with correct message
5. Tap notification (should open app to break screen)

### Notification Permissions
1. Fresh app install
2. Start first session
3. Verify permission request appears
4. Test both "Allow" and "Don't Allow" scenarios
5. Verify graceful handling of denied permissions

## Edge Case Testing

### App State Recovery
1. Start session
2. Force-close app (swipe up from app switcher)
3. Reopen app
4. Verify session state recovered correctly
5. Verify timer continues from correct time

### System Time Changes
1. Start session
2. Change device time forward/backward
3. Verify app handles time changes gracefully
4. Verify timer accuracy not affected

### Low Power Mode
1. Enable iOS Low Power Mode
2. Start session and background app
3. Verify timer continues operation
4. Verify notifications still delivered

## Quality Gates

Before marking implementation complete, all tests must pass:

- [ ] Primary user flow completes successfully
- [ ] All customization options work within specified ranges
- [ ] Pause/resume functionality works correctly
- [ ] Background operation maintains timer state
- [ ] Notifications deliver on schedule
- [ ] Session history tracks correctly
- [ ] Performance targets met (startup <2s, memory <50MB)
- [ ] Timer accuracy within ±1 second over 25 minutes
- [ ] Edge cases handled gracefully
- [ ] Constitutional requirements satisfied (TDD, performance, dependency discipline)

## Troubleshooting

### Common Issues
- **Timer stops in background**: Check Background App Refresh settings
- **No notifications**: Verify notification permissions granted
- **Poor performance**: Check for memory leaks in timer intervals
- **State not persisting**: Verify AsyncStorage writes completing

### Development Tools
- React Native Debugger for state inspection
- Flipper for performance monitoring
- Expo Dev Tools for build management
- TypeScript compiler for type checking
- Vitest for state/logic testing
- Biome for code formatting and linting