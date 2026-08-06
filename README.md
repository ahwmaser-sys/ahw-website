# AHW Architects Global Platform (AGP)

> Design. Build. Deliver.

---

# Overview

The **AHW Architects Global Platform (AGP)** is a production-grade digital platform developed for **AHW Architects** to support the complete lifecycle of architectural and interior fit-out projects.

The repository follows a **Documentation First** methodology.

Every engineering decision, business rule, architectural pattern, user experience guideline, deployment procedure, and governance policy is documented before implementation.

This repository is the **single source of truth** for the platform.

---

# Repository Status

| Item | Status |
|-------|--------|
| Documentation | ✅ Complete |
| Repository Synchronization | ✅ Complete |
| Architecture | ✅ Approved |
| Database | ✅ Approved |
| API | ✅ Approved |
| UI/UX | ✅ Approved |
| Creative Direction | ✅ Approved |
| Security | ✅ Approved |
| Testing | ✅ Approved |
| Deployment | ✅ Approved |
| Repository Audit | ✅ Passed |
| Critical Findings | 0 |
| High Findings | 0 |
| Medium Findings | 0 |
| Production Readiness | ✅ Ready |

---

# Repository Philosophy

This repository is governed by the following principles.

- Documentation First
- Architecture First
- Security First
- Accessibility First
- Performance First
- Testing First
- Maintainability First
- Governance Before Implementation

No implementation may redefine approved documentation.

Documentation always has priority over implementation.

---

# Repository Structure

```
docs/
├── 00-Project-Charter.md
├── 01-Product-Requirements-Document.md
├── 03-System-Architecture.md
├── 04-Domain-Model.md
├── 05-Database-Design.md
├── 06-API-Specification.md
├── 07-Software-Requirements-Specification.md
├── 08-UI-UX-Design-System.md
├── 09-Implementation-Blueprint.md
├── 10-Testing-Strategy.md
├── 11-Deployment-Operations.md
├── 12-Public-Website-CMS-Extension.md
├── 13-Repository-Change-Requests.md
├── 14-Project-Implementation-Scope.md
├── 15-Creative-Direction-Book.md
```

---

# Documentation Index

## 00 — Project Charter

Defines project objectives, governance, assumptions, constraints, stakeholders, and overall vision.

---

## 01 — Product Requirements Document

Defines business requirements, product goals, capabilities, and functional expectations.

---

## 02 — Reserved

The original Business Requirements Document was intentionally retired.

Its contents were consolidated into:

- Project Charter
- Product Requirements Document

This numbering is intentionally preserved for repository history and compatibility.

---

## 03 — System Architecture

Defines the complete architectural blueprint.

---

## 04 — Domain Model

Defines business entities, relationships, aggregates, and bounded contexts.

---

## 05 — Database Design

Defines the complete database schema, constraints, indexes, and persistence model.

---

## 06 — API Specification

Defines every API contract.

---

## 07 — Software Requirements Specification

Defines detailed software requirements.

---

## 08 — UI/UX Design System

Defines visual language, components, layouts, interaction patterns, accessibility, and responsive behavior.

---

## 09 — Implementation Blueprint

Defines implementation sequencing, milestones, dependencies, risks, and execution phases.

---

## 10 — Testing Strategy

Defines all testing requirements.

---

## 11 — Deployment & Operations

Defines infrastructure, deployment, operations, monitoring, backup, and production readiness.

---

## 12 — Public Website & CMS Extension

Defines the public website and content management capabilities.

---

## 13 — Repository Change Requests

Defines approved repository-level change requests and governance-controlled baseline updates.

---

## 14 — Project Implementation Scope

Defines the authoritative implementation boundary.

---

## 15 — Creative Direction Book

Defines the visual identity, interaction philosophy, motion language, storytelling approach, and overall digital experience.

---

# Recommended Reading Order

Every engineer must follow this reading sequence.

1. README.md
2. IMPLEMENTATION_GUIDE.md
3. AI_IMPLEMENTATION_GUIDE.md *(AI only)*
4. AI_ENGINEERING_CONSTITUTION.md *(AI only)*
5. Project Documentation (00 → 15)

No implementation should begin before this sequence is completed.

---

# Repository Governance

The repository follows controlled governance.

Changes are permitted only through approved Change Requests.

Examples include:

- Architecture Change Request (ACR)
- Database Change Request (DBCR)
- API Change Request (APICR)
- Design Change Request (DCR)
- Testing Change Request (TCR)
- Operations Change Request (OCR)
- Repository Change Request (RCR)

No undocumented modification is permitted.

---

# Versioning

Documentation versions follow semantic versioning.

Example:

```
v1.0.0
```

Patch releases

```
v1.0.1
```

Minor approved additions

```
v1.1.0
```

Major repository revisions

```
v2.0.0
```

---

# Branch Strategy

Recommended Git workflow:

```
main

develop

feature/*

release/*

hotfix/*
```

The `main` branch always represents the latest approved production baseline.

---

# Implementation Principles

All implementation must respect:

- Approved Architecture
- Approved Database
- Approved APIs
- Approved Design System
- Approved Creative Direction
- Approved Testing Strategy
- Approved Deployment Strategy

Implementation exists to realize the documentation—not replace it.

---

# AI Development

Artificial Intelligence engineering assistants must comply with:

- AI_IMPLEMENTATION_GUIDE.md
- AI_ENGINEERING_CONSTITUTION.md

The repository documentation remains the sole authoritative source.

---

# Definition of Ready

Implementation may begin only when:

- Documentation is complete.
- Repository synchronization is complete.
- Repository audit has passed.
- No Critical findings remain.
- No High findings remain.

---

# Repository Status

This repository is considered:

- Approved
- Frozen
- Synchronized
- Production Ready
- Ready for AI-Assisted Implementation

---

© AHW Architects

Design • Build • Deliver