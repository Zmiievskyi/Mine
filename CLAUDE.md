# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MineGNK** is a **static landing page** for Gcore's GPU mining offering on the Gonka network.

**Key Principle**: Fully static Angular landing page with HubSpot form integration for lead capture. No backend, no API calls.

## Architecture

```
+------------------+
| Browser          |
+--------+---------+
         |
         v
+--------+---------+
| Frontend         |
| Angular 21       |
| Static Landing   |
+------------------+
         |
         v (iframe)
+------------------+
| HubSpot Forms    |
| Lead Capture     |
+------------------+
```

## Tech Stack

- **Frontend**: Angular 21 with Tailwind CSS v4
- **Forms**: HubSpot embedded forms (EU1 region)
- **i18n**: Custom i18n service with EN/RU support
- **Cookies**: ngx-cookieconsent

**For Angular/Frontend patterns, see the `angular` skill** (loaded automatically).

## Project Structure

```
/minegnk
  frontend/
    src/app/
      core/
        i18n/               # Translations (en.ts, ru.ts)
        services/           # notification, storage
      features/
        landing/            # Main landing page
          components/       # Hero, pricing, FAQ, etc.
        legal/              # Terms pages
      shared/
        directives/         # scroll-reveal
        components/         # loading-spinner
        utils/              # debounce
    environments/           # HubSpot config
  .claude/
    agents/                 # AI agents
    skills/                 # angular, context7
  CLAUDE.md
  README.md
```

## Core Features

### Landing Page
- **Public Access**: No authentication
- Dark theme with Tailwind CSS v4
- Sections: Hero, Stats (static), Features, How It Works, Managed Services, Pricing, FAQ
- Language switcher (EN/RU)
- **HubSpot Form Integration**: "Rent GPU" buttons open modal with embedded form

### Static Data
All data is hardcoded in components:
- Network stats (network-stats.component.ts)
- GPU pricing (pricing-section.component.ts)

## Development Commands

```bash
cd frontend
npm install
npm start          # http://localhost:4200
npm run build      # Production build
```

## Git Workflow

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Rules:**
- No "Generated with Claude Code" or "Co-Authored-By" lines
- Keep messages concise

## Environment Variables

### Frontend (environment.ts / environment.prod.ts)

HubSpot form integration:

| Environment | Portal ID | Form ID | Region |
|-------------|-----------|---------|--------|
| Sandbox (dev) | 147554099 | 78fd550b-eec3-4958-bc4d-52c73924b87b | eu1 |
| Production | 4202168 | 2d618652-614d-45f9-97fb-b9f88a6e8cc1 | eu1 |

## Key Decisions

1. **Fully Static**: No backend, no API calls, all data hardcoded
2. **HubSpot Integration**: External form for lead capture
3. **i18n**: Custom service with EN/RU translations
4. **Tailwind CSS v4**: All styling via utility classes
5. **Angular 21**: Standalone components, signals, new control flow

## Local AI Agents & Skills

### Active Agents

| Agent | Use For |
|-------|---------|
| `code-review-agent` | Code quality, security |
| `refactor-agent` | Split files, extract templates |
| `angular-frontend-agent` | Angular components |
| `testing-agent` | Unit tests |
| `project-doc-agent` | Documentation updates |

### Active Skills

| Skill | Use For |
|-------|---------|
| `angular` | Angular patterns |
| `context7` | Fetch library documentation |
