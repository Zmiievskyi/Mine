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
- **Animations**: Motion (Framer Motion)
- **i18n**: next-intl (EN/RU/ZH)
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
          request-gpu/      # HubSpot form page
            page.tsx
            RequestGpuClient.tsx
        globals.css         # Tailwind + custom styles
      components/
        landing/            # Landing page sections
          Header.tsx
          HeroSection.tsx
          FeaturesSection.tsx
          ForWho.tsx
          EfficiencySection.tsx
          HowItWorks.tsx
          ManagedServices.tsx
          ServiceAddon.tsx
          PricingSection.tsx
          FaqSection.tsx
          Footer.tsx
        ui/                 # Reusable UI components
          MotionReveal.tsx  # Scroll-triggered animations
          NetworkStatus.tsx # Live network status monitoring
        icons/              # SVG icons
      data/                 # Static data
        pricing.ts
        efficiency.ts
      i18n/                 # Internationalization config
      lib/hooks/            # Custom React hooks
    messages/               # Translation files (en.json, ru.json, zh.json)
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
- Language switcher (EN/RU/ZH)
- **HubSpot Form Integration**: "Rent GPU" buttons open modal with embedded form
- **Network Status Monitoring**: Live Gonka network status ticker in header

### Static Data
All data is in `src/data/` folder:
- `pricing.ts` - GPU pricing data
- `efficiency.ts` - Efficiency metrics

### Design System

**Typography**
- `font-heading` (Outfit) - Used for all h1/h2 headings
- `font-body` (Inter) - Body text

**CSS Utilities** (in `globals.css`):
- `.cta-glow` - Pulsing glow animation for CTAs
- `.glass-card` - Glass morphism card effect
- `.text-gradient` - Orange gradient text
- `.page-grid` - Subtle background grid pattern

**Animation Components** (`ui/MotionReveal.tsx`):
- `MotionReveal` - Scroll-triggered fade-in with direction
- `MotionStagger` - Container for staggered child animations
- `MotionItem` - Child item for stagger animations
- `MotionScale` - Scale-up animation on scroll

**Network Status Component** (`ui/NetworkStatus.tsx`):
- Live monitoring of Gonka blockchain network
- Real-time metrics: block height, block age, current epoch
- Auto-refresh every 20 seconds with manual refresh option
- Status indicators: Live (green), Syncing (amber), Stale (red), Unknown (gray)
- Responsive design with progressive metric hiding on smaller screens
- Hydration-safe (renders placeholders during SSR)

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

Form credentials (hardcoded in `RequestGpuClient.tsx`):

| Portal ID | Form ID | Region |
|-----------|---------|--------|
| 4202168 | 0d64ead5-78c5-4ccb-84e3-3c088a10b212 | eu1 |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ PricingSection                                              │
│ - "Request GPU" buttons link to /request-gpu?gpu=...        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ /request-gpu page (RequestGpuClient.tsx)                    │
│ - Dedicated page with HubSpot form                          │
│ - Reads ?gpu= param and pre-fills form                      │
│ - Uses DECLARATIVE embed (hs-form-frame)                    │
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
1. User is navigated to `/request-gpu?gpu=NVIDIA%20H100`
2. `RequestGpuClient` reads the `gpu` param and calls `addGpuToUrlParams()`
3. URL is updated with HubSpot pre-fill params:
   ```
   /request-gpu?gpu=NVIDIA%20H100&form_gonka_preffered_configuration=8%20x%20H100&form_gonka_servers_number=1
   ```
4. HubSpot form reads these parameters and pre-selects the GPU field

**GPU mapping** (in `RequestGpuClient.tsx`):
| GPU Name Contains | HubSpot Value |
|-------------------|---------------|
| A100 | 8 x A100 |
| H100 | 8 x H100 |
| H200 | 8 x H200 |
| B200 | 8 x B200 |

### Page Behavior

- **Dedicated page**: Form lives at `/[locale]/request-gpu`
- **Loading states**: Shows spinner while form loads, error state with retry button
- **Form recreation**: Uses MutationObserver to detect when form is ready
- **Timeout**: 10-second timeout triggers error state with retry option

### Key Files

| File | Purpose |
|------|---------|
| `src/app/[locale]/request-gpu/page.tsx` | Server component, sets locale |
| `src/app/[locale]/request-gpu/RequestGpuClient.tsx` | Client component with form logic |
| `src/components/landing/PricingSection.tsx` | Links to `/request-gpu?gpu=...` |

### Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Using v2.js programmatic API | Use declarative embed (hs-form-frame) |
| Form not loading | Script blocked or timeout | Check network tab, retry button |
| GPU not pre-filled | URL params not set | Check `addGpuToUrlParams()` function |
| Form stuck loading | MutationObserver not triggering | Check if form/iframe element exists |

## Network Status Monitoring

### Overview
Live network status ticker integrated into the header that displays real-time Gonka blockchain metrics.

### API Endpoints

| Endpoint | Purpose | Data Used |
|----------|---------|-----------|
| `https://node4.gonka.ai/chain-rpc/status` | Chain status | Block height, block time, catching_up flag |
| `https://node4.gonka.ai/v1/epochs/current/participants` | Epoch data | Current epoch ID from `active_participants.epoch_id` |

**Note**: Both endpoints support CORS without proxy requirements.

### Status Logic

| Status | Condition | Indicator Color |
|--------|-----------|-----------------|
| Live | Block age ≤ 120s AND not catching up | Green (emerald) |
| Syncing | Chain is catching up | Amber |
| Stale | Block age > 120s | Red |
| Unknown | API error or no data | Gray (zinc) |

### Features

- **Auto-refresh**: Polls every 20 seconds
- **Manual refresh**: Refresh button with loading animation
- **Responsive metrics**: Progressively hidden on smaller screens
  - Mobile: Status indicator only
  - sm (640px+): + Block height
  - md (768px+): + Block age
  - lg (1024px+): + Epoch
- **Animated status indicator**: Pulsing dot with color-coded states
- **Last updated time**: Shows when data was last fetched
- **Hydration-safe**: No layout shift during SSR/client hydration

### Integration

Located in Header component as a sub-header strip below the main navigation bar.

```tsx
<header className="sticky top-0 inset-x-0 w-full z-50">
  {/* Main Navigation Bar */}
  <div className="h-14 bg-background/80 backdrop-blur-md border-b border-border/50">
    {/* Navigation content */}
  </div>

  {/* Network Status Strip */}
  <NetworkStatus />
</header>
```

### Testing

Full test coverage available at `src/components/ui/__tests__/NetworkStatus.test.tsx`:
- API response parsing
- Status logic validation
- Responsive behavior
- Error handling
- Auto-refresh functionality

### Key Files

| File | Purpose |
|------|---------|
| `src/components/ui/NetworkStatus.tsx` | Network status component |
| `src/components/landing/Header.tsx` | Integration point (includes NetworkStatus) |
| `src/components/ui/__tests__/NetworkStatus.test.tsx` | Unit tests |

## Key Decisions

1. **Fully Static**: No backend, no API calls (except client-side network status), all data hardcoded
2. **Next.js 16**: App Router with static export
3. **HubSpot Integration**: External form for lead capture
4. **i18n**: next-intl with EN/RU/ZH translations
5. **Tailwind CSS v4**: All styling via utility classes with oklch colors
6. **Network Monitoring**: Client-side API calls to Gonka network (CORS-enabled, no proxy needed)

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
| `context7` | Fetch library documentation (Motion, Next.js, etc.) |
| `nextjs` | Next.js 16 App Router patterns, Server/Client Components |
| `nextjs-anti-patterns` | Detect/fix common Next.js mistakes |
| `tailwindcss` | Tailwind CSS v4 styling, responsive design, dark mode |
| `frontend-design` | UI/UX improvements, visual polish |
