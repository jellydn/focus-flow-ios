
# Implementation Plan: FocusFlow Pomodoro Timer

**Branch**: `001-for-my-focusflow` | **Date**: 2025-09-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/Users/huynhdung/src/tries/2025-09-10-tomoto-clock/focus-flow-ios/specs/001-for-my-focusflow/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Primary requirement: Build a minimalist Pomodoro timer for iOS that supports standard 25/5/15 minute cycles, background operation, local notifications, and user customization. Focus on MVP with Expo/React Native cross-platform approach using TypeScript, Bun package management, and XState for state management.

## Technical Context
**Language/Version**: TypeScript 5.x with React Native via Expo SDK 49+
**Primary Dependencies**: Expo, React Native, XState Store, Expo Notifications, AsyncStorage
**Storage**: AsyncStorage for local persistence (settings, session history)
**Testing**: Vitest (logic/state testing only, skip UI components per requirements)
**Target Platform**: iOS 15+ (primary), Android potential secondary target
**Project Type**: mobile - single cross-platform app structure
**Performance Goals**: <200ms UI response times, <2s app launch, minimal battery impact
**Constraints**: Background timing accuracy ±1s over 25min, offline-capable, <50MB memory
**Scale/Scope**: Single-user local app, ~10 screens, personal productivity focus

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**I. Tidy First Philosophy**: ✅ PASS
- Plan follows small, safe incremental steps (Phase 0 → 1 → 2)
- Complexity elimination prioritized through MVP focus
- Clear separation of concerns in project structure

**II. Test-First Development (NON-NEGOTIABLE)**: ✅ PASS
- TDD mandatory enforced through contract tests before implementation
- Integration tests planned for user-facing functionality
- Logic-focused testing aligns with constitutional requirements

**III. Human-Centered Communication**: ✅ PASS
- Clear variable naming conventions in technical context
- Code as communication principle embedded in development workflow
- Descriptive commit message requirements maintained

**IV. Performance-First Design**: ✅ PASS
- <200ms response time targets specified
- Background timing accuracy requirements defined
- Battery efficiency and memory constraints documented

**V. Dependency Discipline**: ✅ PASS
- Well-maintained libraries chosen (Expo, XState, React Native)
- Strong ecosystem support and documentation available
- React Native cross-platform approach balances capability with maintainability

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1 - Single project (Expo React Native app with unified structure)

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data-model.md, quickstart.md)
- Each service contract → contract test + implementation task [P for tests]
- Each entity from data-model.md → type definition + validation task [P]
- User stories from quickstart.md → integration test task
- TDD order: Tests before implementation for all service logic

**Expo/React Native Specific Tasks**:
- Project setup: Expo init, Bun configuration, TypeScript setup
- XState Store setup: Timer state machine, persistence integration
- Service implementations: Timer, Settings, Cycle, History services
- Background tasks: Expo TaskManager, notification scheduling
- UI components: Timer display, controls, settings screens (no UI tests per requirements)
- Integration tests: Full user flows from quickstart.md

**Ordering Strategy**:
- Setup → Service tests → Service implementations → Store setup → UI → Integration
- TDD strictly enforced for all service logic (per constitutional requirement)
- Mark [P] for parallel execution (different files, no dependencies)
- Service tests can all run in parallel before any implementation

**Estimated Output**: 28-32 numbered, ordered tasks in tasks.md

**Technology-Specific Considerations**:
- Biome configuration for linting/formatting
- Vitest setup for state/logic testing (skip UI component tests)
- AsyncStorage integration for persistence
- Expo notification permissions and scheduling
- Background timer state synchronization
- Fixed timer durations (25/5/15 minutes) for MVP simplicity
- Manual session transitions to reduce complexity

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
