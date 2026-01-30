# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MineGNK** is a **static landing page** for Gcore's GPU mining offering on the Gonka network.

**Key Principle**: Fully static Next.js landing page with HubSpot form integration for lead capture. No backend, no API calls.

## Architecture

```
+------------------+
| Browser          |
+--------+---------+
         |
         v
+--------+---------+
| Frontend         |
| Next.js 15       |
| Static Export    |
+------------------+
         |
         v (iframe)
+------------------+
| HubSpot Forms    |
| Lead Capture     |
+------------------+
```

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl (EN/RU)
- **Forms**: HubSpot embedded forms (EU1 region)

## Project Structure

```
/minegnk
  next-frontend/
    src/
      app/
        [locale]/           # i18n routes
          layout.tsx        # Root layout with providers
          page.tsx          # Landing page
        globals.css         # Tailwind + custom styles
      components/
        landing/            # Landing page sections
          Header.tsx
          HeroSection.tsx
          NetworkStats.tsx
          FeaturesSection.tsx
          HowItWorks.tsx
          ManagedServices.tsx
          PricingSection.tsx
          FaqSection.tsx
          Footer.tsx
        ui/                 # Reusable UI components
        icons/              # SVG icons
      i18n/                 # Internationalization config
      lib/hooks/            # Custom React hooks
    messages/               # Translation files (en.json, ru.json)
  .claude/
    agents/                 # AI agents
    skills/                 # nextjs, nextjs-anti-patterns, tailwindcss, context7
  CLAUDE.md
  README.md
```

## Core Features

### Landing Page
- **Public Access**: No authentication
- Dark theme with Tailwind CSS v4 (oklch colors)
- Sections: Hero, Stats (static), Features, How It Works, Managed Services, Pricing, FAQ
- Language switcher (EN/RU)
- **HubSpot Form Integration**: "Rent GPU" buttons open modal with embedded form

### Static Data
All data is hardcoded in components:
- Network stats (NetworkStats.tsx)
- GPU pricing (PricingSection.tsx)

## Development Commands

```bash
cd next-frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # Static export to /out
npm run start      # Serve production build
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

### Frontend (.env.local / .env.production)

HubSpot form integration:

| Environment | Portal ID | Form ID | Region |
|-------------|-----------|---------|--------|
| Sandbox (dev) | 147554099 | 78fd550b-eec3-4958-bc4d-52c73924b87b | eu1 |
| Production | 4202168 | 2d618652-614d-45f9-97fb-b9f88a6e8cc1 | eu1 |

## Key Decisions

1. **Fully Static**: No backend, no API calls, all data hardcoded
2. **Next.js 15**: App Router with static export
3. **HubSpot Integration**: External form for lead capture
4. **i18n**: next-intl with EN/RU translations
5. **Tailwind CSS v4**: All styling via utility classes with oklch colors

## Local AI Agents & Skills

### Active Agents

| Agent | Use For |
|-------|---------|
| `code-review-agent` | Code quality, security |
| `refactor-agent` | Split files, extract components |
| `testing-agent` | Unit tests |
| `project-doc-agent` | Documentation updates |

### Active Skills

| Skill | Use For |
|-------|---------|
| `context7` | Fetch library documentation |
| `nextjs` | Next.js 15+ App Router patterns, Server/Client Components |
| `nextjs-anti-patterns` | Detect/fix common Next.js mistakes |
| `tailwindcss` | Tailwind CSS v4 styling, responsive design, dark mode |
