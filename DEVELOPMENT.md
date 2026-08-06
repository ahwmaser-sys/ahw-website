# AGP Development Bootstrap

This repository is bootstrapped as a documentation-first TypeScript monorepo for the AHW Architects Global Platform.

## Phase 0 Boundary

Phase 0 provides repository structure, toolchain configuration, OpenAPI contract scaffolding, and architecture boundaries only.

Phase 0 does not include:

- Business logic
- API controllers
- Database migrations
- Authentication implementation
- UI pages
- Workflow implementation
- Third-party integrations

## Commands

```bash
corepack enable
pnpm install
pnpm check
pnpm openapi:validate
```

## Architecture Boundary

Business code belongs in provider-independent packages:

- `packages/domain`
- `packages/application`

Provider-specific code belongs behind adapters:

- `packages/adapters`

Applications and services consume application ports rather than provider SDKs directly.

## Documentation Authority

The approved documentation remains authoritative. If implementation work requires resolving a documentation conflict, stop and raise the conflict with exact document and section references.
