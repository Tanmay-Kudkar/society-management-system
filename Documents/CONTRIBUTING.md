# Contributing Guide

## Branching
- Create focused feature/fix branches.
- Keep PRs small and logically grouped.

## Code Quality Gates
1. Frontend: `npm run build`
2. Backend: `.\mvnw.cmd -DskipTests compile`
3. Backend tests where applicable: `.\mvnw.cmd test`
4. Run smoke scripts for auth/role-sensitive changes.

## Implementation Rules
- Do not trust frontend URL scope as security boundary.
- Always enforce society scope on backend for reads/writes.
- In scoped mode (`MASTER_ADMIN + ?society=<id>`), UI behavior must match society-ops context.

## PR Checklist
- [ ] No cross-society leakage in scoped mode.
- [ ] Permission/role behavior validated.
- [ ] Build and tests pass.
- [ ] Docs updated in `Documents/` if behavior changed.

## Commit Message Style
- `feat: ...` new capability
- `fix: ...` bug fix
- `refactor: ...` non-functional change
- `docs: ...` documentation update
