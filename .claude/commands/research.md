# Launch Hyperstack Research

Run comprehensive reverse-engineering of Hyperstack Console to document APIs, UI patterns, and data models for MineGNK implementation.

## Research Target
- Primary: https://console.hyperstack.cloud/
- Reference: https://www.hyperstack.cloud/

## Output Location
All research outputs go to `docs/research/`:
- `hyperstack-api-spec.md` - API endpoints, auth, data models
- `hyperstack-ui-spec.md` - Navigation, components, flows
- `hyperstack-db-schema.md` - Database design (from db_architect_agent)

## Instructions

### Step 1: Launch Research Coordinator
Use the `hyperstack-reverse-engineer` agent to coordinate the research. This agent will:
1. Spawn `api-research-agent` for backend analysis
2. Spawn `webui-research-agent` for frontend analysis
3. Synthesize findings into unified specification

### Step 2: Research Scope
Cover these Hyperstack pages (from flow_hyperstack.md):
- Dashboard / Welcome
- Virtual Machines (list, create wizard, detail)
- Kubernetes
- Volumes, Environments, Key Pairs
- Firewalls, Deployments, Snapshots, Images
- Billing, Organization, API Keys, Support

### Step 3: Save Outputs
After research completes, save results:
```
docs/research/
├── hyperstack-api-spec.md      # Full API specification
├── hyperstack-ui-spec.md       # UI/UX specification
├── hyperstack-db-schema.md     # Database schema (run db_architect_agent)
└── hyperstack-full-spec.md     # Combined specification
```

### Step 4: Update PRD
After research, update `docs/PRD.md` with any new findings:
- Missing features discovered
- Correct API patterns
- UI flows to replicate

## Safety Reminders
- Never output real credentials - use `<REDACTED>`
- Don't create/delete costly resources (VMs, GPUs)
- Respect rate limits
- Mark assumptions vs observations

## Execution
To start, invoke the hyperstack-reverse-engineer agent with Task tool:
```
Task: subagent_type=hyperstack-reverse-engineer
```
