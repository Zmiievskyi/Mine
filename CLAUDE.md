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
| Next.js 16       |
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

- **Framework**: Next.js 16 with App Router
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
          ForWho.tsx
          EfficiencySection.tsx
          HowItWorks.tsx
          ManagedServices.tsx
          ServiceAddon.tsx
          PricingSection.tsx
          FaqSection.tsx
          Footer.tsx
          LandingPageClient.tsx
        ui/                 # Reusable UI components
        icons/              # SVG icons
      data/                 # Static data
        pricing.ts
        efficiency.ts
      i18n/                 # Internationalization config
      lib/hooks/            # Custom React hooks
    messages/               # Translation files (en.json, ru.json)
    Dockerfile             # Multi-stage build
    docker-compose.yml     # Port 8000
    nginx.conf             # Static file serving
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
- Sections: Hero, Stats, Features, For Who, Efficiency, How It Works, Managed Services, Service Addon, Pricing, FAQ
- Language switcher (EN/RU)
- **HubSpot Form Integration**: "Rent GPU" buttons open modal with embedded form

### Static Data
All data is in `src/data/` folder:
- `pricing.ts` - GPU pricing data
- `efficiency.ts` - Efficiency metrics

## Development Commands

```bash
cd next-frontend
npm install
npm run dev        # http://localhost:3000
npm run build      # Static export to /out
npm run start      # Serve production build
```

## Docker Deployment

```bash
cd next-frontend
docker compose up -d --build   # Build and run on port 8000
docker compose logs -f         # View logs
docker compose down            # Stop
```

Access at **http://localhost:8000**

## Git Workflow

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

**Rules:**
- No "Generated with Claude Code" or "Co-Authored-By" lines
- Keep messages concise

## HubSpot Integration

### Configuration

Form credentials (hardcoded in `HubspotModal.tsx`):

| Portal ID | Form ID | Region |
|-----------|---------|--------|
| 4202168 | 0d64ead5-78c5-4ccb-84e3-3c088a10b212 | eu1 |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ HubspotContext (lib/contexts/HubspotContext.tsx)            │
│ - Manages modal open/close state                            │
│ - Stores selected GPU type                                  │
│ - Provides openModal(gpuType?) and closeModal()             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ HubspotModal (components/ui/HubspotModal.tsx)               │
│ - Renders modal with HubSpot form                           │
│ - Uses DECLARATIVE embed (hs-form-frame)                    │
│ - Pre-fills GPU via URL parameters                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ HubSpot Declarative Embed Script                            │
│ https://js-eu1.hsforms.net/forms/embed/{PORTAL_ID}.js       │
│ - Processes elements with class "hs-form-frame"             │
│ - Works on localhost (no domain whitelist required)         │
└─────────────────────────────────────────────────────────────┘
```

### Embed Method: Declarative (hs-form-frame)

**Why declarative instead of programmatic (v2.js)?**
- Programmatic API (`hbspt.forms.create()`) requires domain whitelist in HubSpot settings
- Returns 403 Forbidden on localhost/non-whitelisted domains
- Declarative embed works without domain restrictions

```html
<!-- Script (loaded dynamically) -->
<script src="https://js-eu1.hsforms.net/forms/embed/4202168.js" defer></script>

<!-- Form container (processed by script) -->
<div class="hs-form-frame"
     data-region="eu1"
     data-form-id="0d64ead5-78c5-4ccb-84e3-3c088a10b212"
     data-portal-id="4202168">
</div>
```

### GPU Pre-fill via URL Parameters

When user clicks "Request GPU" on a pricing card:
1. `openModal(gpuType)` is called with GPU name (e.g., "NVIDIA H100")
2. Modal adds URL parameters for HubSpot pre-fill:
   ```
   ?form_gonka_preffered_configuration=8 x H100&form_gonka_servers_number=1
   ```
3. HubSpot form reads these parameters and pre-selects the GPU field
4. On modal close, URL parameters are removed

**GPU mapping** (in `HubspotModal.tsx`):
| GPU Name Contains | HubSpot Value |
|-------------------|---------------|
| A100 | 8 x A100 |
| H100 | 8 x H100 |
| H200 | 8 x H200 |
| B200 | 8 x B200 |

### Modal Behavior

- **No unmount on close**: Modal stays in DOM, hidden via CSS (`opacity-0 invisible pointer-events-none`)
- **Form persistence**: Once loaded, form is reused for same GPU type
- **Form recreation**: If GPU type changes, form is recreated with new URL params
- **Loading states**: Shows spinner while form loads, error state with retry button

### Key Files

| File | Purpose |
|------|---------|
| `src/components/ui/HubspotModal.tsx` | Modal component with form embed |
| `src/lib/contexts/HubspotContext.tsx` | React context for modal state |
| `src/components/landing/LandingPageClient.tsx` | Provider wrapper + modal instance |
| `src/components/landing/PricingSection.tsx` | Calls `openModal(gpuName)` |

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Using v2.js programmatic API | Use declarative embed (hs-form-frame) |
| Form not loading | Script blocked or timeout | Check network tab, retry button |
| GPU not pre-filled | URL params not set | Check `addGpuToUrlParams()` function |
| Modal won't reopen | Component unmounting | Keep modal in DOM, toggle visibility |

## Key Decisions

1. **Fully Static**: No backend, no API calls, all data hardcoded
2. **Next.js 16**: App Router with static export
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
| `nextjs` | Next.js 16 App Router patterns, Server/Client Components |
| `nextjs-anti-patterns` | Detect/fix common Next.js mistakes |
| `tailwindcss` | Tailwind CSS v4 styling, responsive design, dark mode |
