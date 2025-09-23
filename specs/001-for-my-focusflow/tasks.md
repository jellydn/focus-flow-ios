# Tasks: FocusFlow Pomodoro Timer

**Input**: Design documents from `/Users/huynhdung/src/tries/2025-09-10-tomoto-clock/focus-flow-ios/specs/001-for-my-focusflow/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single Expo project**: `src/`, `tests/` at repository root
- Core services in `src/services/`
- UI components in `src/components/` and `src/screens/`
- Tests only for logic/state (skip UI components per requirements)

## Phase 3.1: Setup
- [x] T001 Create Expo project using CLI with TypeScript template at repository root
- [x] T002 Initialize Bun package manager and configure package.json with Expo dependencies
- [x] T003 [P] Configure Biome for linting and formatting in biome.json
- [x] T004 [P] Configure Vitest for testing in vitest.config.ts
- [x] T005 [P] Set up TypeScript strict configuration in tsconfig.json
- [x] T006 [P] Configure Expo development build and notifications in app.json

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Service Contract Tests
- [ ] T007 [P] Timer service contract test in tests/unit/timer-service.test.ts
- [ ] T008 [P] Settings service contract test in tests/unit/settings-service.test.ts
- [ ] T009 [P] Cycle service contract test in tests/unit/cycle-service.test.ts
- [ ] T010 [P] History service contract test in tests/unit/history-service.test.ts

### State Machine Tests
- [ ] T011 [P] Timer state machine test in tests/unit/timer-state.test.ts
- [ ] T012 [P] Cycle state machine test in tests/unit/cycle-state.test.ts

### Integration Tests
- [ ] T013 [P] Complete Pomodoro cycle integration test in tests/integration/pomodoro-cycle.test.ts
- [ ] T014 [P] Background timer recovery integration test in tests/integration/background-timer.test.ts
- [ ] T015 [P] Notification scheduling integration test in tests/integration/notifications.test.ts
- [ ] T016 [P] Settings persistence integration test in tests/integration/settings-persistence.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Type Definitions and Models
- [ ] T017 [P] TimerSession types and interfaces in src/types/timer-session.ts
- [ ] T018 [P] PomodorocoCycle types and interfaces in src/types/pomodoro-cycle.ts
- [ ] T019 [P] UserSettings types and interfaces in src/types/user-settings.ts
- [ ] T020 [P] SessionHistory types and interfaces in src/types/session-history.ts

### Core Services
- [ ] T021 Timer service implementation in src/services/timer-service.ts
- [ ] T022 Settings service implementation in src/services/settings-service.ts
- [ ] T023 Cycle service implementation in src/services/cycle-service.ts
- [ ] T024 History service implementation in src/services/history-service.ts

### State Management
- [ ] T025 XState Store setup and configuration in src/store/index.ts
- [ ] T026 Timer state machine implementation in src/store/timer-store.ts
- [ ] T027 AsyncStorage persistence layer in src/store/persistence.ts

### Background Tasks and Notifications
- [ ] T028 Expo TaskManager background timer in src/services/background-timer.ts
- [ ] T029 Expo Notifications setup and scheduling in src/services/notification-service.ts
- [ ] T030 App state management and recovery in src/services/app-state-service.ts

## Phase 3.4: UI Components and Screens

### Core Components
- [ ] T031 [P] Timer display component in src/components/TimerDisplay.tsx
- [ ] T032 [P] Timer controls component in src/components/TimerControls.tsx
- [ ] T033 [P] Progress ring component in src/components/ProgressRing.tsx
- [ ] T034 [P] Cycle progress component in src/components/CycleProgress.tsx

### Screens
- [ ] T035 Main timer screen in src/screens/TimerScreen.tsx
- [ ] T036 Settings screen in src/screens/SettingsScreen.tsx
- [ ] T037 History/Stats screen in src/screens/HistoryScreen.tsx

### Navigation
- [ ] T038 React Navigation setup in src/navigation/AppNavigator.tsx
- [ ] T039 Navigation types and routing in src/navigation/types.ts

## Phase 3.5: Integration and Polish

### App Integration
- [ ] T040 Main App component with providers in App.tsx
- [ ] T041 Expo app configuration and permissions in app.json
- [ ] T042 Metro bundler configuration for optimization in metro.config.js

### Validation and Testing
- [ ] T043 [P] Run primary Pomodoro cycle validation from quickstart.md
- [ ] T044 [P] Run background timer accuracy validation (<±1 second over 25 min)
- [ ] T045 [P] Run notification delivery validation
- [ ] T046 [P] Run settings persistence validation
- [ ] T047 [P] Run app state recovery validation

### Performance and Quality
- [ ] T048 Memory usage optimization and validation (<50MB active, <20MB background)
- [ ] T049 App launch time optimization (<2 seconds)
- [ ] T050 [P] Run Biome linting and fix any issues
- [ ] T051 [P] Run TypeScript type checking and fix any errors

## Dependencies

### Critical Path
1. **Setup (T001-T006)** must complete before any other work
2. **All Tests (T007-T016)** must complete and FAIL before any implementation
3. **Types (T017-T020)** must complete before services
4. **Services (T021-T024)** must complete before state management
5. **State Management (T025-T027)** must complete before background tasks
6. **Background Tasks (T028-T030)** must complete before UI components
7. **Components (T031-T034)** must complete before screens
8. **Screens (T035-T037)** must complete before navigation
9. **Navigation (T038-T039)** must complete before app integration

### Parallel Opportunities
- **T003-T006**: Configuration files can be created in parallel
- **T007-T016**: All tests can be written in parallel (different files)
- **T017-T020**: All type definitions can be created in parallel
- **T031-T034**: UI components can be built in parallel
- **T043-T047**: Validation tests can run in parallel
- **T050-T051**: Code quality checks can run in parallel

## Parallel Execution Examples

### Setup Phase
```bash
# Launch T003-T006 together:
Task: "Configure Biome for linting and formatting in biome.json"
Task: "Configure Vitest for testing in vitest.config.ts"
Task: "Set up TypeScript strict configuration in tsconfig.json"
Task: "Configure Expo development build and notifications in app.json"
```

### Test Writing Phase
```bash
# Launch T007-T010 together:
Task: "Timer service contract test in tests/unit/timer-service.test.ts"
Task: "Settings service contract test in tests/unit/settings-service.test.ts"
Task: "Cycle service contract test in tests/unit/cycle-service.test.ts"
Task: "History service contract test in tests/unit/history-service.test.ts"
```

### Type Definitions Phase
```bash
# Launch T017-T020 together:
Task: "TimerSession types and interfaces in src/types/timer-session.ts"
Task: "PomodorocoCycle types and interfaces in src/types/pomodoro-cycle.ts"
Task: "UserSettings types and interfaces in src/types/user-settings.ts"
Task: "SessionHistory types and interfaces in src/types/session-history.ts"
```

## MVP Focus Notes
- Fixed timer durations (25/5/15 minutes) - no custom duration settings
- Manual session transitions only - no automatic transitions
- Settings limited to: notifications, sound, theme
- Test only state/logic - skip UI component tests
- Use Expo CLI for project creation instead of manual setup
- Vitest for testing instead of Jest
- Focus on core Pomodoro functionality for initial release

## Validation Checklist
*GATE: Checked before marking implementation complete*

- [ ] All service contracts have corresponding tests
- [ ] All entities have type definitions
- [ ] All tests written before implementation (TDD enforced)
- [ ] Parallel tasks truly independent (different files)
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
- [ ] MVP scope maintained (no custom durations, no auto-transitions)
- [ ] Constitutional requirements satisfied (TDD, performance <200ms, dependency discipline)
- [ ] Background timer accuracy ±1 second over 25 minutes
- [ ] Notification delivery works reliably
- [ ] App state recovery after force-close works correctly