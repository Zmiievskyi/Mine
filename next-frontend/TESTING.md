# Testing Guide - MineGNK Next.js Frontend

Comprehensive test suite for the MineGNK static landing page built with Next.js 16, React Testing Library, and Jest.

## Test Setup

### Tech Stack

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation

### Configuration

- **jest.config.js**: Jest configuration with Next.js integration
- **jest.setup.js**: Global test setup (mocks for IntersectionObserver, MutationObserver, matchMedia)
- **Coverage thresholds**: Set to 60% for branches, functions, lines, and statements

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Suite Overview

### 1. Data Layer Tests

#### `/src/data/__tests__/pricing.test.ts`

Tests for GPU pricing data and utility functions.

**Coverage**:
- Pricing data structure validation
- Price formatting functions
- Edge cases (zero, large numbers, decimals)

**Key Tests**:
- ✓ Validates pricing array contains all GPU types (A100, H100, H200, B200)
- ✓ Ensures correct data structure for each GPU
- ✓ Tests `formatPrice()` with 2 decimal places
- ✓ Tests `formatMonthlyPrice()` with no decimals
- ✓ Handles edge cases (zero, large numbers, small decimals)

### 2. Component Tests

#### `/src/components/__tests__/LocaleHtmlLang.test.tsx`

Tests for the `LocaleHtmlLang` component that sets the HTML lang attribute.

**Coverage**:
- Sets html lang attribute on mount
- Updates lang attribute when locale changes
- Renders without visible content

**Key Tests**:
- ✓ Sets html lang attribute to provided locale
- ✓ Updates when locale prop changes
- ✓ Handles all supported locales (en, ru, zh)
- ✓ Does not render any visible content

#### `/src/components/landing/__tests__/PricingSection.test.tsx`

Tests for the pricing section component displaying GPU pricing cards.

**Coverage**:
- Section rendering with all pricing cards
- Price display formatting
- CTA buttons (Rent Now vs Contact Sales)
- Volume discount notice
- Translation integration

**Key Tests**:
- ✓ Renders section header with badge, title, subtitle
- ✓ Displays all 4 GPU pricing cards
- ✓ Shows monthly and hourly pricing correctly
- ✓ Displays "Rent Now" for available GPUs
- ✓ Displays "Contact Sales" for B200 (custom pricing)
- ✓ Renders all request-gpu links
- ✓ Shows volume discount notice
- ✓ Has correct section ID for anchor navigation

#### `/src/app/__tests__/page.simple.test.tsx`

Tests for the root page component with client-side locale redirect.

**Coverage**:
- Loading state display
- Background styling
- Animation classes

**Key Tests**:
- ✓ Renders loading state text
- ✓ Has correct background styling
- ✓ Has animate-pulse on loading text

## Test Coverage Summary

```
Test Suites: 4 passed, 4 total
Tests:       35 passed, 35 total
```

### Coverage by File

| File | % Stmts | % Branch | % Funcs | % Lines | Status |
|------|---------|----------|---------|---------|--------|
| page.tsx (root) | 100% | 50% | 100% | 100% | ✅ |
| LocaleHtmlLang.tsx | 100% | 100% | 100% | 100% | ✅ |
| PricingSection.tsx | 100% | 100% | 100% | 100% | ✅ |
| pricing.ts (data) | 100% | 100% | 100% | 100% | ✅ |

## Mocking Strategy

### next-intl

Translation functions are mocked to return translation keys or predefined strings:

```typescript
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));
```

### Navigation Components

Navigation-related components (HardLink, LanguageSwitcher) require complex window.location mocking that conflicts with jsdom. These are excluded from automated tests and should be tested manually or with E2E tests.

### UI Components

Motion/animation components are mocked to render children directly:

```typescript
jest.mock('@/components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: any) => <div>{children}</div>,
}));
```

## Testing Patterns

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

// Mock dependencies
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('displays expected content', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Data Test Template

```typescript
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('handles normal input', () => {
    expect(myFunction(1.5)).toBe('expected');
  });

  it('handles edge cases', () => {
    expect(myFunction(0)).toBe('edge case result');
  });
});
```

## Known Limitations

### Window.location Mocking

jsdom does not fully support `window.location` manipulation. Tests that require mocking navigation (HardLink, LanguageSwitcher, RequestGpuClient) have been excluded from the automated suite due to:

1. jsdom throws "Not implemented: navigation" errors
2. Complex property descriptor issues with location object
3. Tests would require significant mocking infrastructure

**Recommendation**: Use E2E tests (Playwright, Cypress) for navigation flows.

### HubSpot Form Testing

The RequestGpuClient component with HubSpot embed is excluded due to:

1. Dynamic script loading complexity
2. MutationObserver race conditions in tests
3. Iframe-based form rendering

**Recommendation**: Test HubSpot integration manually or with E2E tests.

## Adding New Tests

### For Components

1. Create test file: `src/components/__tests__/MyComponent.test.tsx`
2. Mock dependencies (next-intl, next/navigation, etc.)
3. Test rendering, props, user interactions
4. Test accessibility (roles, labels)

### For Utils/Data

1. Create test file: `src/data/__tests__/myUtil.test.ts`
2. Test happy path
3. Test edge cases (null, undefined, empty, large values)
4. Test error cases

### For Pages

1. Create test file: `src/app/__tests__/page.test.tsx`
2. Mock routing and i18n
3. Test rendering and basic functionality
4. Keep tests simple (avoid complex navigation mocking)

## Continuous Integration

Tests run on every commit. The suite should complete in under 5 seconds.

```bash
npm test -- --passWithNoTests
```

## Troubleshooting

### "Cannot redefine property: location"

This occurs when trying to mock `window.location` multiple times. Use `delete (window as any).location` before reassigning.

### "Not implemented: navigation"

This is a jsdom warning for components that trigger navigation. It's expected and doesn't affect test results for static content tests.

### Test timeouts

Increase timeout for async tests:

```typescript
await waitFor(() => {
  expect(something).toBe(true);
}, { timeout: 5000 });
```

## Future Enhancements

### Recommended Additions

1. **E2E Tests**: Playwright for navigation flows, HubSpot form integration
2. **Visual Regression**: Storybook + Chromatic for UI changes
3. **Accessibility Tests**: axe-core integration
4. **Performance Tests**: Lighthouse CI for bundle size

### Components Needing Tests

- ✅ LocaleHtmlLang
- ✅ PricingSection
- ✅ Root page (simple)
- ⏸️ HardLink (E2E recommended)
- ⏸️ LanguageSwitcher (E2E recommended)
- ⏸️ RequestGpuClient (E2E recommended)
- ⬜ HeroSection
- ⬜ FeaturesSection
- ⬜ HowItWorks
- ⬜ ManagedServices
- ⬜ FaqSection

## Summary

The test suite provides solid coverage for:

- ✅ Data layer (pricing, formatters)
- ✅ Static components (PricingSection, LocaleHtmlLang)
- ✅ Basic page rendering

For comprehensive coverage, supplement with E2E tests for navigation and form interactions.
