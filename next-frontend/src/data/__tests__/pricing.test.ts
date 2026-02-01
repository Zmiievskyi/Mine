import { pricing, formatPrice, formatMonthlyPrice, type GpuPricing } from '../pricing';

describe('pricing data', () => {
  it('exports an array of GPU pricing', () => {
    expect(Array.isArray(pricing)).toBe(true);
    expect(pricing.length).toBeGreaterThan(0);
  });

  it('contains expected GPU types', () => {
    const names = pricing.map((p) => p.name);
    expect(names).toContain('8x A100 Server');
    expect(names).toContain('8x H100 Server');
    expect(names).toContain('8x H200 Server');
    expect(names).toContain('8x B200 Server');
  });

  it('has valid pricing structure for each GPU', () => {
    pricing.forEach((gpu: GpuPricing) => {
      expect(gpu).toHaveProperty('name');
      expect(gpu).toHaveProperty('description');
      expect(gpu).toHaveProperty('pricePerHour');
      expect(gpu).toHaveProperty('pricePerMonth');
      expect(gpu).toHaveProperty('isContactSales');
      expect(gpu).toHaveProperty('features');
      expect(typeof gpu.name).toBe('string');
      expect(typeof gpu.description).toBe('string');
      expect(typeof gpu.isContactSales).toBe('boolean');
      expect(Array.isArray(gpu.features)).toBe(true);
    });
  });

  it('has features array for each GPU', () => {
    pricing.forEach((gpu) => {
      expect(gpu.features.length).toBeGreaterThan(0);
      gpu.features.forEach((feature) => {
        expect(typeof feature).toBe('string');
        expect(feature.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('formatPrice', () => {
  describe('with default locale (en)', () => {
    it('formats price with 2 decimal places', () => {
      expect(formatPrice(1.5)).toBe('1.50');
      expect(formatPrice(0.99)).toBe('0.99');
      expect(formatPrice(1.8)).toBe('1.80');
    });

    it('handles zero', () => {
      expect(formatPrice(0)).toBe('0.00');
    });

    it('handles large numbers with commas', () => {
      expect(formatPrice(1000)).toBe('1,000.00');
      expect(formatPrice(10000.99)).toBe('10,000.99');
    });

    it('handles whole numbers', () => {
      expect(formatPrice(100)).toBe('100.00');
    });

    it('handles very small numbers', () => {
      expect(formatPrice(0.01)).toBe('0.01');
      expect(formatPrice(0.001)).toBe('0.00');
    });
  });

  describe('with explicit en locale', () => {
    it('uses US number formatting', () => {
      expect(formatPrice(1234.56, 'en')).toBe('1,234.56');
    });
  });

  describe('with ru locale', () => {
    it('uses Russian number formatting (space as thousands separator)', () => {
      const result = formatPrice(1234.56, 'ru');
      // Russian uses non-breaking space (U+00A0) as thousands separator and comma as decimal
      expect(result).toMatch(/1[\s\u00A0]234,56/);
    });
  });

  describe('with zh locale', () => {
    it('uses Chinese number formatting', () => {
      expect(formatPrice(1234.56, 'zh')).toBe('1,234.56');
    });
  });

  describe('with unknown locale', () => {
    it('falls back to en-US formatting', () => {
      expect(formatPrice(1234.56, 'unknown')).toBe('1,234.56');
    });
  });
});

describe('formatMonthlyPrice', () => {
  describe('with default locale (en)', () => {
    it('formats monthly price with no decimals', () => {
      expect(formatMonthlyPrice(5780)).toBe('5,780');
      expect(formatMonthlyPrice(10510)).toBe('10,510');
      expect(formatMonthlyPrice(14020)).toBe('14,020');
    });

    it('handles zero', () => {
      expect(formatMonthlyPrice(0)).toBe('0');
    });

    it('rounds decimal values', () => {
      expect(formatMonthlyPrice(5780.99)).toBe('5,781');
      expect(formatMonthlyPrice(5780.49)).toBe('5,780');
    });

    it('handles large numbers', () => {
      expect(formatMonthlyPrice(100000)).toBe('100,000');
      expect(formatMonthlyPrice(1000000)).toBe('1,000,000');
    });
  });

  describe('with ru locale', () => {
    it('uses Russian number formatting (space as thousands separator)', () => {
      const result = formatMonthlyPrice(5780, 'ru');
      // Russian uses non-breaking space (U+00A0) as thousands separator
      expect(result).toMatch(/5[\s\u00A0]780/);
    });
  });

  describe('with zh locale', () => {
    it('uses Chinese number formatting', () => {
      expect(formatMonthlyPrice(5780, 'zh')).toBe('5,780');
    });
  });

  describe('with unknown locale', () => {
    it('falls back to en-US formatting', () => {
      expect(formatMonthlyPrice(5780, 'unknown')).toBe('5,780');
    });
  });
});
