# Sync Documentation with Codebase

Analyze the current codebase and synchronize documentation to reflect the actual implementation state.

## Instructions

1. **Scan the codebase**:
   - Check `/frontend` for Angular components, services, modules
   - Check `/backend` for NestJS modules, controllers, entities
   - Identify implemented features vs documented features

2. **Review documentation**:
   - Read `docs/PRD.md` - check if features match implementation
   - Read `docs/IMPLEMENTATION_PLAN.md` - check if architecture matches
   - Read `docs/PROGRESS.md` - check if status is accurate
   - Read `CLAUDE.md` - check if tech stack info is current

3. **Identify discrepancies**:
   - Features in code but not in PRD
   - Features in PRD but not implemented
   - Architecture changes not reflected in docs
   - Outdated commands or configurations

4. **Update documentation**:
   - Add missing features to PRD
   - Update architecture diagrams/descriptions
   - Fix outdated code examples
   - Update tech stack versions if changed

5. **Report changes**:
   - List all files modified
   - Summarize what was added/updated/removed
   - Suggest commit message

## Output Format

Provide a sync report:

### Documentation Sync Report

**Files Analyzed:**
- [ ] frontend/...
- [ ] backend/...

**Discrepancies Found:**
- ...

**Updates Made:**
- ...

**Suggested Commit:** `docs: sync documentation with codebase`
