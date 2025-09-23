<!--
SYNC IMPACT REPORT - Constitution Update
Version change: [NEW] → 1.0.0
Added sections:
- Core Principles (5 principles based on best practices)
- Code Quality Standards
- Development Workflow
- Governance structure

Templates requiring updates:
✅ plan-template.md - Constitution Check references intact
✅ spec-template.md - No constitutional constraints needed
✅ tasks-template.md - TDD requirements align with principles
✅ commands/*.md - No agent-specific references to update

Follow-up TODOs: None - all placeholders resolved
-->

# Focus Flow iOS Constitution

## Core Principles

### I. Tidy First Philosophy
Code changes must be made through small, safe steps following Kent Beck's "Tidy First" approach. Make tidying changes before adding features when possible. Eliminate complexity rather than manage it. Use guard clauses to simplify conditional logic and create helper variables for complex expressions.

**Rationale**: Maintains code readability and reduces cognitive load for future developers working on focus/productivity features.

### II. Test-First Development (NON-NEGOTIABLE)
TDD mandatory: Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Focus on integration and end-to-end tests following the "Testing Trophy" approach. Prioritize user-facing functionality testing over isolated unit tests.

**Rationale**: Critical for iOS productivity apps where user experience reliability directly impacts user focus and workflow.

### III. Human-Centered Communication
Code is written for human communication first, machine execution second. Write clear commit messages, use descriptive variable names, and treat code reviews as knowledge sharing sessions. Optimize for maintainability and future flexibility.

**Rationale**: "Software design is an exercise in human relationships" - ensures sustainable development as the focus app evolves.

### IV. Performance-First Design
Optimize for user-centric metrics including app launch time, UI responsiveness, and battery efficiency. Use progressive enhancement and lazy loading. Measure before optimizing. Target <200ms response times for user interactions.

**Rationale**: Focus apps require minimal friction to be effective - any performance lag breaks user concentration.

### V. Dependency Discipline
Choose well-maintained libraries with active GitHub repositories, comprehensive documentation, and strong community support. Evaluate alternatives before adding new dependencies. Prefer Swift-native solutions when performance or battery life is critical.

**Rationale**: iOS ecosystem evolves rapidly; stable dependencies ensure long-term app viability and App Store compliance.

## Code Quality Standards

All code must prioritize readability and maintainability. Use Swift best practices including optionals handling, protocol-oriented programming, and memory management. Implement comprehensive error handling and logging for debugging production issues.

## Development Workflow

Follow iOS development best practices including proper MVC/MVVM architecture, Interface Builder usage, and Core Data integration patterns. Use SwiftUI for new components when targeting iOS 15+. Maintain backwards compatibility requirements based on target user base.

## Governance

Constitution supersedes all other development practices. All PRs must verify compliance with these principles. Complexity deviations must be explicitly justified with rationale. Use agent-specific guidance files (CLAUDE.md, AGENTS.md) for runtime development context that supplements but never overrides constitutional requirements.

**Version**: 1.0.0 | **Ratified**: 2025-09-23 | **Last Amended**: 2025-09-23