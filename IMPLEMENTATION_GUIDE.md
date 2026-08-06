# IMPLEMENTATION GUIDE

**Repository:** AHW Architects Global Platform (AGP)

**Document Type:** Engineering Implementation Guide

**Audience:** Human Software Engineers

**Repository Status:** Production Ready

---

# Purpose

This document explains **how to implement** the AHW Architects Global Platform using the approved repository documentation.

It is **not** a requirements document.

It does **not** define features.

It does **not** redefine architecture.

Its purpose is to ensure every engineer implements the platform consistently.

---

# Repository Philosophy

The project follows a Documentation-First methodology.

The documentation is the product specification.

The implementation is the realization of that specification.

If code conflicts with documentation, the documentation takes precedence until formally changed through governance.

---

# Before Writing Any Code

Every engineer must complete the following steps.

## Step 1

Read:

- README.md

---

## Step 2

Read every repository document in order.

00 → 15

No exceptions.

---

## Step 3

Understand:

- Business Goals
- Architecture
- Database
- API
- UI System
- Creative Direction
- Testing
- Deployment

---

## Step 4

Review:

Implementation Blueprint

Understand:

- Dependencies
- Build Order
- Milestones

---

## Step 5

Only after completing all previous steps may implementation begin.

---

# Repository Reading Order

1. README.md

2. Project Charter

3. Product Requirements Document

4. System Architecture

5. Domain Model

6. Database Design

7. API Specification

8. Software Requirements Specification

9. UI/UX Design System

10. Implementation Blueprint

11. Testing Strategy

12. Deployment & Operations

13. Public Website & CMS Extension

14. Repository Change Requests

15. Project Implementation Scope

16. Creative Direction Book

---

# Engineering Principles

Every implementation must satisfy the following principles.

## Documentation First

Never implement undocumented functionality.

---

## Architecture First

Respect all architectural boundaries.

Do not bypass layers.

---

## Domain First

Business rules belong inside the domain.

Never move business logic into controllers.

---

## Security First

Security is mandatory.

Never postpone security.

---

## Accessibility First

Accessibility is a required feature.

It is never optional.

---

## Testing First

Every feature must include tests.

---

## Maintainability First

Readable code is preferred over clever code.

---

# Project Build Order

Implementation must follow the approved sequence.

## Phase 0

Repository Validation

---

## Phase 1

Project Skeleton

---

## Phase 2

Infrastructure

---

## Phase 3

Authentication

Authorization

Identity

---

## Phase 4

Entity Management

---

## Phase 5

Project Management

---

## Phase 6

Document Management

---

## Phase 7

BOQ

---

## Phase 8

Workflow

---

## Phase 9

Notifications

---

## Phase 10

CMS

---

## Phase 11

Public Website

---

## Phase 12

Client Portal

---

## Phase 13

Vendor Portal

---

## Phase 14

Administration

---

## Phase 15

Search

Exports

---

## Phase 16

Testing

Performance

Accessibility

SEO

---

## Phase 17

Deployment

Production Validation

---

# Backend Rules

Developers shall:

- Follow the approved architecture.
- Respect service boundaries.
- Keep controllers thin.
- Place business rules inside services/domain.
- Validate all input.
- Return consistent API responses.
- Log failures.
- Never expose internal exceptions.

---

# Database Rules

Developers shall:

Never:

- Rename tables.
- Rename columns.
- Change constraints.
- Modify indexes.

Unless approved through governance.

All database changes require migration scripts.

Never edit production schemas manually.

---

# API Rules

The API Specification is authoritative.

Never:

- Create undocumented endpoints.
- Remove existing endpoints.
- Change request formats.
- Change response formats.

Without approved change requests.

---

# Frontend Rules

Frontend must follow:

- Design System
- Creative Direction
- Accessibility Rules
- Responsive Rules

Never invent layouts.

Never invent spacing systems.

Never invent typography.

Never invent colors.

---

# CMS Rules

The CMS exists to manage content.

It is not an administration replacement.

Content structure must remain consistent with the documentation.

---

# Security Rules

Every engineer is responsible for security.

Always:

Validate input.

Escape output.

Protect secrets.

Use least privilege.

Respect authorization.

Implement audit logging.

Follow approved authentication rules.

---

# Performance Rules

Every feature must consider:

Performance

Memory

Network

Rendering

Caching

Bundle Size

Core Web Vitals

Database Efficiency

---

# Testing Rules

Every feature must include:

Unit Tests

Integration Tests

End-to-End Tests (where applicable)

Regression Tests

Security Tests

Accessibility Tests

Performance Validation

No feature is complete without passing tests.

---

# Documentation Rules

Implementation must remain synchronized with documentation.

If implementation requires a documentation change:

Stop.

Raise the appropriate Change Request.

Wait for approval.

Then continue.

---

# Definition of Done

A feature is complete only when:

✓ Code Compiles

✓ Lint Passes

✓ Tests Pass

✓ Documentation Updated (if required)

✓ Security Verified

✓ Accessibility Verified

✓ Performance Verified

✓ Code Review Passed

✓ Repository Still Compliant

---

# Pull Request Checklist

Before opening a Pull Request:

- Verify architecture compliance.
- Verify API compliance.
- Verify database compliance.
- Verify Design System compliance.
- Verify Creative Direction compliance.
- Verify tests.
- Verify security.
- Verify performance.

---

# Code Review Checklist

Reviewers should verify:

Correctness

Maintainability

Performance

Security

Accessibility

Testing

Documentation

Coding Standards

Repository Compliance

---

# Things Developers Must Never Do

Never:

- Invent features.
- Guess requirements.
- Ignore documentation.
- Skip testing.
- Bypass security.
- Redesign architecture.
- Break API contracts.
- Change the database without approval.
- Ignore accessibility.
- Ignore Creative Direction.
- Merge unreviewed code.

---

# Common Implementation Mistakes

Do not:

Write code before understanding the repository.

Optimize prematurely.

Duplicate business logic.

Mix UI with domain logic.

Create hidden dependencies.

Use undocumented behavior.

Assume missing requirements.

---

# Change Request Workflow

If implementation requires change:

1. Stop development.

2. Identify affected document.

3. Create appropriate Change Request.

4. Obtain approval.

5. Update documentation.

6. Resume implementation.

---

# Engineering Standards

Every implementation should strive for:

Clarity

Consistency

Predictability

Scalability

Maintainability

Reliability

Security

Performance

Accessibility

Professional craftsmanship

---

# Final Statement

The implementation exists to faithfully realize the approved repository.

Engineers are responsible for preserving the integrity of the architecture, documentation, and user experience throughout the lifecycle of the project.