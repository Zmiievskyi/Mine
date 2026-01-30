# MineGNK

Static landing page for Gcore's GPU mining offering on the Gonka network.

## Overview

MineGNK is a marketing landing page that allows visitors to:
- Learn about GPU mining as a service
- View GPU pricing (A100, H100, H200, B200)
- Submit rental inquiries via HubSpot forms

**Key Principle**: Fully static site with no backend. Lead capture via HubSpot.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| i18n | next-intl (EN/RU) |
| Forms | HubSpot embedded forms |
| Deployment | Static export |

## Quick Start

```bash
cd next-frontend
npm install
npm run dev      # http://localhost:3000
```

## Project Structure

```
/minegnk
├── next-frontend/          # Next.js static site
│   ├── src/
│   │   ├── app/[locale]/   # i18n routes
│   │   ├── components/
│   │   │   ├── landing/    # Page sections
│   │   │   ├── ui/         # Reusable components
│   │   │   └── icons/      # SVG icons
│   │   ├── i18n/           # Internationalization
│   │   └── lib/hooks/      # Custom hooks
│   ├── messages/           # Translations (en.json, ru.json)
│   └── out/                # Static build output
└── .claude/                # AI agent configs
```

## Available Scripts

```bash
cd next-frontend

npm run dev        # Start dev server (localhost:3000)
npm run build      # Static export to /out
npm run start      # Serve production build
```

## Environment Variables

```bash
# .env.local (development - sandbox)
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=147554099
NEXT_PUBLIC_HUBSPOT_FORM_ID=78fd550b-eec3-4958-bc4d-52c73924b87b
NEXT_PUBLIC_HUBSPOT_REGION=eu1

# .env.production (production)
NEXT_PUBLIC_HUBSPOT_PORTAL_ID=4202168
NEXT_PUBLIC_HUBSPOT_FORM_ID=2d618652-614d-45f9-97fb-b9f88a6e8cc1
NEXT_PUBLIC_HUBSPOT_REGION=eu1
```

## Landing Page Sections

1. **Hero** - Value proposition with animated badge
2. **Network Stats** - Gonka network overview (static data)
3. **Features** - Why mine with us (3 cards)
4. **How It Works** - 7-step onboarding process
5. **Managed Services** - What Gcore handles (8 cards)
6. **Pricing** - GPU tiers with HubSpot form trigger
7. **FAQ** - Common questions (7 items)
8. **Footer** - Links and copyright

## Deployment

The site is configured for static export:

```bash
npm run build    # Generates /out directory
```

Deploy the `/out` directory to any static hosting (Vercel, Netlify, S3, etc.).

## Development

### Git Workflow

```bash
# Commit message format
<type>: <short description>

# Types: feat, fix, refactor, docs, style, test, chore
```

### Code Style

- TypeScript strict mode
- React functional components
- Tailwind CSS utilities
- oklch color values for dark theme

## License

UNLICENSED - Private project
