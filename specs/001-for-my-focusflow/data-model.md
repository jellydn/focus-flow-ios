# Data Model: FocusFlow Pomodoro Timer

## Core Entities

### TimerSession
Represents an active or completed timing period.

**Fields**:
- `id`: string (UUID) - Unique session identifier
- `type`: 'work' | 'shortBreak' | 'longBreak' - Session type
- `duration`: number - Planned duration in seconds
- `remainingTime`: number - Current remaining time in seconds
- `status`: 'idle' | 'running' | 'paused' | 'completed' - Current session state
- `startedAt`: Date | null - When session was started
- `completedAt`: Date | null - When session was completed
- `cyclePosition`: number - Position within current cycle (1-4 for work sessions)

**Validation Rules**:
- `duration` must be within allowed ranges (work: 10-90min, breaks: 5-45min)
- `remainingTime` cannot exceed `duration`
- `startedAt` required when status is 'running' or 'paused'
- `completedAt` required when status is 'completed'
- `cyclePosition` valid only for work sessions (1-4)

**State Transitions**:
- idle → running (start timer)
- running → paused (user pause)
- paused → running (resume)
- running → completed (timer expires)
- any → idle (reset/stop)

### PomodorocoCycle
Groups 4 work sessions with their associated breaks.

**Fields**:
- `id`: string (UUID) - Unique cycle identifier
- `workSessions`: TimerSession[] - Array of 4 work sessions
- `shortBreaks`: TimerSession[] - Array of 3 short break sessions
- `longBreak`: TimerSession | null - Final long break session
- `status`: 'active' | 'completed' - Cycle completion status
- `startedAt`: Date - When cycle began
- `completedAt`: Date | null - When cycle finished

**Validation Rules**:
- `workSessions` must contain exactly 4 sessions
- `shortBreaks` must contain exactly 3 sessions
- `longBreak` required only when all work sessions completed
- `completedAt` required when status is 'completed'

### UserSettings
Stores user preferences and customizations (MVP scope).

**Fields**:
- `notificationsEnabled`: boolean - Allow local notifications (default: true)
- `soundEnabled`: boolean - Play notification sounds (default: true)
- `theme`: 'light' | 'dark' | 'system' - App theme preference (default: 'system')

**Fixed Constants (MVP)**:
- Work duration: 1500 seconds (25 minutes) - hardcoded
- Short break duration: 300 seconds (5 minutes) - hardcoded
- Long break duration: 900 seconds (15 minutes) - hardcoded
- Session transitions: Manual only (no auto-start)

**Validation Rules**:
- All boolean fields default to true except when explicitly set
- Theme must be one of the three allowed values

### SessionHistory
Records completed sessions for analytics and progress tracking.

**Fields**:
- `id`: string (UUID) - Unique record identifier
- `date`: string - Date in YYYY-MM-DD format
- `completedWorkSessions`: number - Work sessions completed this date
- `totalFocusTime`: number - Total focus time in seconds
- `completedCycles`: number - Full cycles completed
- `averageSessionDuration`: number - Average actual session length
- `createdAt`: Date - When record was created
- `updatedAt`: Date - When record was last updated

**Validation Rules**:
- `date` must be valid ISO date string
- Numeric fields must be non-negative
- `updatedAt` must be >= `createdAt`

### DailyAggregate
Long-term summary data for trend analysis.

**Fields**:
- `date`: string - Date in YYYY-MM-DD format (primary key)
- `sessionsCompleted`: number - Total sessions completed
- `focusTimeMinutes`: number - Total focus time in minutes
- `cyclesCompleted`: number - Full cycles completed
- `streakDays`: number - Consecutive days with activity

**Validation Rules**:
- `date` must be valid ISO date string
- All numeric fields must be non-negative
- Retained for 6 months maximum

## Relationships

```
UserSettings (1) ←→ (1) CurrentSession
PomodorocoCycle (1) ←→ (many) TimerSession
SessionHistory (1) ←→ (many) DailyAggregate
```

## Storage Schema

### AsyncStorage Keys
- `@focusflow:settings` - UserSettings object
- `@focusflow:currentSession` - Active TimerSession
- `@focusflow:currentCycle` - Active PomodorocoCycle
- `@focusflow:history:${date}` - SessionHistory by date
- `@focusflow:aggregates` - Array of DailyAggregate objects

### Data Persistence Strategy
- Settings: Immediate write on change
- Active session: Write on state change + every 5 seconds when running
- History: Write at session completion + daily rollup
- Aggregates: Weekly cleanup of >6 month old data

## State Machine Integration

### Timer States
```
idle → running → paused → running → completed
  ↓                                    ↓
  ←←←←←←←←←←← reset ←←←←←←←←←←←←←←←←←←←←←←
```

### Cycle States
```
workSession1 → shortBreak1 → workSession2 → shortBreak2 →
workSession3 → shortBreak3 → workSession4 → longBreak → completed
```

This data model supports all functional requirements while maintaining clean separation between active session state, user preferences, and historical analytics data.