# Live Stats Section Component

Displays real-time Gonka network statistics on the landing page.

## Usage

```typescript
import { LiveStatsSectionComponent } from './features/landing/sections/live-stats/live-stats-section.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [LiveStatsSectionComponent],
  template: `
    <app-live-stats-section />
  `
})
export class LandingPageComponent {}
```

## Features

- 3-column grid layout (responsive: 2 columns on tablet, 1 column on mobile)
- Dark theme with purple accent (#a855f7)
- Hover effects on stat cards
- Static mock data (ready for API integration)

## Current Mock Data

1. **Latest Block**: #1635739
2. **Active Participants**: 477
3. **Registered Models**: 5

## Future API Integration

Replace mock data with real-time data from Gonka API:
- Endpoint: `http://node1.gonka.ai:8000/v1/epochs/current/participants`
- Update `LiveStatsSectionComponent.stats` array in component

## Styling

- Background: #0a0a0a (dark)
- Card border: rgba(255,255,255,0.1)
- Purple title: #a855f7
- Responsive breakpoints: 992px (tablet), 576px (mobile)

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy (h2)
- High contrast text for readability
- Focus states on interactive elements
