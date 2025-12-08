# Header Component

MineGNK landing page header with responsive design and smooth scroll navigation.

## Features

- **Sticky Header**: Fixed at top with semi-transparent background
- **Scroll Effect**: Enhanced background blur when user scrolls
- **Responsive**: Hamburger menu for mobile/tablet, full nav on desktop
- **Active Link Highlighting**: Auto-detects which section is in view
- **Smooth Scrolling**: Animated scroll to page sections
- **Modern Design**: Dark theme with purple accent colors

## Usage

```typescript
import { HeaderComponent } from './shared/components/header/header.component';

@Component({
  standalone: true,
  imports: [HeaderComponent],
  template: `
    <app-header />
    <main>
      <!-- Your page sections with IDs -->
      <section id="features">...</section>
      <section id="how-it-works">...</section>
      <section id="pricing">...</section>
      <section id="faq">...</section>
    </main>
  `
})
export class LandingComponent {}
```

## Section IDs Required

For smooth scroll and active highlighting to work, your page must have these section IDs:
- `#features`
- `#how-it-works`
- `#pricing`
- `#faq`

## Navigation Links

The header includes:
- **Logo**: "MineGNK" (links to `/`)
- **Nav Links**: Features, How it works, Pricing, FAQ (smooth scroll)
- **Sign In** button (routes to `/auth/login`)
- **Get Started** button (routes to `/auth/register`)

## Responsive Breakpoints

- **Mobile** (< 1024px): Hamburger menu
- **Desktop** (>= 1024px): Full navigation with CTA buttons

## CSS Variables Used

```scss
--dark-bg: #0a0a0a
--dark-text: #ffffff
--dark-text-muted: #888888
--accent-purple: #a855f7
```

## Accessibility Checklist

- [x] **Keyboard Navigation**: All interactive elements are keyboard accessible
- [x] **ARIA Labels**: Menu button has `aria-label="Toggle menu"`
- [x] **ARIA States**: Menu button has `aria-expanded` state
- [x] **Focus Indicators**: Native browser focus styles preserved
- [x] **Semantic HTML**: Uses `<header>`, `<nav>`, `<button>` elements
- [x] **Color Contrast**: White text on dark background meets WCAG AA
- [x] **Interactive States**: Hover, focus, and active states implemented
- [x] **Screen Reader**: Navigation structure is clear and logical

## Performance Considerations

### What's Optimized

1. **Scroll Event Throttling**: Uses Angular's HostListener (runs in NgZone)
2. **Conditional Rendering**: Mobile menu only renders when open
3. **CSS Transforms**: Uses `transform` for smooth animations (GPU-accelerated)
4. **Backdrop Filter**: Hardware-accelerated blur effect
5. **Signal-based State**: Angular signals for efficient change detection

### Potential Improvements

- Add scroll event debouncing if performance issues occur
- Use `@defer` blocks for mobile menu (Angular 17+)
- Implement `IntersectionObserver` for more efficient section detection
- Add `will-change` CSS hint for frequently animated properties

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **backdrop-filter**: Supported in all modern browsers (may not work in older browsers - graceful degradation)

## Testing Checklist

### Manual Testing

- [ ] Header stays fixed at top while scrolling
- [ ] Background blur increases after scrolling 50px
- [ ] Clicking nav links smoothly scrolls to sections
- [ ] Active link highlights based on scroll position
- [ ] Mobile menu opens/closes on hamburger click
- [ ] Mobile menu closes when clicking a nav link
- [ ] Sign In button navigates to `/auth/login`
- [ ] Get Started button navigates to `/auth/register`
- [ ] Responsive layout works on mobile, tablet, desktop

### Unit Test Structure

```typescript
describe('HeaderComponent', () => {
  it('should toggle mobile menu', () => {
    // Test mobileMenuOpen signal
  });

  it('should scroll to section on link click', () => {
    // Test scrollToSection method
  });

  it('should detect active section on scroll', () => {
    // Test onWindowScroll and isActive methods
  });

  it('should close mobile menu after navigation', () => {
    // Test closeMobileMenu method
  });
});
```

## File Structure

```
header/
├── header.component.ts      # Component logic (100 lines)
├── header.component.html    # Template (81 lines)
├── header.component.scss    # Styles (244 lines)
└── README.md               # This file
```

## Dependencies

- `@angular/core`: Component, signals, HostListener
- `@angular/common`: CommonModule
- `@angular/router`: RouterLink, RouterLinkActive
