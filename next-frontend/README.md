# MineGNK - Next.js Frontend

Static landing page for MineGNK GPU mining service, built with Next.js 15 and Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 15 with App Router
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
│   │   └── page.tsx    # Landing page
│   └── globals.css     # Tailwind + custom styles
├── components/
│   ├── landing/        # Landing page sections
│   │   ├── Header.tsx
│   │   ├── HeroSection.tsx
│   │   ├── NetworkStats.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── ManagedServices.tsx
│   │   ├── PricingSection.tsx
│   │   ├── FaqSection.tsx
│   │   └── Footer.tsx
│   ├── ui/             # Reusable UI components
│   │   ├── GridBackground.tsx
│   │   ├── HubspotModal.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── ScrollReveal.tsx
│   └── icons/          # SVG icons
├── i18n/               # Internationalization config
├── lib/hooks/          # Custom React hooks
└── messages/           # Translation files (en.json, ru.json)
```

## Environment Variables

| Variable | Description | Sandbox | Production |
|----------|-------------|---------|------------|
| `NEXT_PUBLIC_HUBSPOT_PORTAL_ID` | HubSpot Portal ID | 147554099 | 4202168 |
| `NEXT_PUBLIC_HUBSPOT_FORM_ID` | HubSpot Form ID | 78fd550b-... | 2d618652-... |
| `NEXT_PUBLIC_HUBSPOT_REGION` | HubSpot Region | eu1 | eu1 |

## Deployment

The site is configured for static export (`output: 'export'` in next.config.ts). Run `npm run build` to generate static files in the `out/` directory.
