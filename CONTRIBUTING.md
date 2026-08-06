# Contributing Guide

**Repository:** AHW Architects Global Platform (AGP)

Thank you for contributing to the AHW Architects Global Platform.

This project follows a **Documentation First** engineering methodology. Every contribution must align with the approved repository documentation and engineering standards.

---

# Purpose

This document explains:

- How to contribute
- Engineering expectations
- Development workflow
- Pull Request process
- Code Review process
- Repository governance

Every contributor must read this document before submitting changes.

---

# Repository Principles

All contributions must respect the following principles:

- Documentation First
- Architecture First
- Security First
- Accessibility First
- Testing First
- Maintainability First
- Performance First

---

# Before Contributing

Before writing any code, contributors must read:

1. README.md
2. IMPLEMENTATION_GUIDE.md
3. AI_IMPLEMENTATION_GUIDE.md (AI contributors only)
4. AI_ENGINEERING_CONSTITUTION.md (AI contributors only)

Then read the project documentation (00–15).

Do not begin implementation until the repository is fully understood.

---

# Branch Strategy

Never commit directly to `main`.

Use the following branch naming convention:

```
feature/<feature-name>
bugfix/<issue-name>
hotfix/<issue-name>
refactor/<module-name>
docs/<document-name>
test/<module-name>
```

Examples:

```
feature/project-dashboard

feature/client-portal

bugfix/login-timeout

docs/api-specification

refactor/notification-service
```

---

# Commit Message Convention

Use Conventional Commits.

Examples:

```
feat: add client dashboard

fix: resolve login redirect issue

docs: update API specification

refactor: simplify notification service

style: format codebase

test: add project service tests

perf: optimize database queries

chore: update dependencies
```

Avoid vague messages such as:

```
update

fix

changes

work

misc
```

---

# Pull Request Workflow

Every Pull Request must:

- Have a clear title
- Include a description
- Reference related issues (if any)
- Explain why the change is needed
- Explain what was changed
- Describe testing performed
- List any documentation updates

---

# Pull Request Checklist

Before opening a Pull Request, ensure:

- Documentation reviewed
- Architecture respected
- Database unchanged (unless approved)
- API contracts preserved
- UI follows Design System
- Accessibility verified
- Security verified
- Performance considered
- Tests added
- Tests passing
- Lint passing
- Build successful

---

# Code Style

Write code that is:

- Simple
- Readable
- Consistent
- Modular
- Reusable
- Testable

Prefer descriptive names over abbreviations.

Avoid unnecessary complexity.

---

# Code Review Expectations

Every Pull Request should be reviewed for:

- Correctness
- Architecture compliance
- Documentation compliance
- Security
- Performance
- Accessibility
- Testing
- Readability
- Maintainability

---

# Testing Requirements

Every contribution must include appropriate tests.

Depending on the change, this may include:

- Unit Tests
- Integration Tests
- End-to-End Tests
- Accessibility Tests
- Performance Validation
- Security Validation

Changes that reduce test coverage will not be accepted without approval.

---

# Documentation Requirements

If a code change affects the documented behavior:

1. Update the relevant documentation.
2. Reference the documentation update in the Pull Request.
3. Ensure the implementation and documentation remain synchronized.

Never leave documentation outdated.

---

# Security

Do not:

- Commit secrets
- Commit API keys
- Commit passwords
- Commit tokens
- Commit certificates
- Commit private credentials

Use environment variables for sensitive configuration.

Report security concerns privately.

---

# Dependencies

Before adding a dependency:

- Confirm it is actively maintained.
- Verify its license is compatible.
- Evaluate security implications.
- Avoid duplicate functionality.
- Prefer stable, well-supported libraries.

---

# Repository Governance

Contributors must not:

- Redesign approved architecture
- Change project scope
- Modify database schema without approval
- Break API contracts
- Introduce undocumented features
- Ignore accessibility requirements

Repository governance always takes precedence.

---

# Definition of Done

A contribution is complete only when:

- Code compiles successfully
- Lint passes
- Tests pass
- Documentation is updated (if required)
- Code review is approved
- Security requirements are met
- Accessibility requirements are met
- Performance expectations are met

---

# Reporting Issues

When reporting an issue, include:

- Summary
- Expected behavior
- Actual behavior
- Steps to reproduce
- Environment
- Screenshots (if applicable)
- Logs (if applicable)

Provide enough detail to reproduce the issue.

---

# Feature Requests

Feature requests should include:

- Business problem
- Proposed solution
- Alternatives considered
- Expected user impact
- Dependencies
- Risks

New features should not be implemented until approved.

---

# Communication

Keep discussions:

- Respectful
- Professional
- Constructive
- Evidence-based

Focus feedback on the implementation rather than individuals.

---

# Final Note

Every contribution should improve the project while preserving the integrity of the approved documentation, architecture, security, accessibility, and overall engineering quality.

Thank you for helping maintain the quality of the AHW Architects Global Platform.