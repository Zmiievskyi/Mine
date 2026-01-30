# MineGNK - Next.js Frontend

Static landing page for MineGNK GPU mining service, built with Next.js 16 and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl (EN/RU)
- **Forms**: HubSpot embedded forms

## Development

```bash
npm install
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Production build (static export)
npm run start     # Serve production build
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/       # i18n routes
│   │   ├── layout.tsx  # Root layout with providers
│   │   ├── page.tsx    # Landing page
│   │   ├── error.tsx   # Error boundary
│   │   └── not-found.tsx # 404 page
│   └── globals.css     # Tailwind + custom styles
├── components/
│   ├── landing/        # Landing page sections
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── NetworkStats.tsx
│   │   ├── EfficiencySection.tsx
│   │   ├── ForWho.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ManagedServices.tsx
│   │   ├── PricingSection.tsx
│   │   ├── ServiceAddon.tsx
│   │   ├── FaqSection.tsx
│   │   ├── Footer.tsx
│   │   └── LandingPageClient.tsx
│   ├── ui/             # Reusable UI components
│   └── icons/          # SVG icons
├── data/               # Static data
│   ├── pricing.ts      # GPU pricing
│   └── efficiency.ts   # Efficiency metrics
├── i18n/               # Internationalization config
├── lib/hooks/          # Custom React hooks
└── messages/           # Translation files (en.json, ru.json)
```

## HubSpot Integration

Form configuration is hardcoded in `src/components/ui/HubspotModal.tsx`:

| Portal ID | Form ID | Region |
|-----------|---------|--------|
| 4202168 | 0d64ead5-78c5-4ccb-84e3-3c088a10b212 | eu1 |

## Deployment

### Static Export

The site is configured for static export (`output: 'export'` in next.config.ts). Run `npm run build` to generate static files in the `out/` directory.

### Docker

```bash
docker compose up -d --build   # Build and run on port 8000
docker compose logs -f         # View logs
docker compose down            # Stop
```

Access at http://localhost:8000
