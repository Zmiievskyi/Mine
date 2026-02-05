import { getClientIdentifier, checkRateLimit } from '../rate-limit';
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API for Node.js environment
if (!globalThis.crypto || !globalThis.crypto.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

// Polyfill TextEncoder if not available
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder: NodeTextEncoder } = require('util');
  (globalThis as unknown as { TextEncoder: typeof NodeTextEncoder }).TextEncoder = NodeTextEncoder;
}

// Mock Headers and Request for test environment
class MockHeaders {
  private headers: Map<string, string>;

  constructor(init?: HeadersInit) {
    this.headers = new Map();
    if (init) {
      if (init instanceof Headers || init instanceof MockHeaders) {
        (init as MockHeaders).headers.forEach((value, key) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      } else {
        Object.entries(init).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }
  }

  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) ?? null;
  }

  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }
}

class MockRequest {
  headers: MockHeaders;
  url: string;

  constructor(url: string, init?: { headers?: HeadersInit }) {
    this.url = url;
    this.headers = new MockHeaders(init?.headers);
  }
}

// Replace global Request with our mock
const OriginalRequest = globalThis.Request;
(globalThis as unknown as { Request: typeof MockRequest }).Request = MockRequest as never;

// Restore after tests
afterAll(() => {
  if (OriginalRequest) {
    globalThis.Request = OriginalRequest;
  }
});

describe('IP Address Validation and Rate Limiting', () => {
  describe('getClientIdentifier', () => {
    describe('IPv4 Validation', () => {
      it('should accept valid IPv4 addresses when trustedProxyCount is set', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '192.168.1.1' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('192.168.1.1');
      });

      it('should handle X-Forwarded-For chain correctly with trustedProxyCount=1', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '203.0.113.45, 10.0.0.1' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('203.0.113.45');
      });

      it('should handle X-Forwarded-For chain correctly with trustedProxyCount=2', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '203.0.113.45, 10.0.0.1, 10.0.0.2' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 2 });
        expect(identifier).toBe('203.0.113.45');
      });

      it('should reject invalid IPv4 addresses even when trustedProxyCount is set', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '999.999.999.999' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should reject partial IPv4 addresses', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '192.168.1' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should reject IPv4 with letters', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '192.168.1.abc' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });
    });

    describe('IPv6 Validation', () => {
      it('should accept valid full IPv6 addresses when trustedProxyCount is set', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
      });

      it('should accept valid compressed IPv6 addresses', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '2001:db8::1' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('2001:db8::1');
      });

      it('should accept IPv6 loopback', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '::1' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('::1');
      });

      it('should reject invalid IPv6 addresses', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-forwarded-for': '2001:0db8:85a3::8a2e::7334' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });
    });

    describe('IP Spoofing Protection', () => {
      it('should use fallback when trustedProxyCount is 0 (default)', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': '1.2.3.4',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request);
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should use fallback for spoofed IPs when trustedProxyCount is 0', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': 'attacker-controlled-value',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request);
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should use fallback when X-Real-IP is invalid', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-real-ip': 'not-an-ip',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should create consistent fallback hash for same request fingerprint', async () => {
        const headers = {
          'user-agent': 'Mozilla/5.0',
          'accept-language': 'en-US',
          'accept-encoding': 'gzip',
        };

        const request1 = new Request('http://localhost', { headers });
        const request2 = new Request('http://localhost', { headers });

        const id1 = await getClientIdentifier(request1);
        const id2 = await getClientIdentifier(request2);

        expect(id1).toBe(id2);
        expect(id1).toMatch(/^fallback-[a-f0-9]{16}$/);
      });

      it('should create different fallback hashes for different fingerprints', async () => {
        const request1 = new Request('http://localhost', {
          headers: { 'user-agent': 'Agent1' },
        });

        const request2 = new Request('http://localhost', {
          headers: { 'user-agent': 'Agent2' },
        });

        const id1 = await getClientIdentifier(request1);
        const id2 = await getClientIdentifier(request2);

        expect(id1).not.toBe(id2);
      });
    });

    describe('X-Real-IP Header', () => {
      it('should accept valid X-Real-IP when trustedProxyCount is set', async () => {
        const request = new Request('http://localhost', {
          headers: { 'x-real-ip': '203.0.113.45' },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toBe('203.0.113.45');
      });

      it('should ignore X-Real-IP when trustedProxyCount is 0', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-real-ip': '203.0.113.45',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request);
        expect(identifier).toMatch(/^fallback-/);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty X-Forwarded-For', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': '',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should handle whitespace-only X-Forwarded-For', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': '   ',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should handle missing headers', async () => {
        const request = new Request('http://localhost');
        const identifier = await getClientIdentifier(request);
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should handle SQL injection attempts in IP field', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': "'; DROP TABLE users; --",
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });

      it('should handle script injection attempts in IP field', async () => {
        const request = new Request('http://localhost', {
          headers: {
            'x-forwarded-for': '<script>alert("xss")</script>',
            'user-agent': 'TestAgent',
          },
        });

        const identifier = await getClientIdentifier(request, { trustedProxyCount: 1 });
        expect(identifier).toMatch(/^fallback-/);
      });
    });
  });

  describe('checkRateLimit', () => {
    beforeEach(() => {
      // Clear rate limit store between tests by using different identifiers
      jest.clearAllTimers();
    });

    it('should allow first request', () => {
      const result = checkRateLimit('test-client-1', { limit: 3, windowMs: 60000 });
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should track multiple requests', () => {
      const config = { limit: 3, windowMs: 60000 };
      const identifier = 'test-client-2';

      const r1 = checkRateLimit(identifier, config);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkRateLimit(identifier, config);
      expect(r2.success).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit(identifier, config);
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it('should block requests after limit is reached', () => {
      const config = { limit: 2, windowMs: 60000 };
      const identifier = 'test-client-3';

      checkRateLimit(identifier, config);
      checkRateLimit(identifier, config);
      const blocked = checkRateLimit(identifier, config);

      expect(blocked.success).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should provide rate limit metadata', () => {
      const config = { limit: 5, windowMs: 60000 };
      const result = checkRateLimit('test-client-4', config);

      expect(result.limit).toBe(5);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });
  });

  describe('Integration: Rate Limiting with IP Spoofing Protection', () => {
    it('should rate limit based on fallback fingerprint when no trusted proxies', async () => {
      const config = { limit: 2, windowMs: 60000 };

      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': 'spoofed-ip',
          'user-agent': 'SameAgent',
        },
      });

      const id1 = await getClientIdentifier(request);
      const id2 = await getClientIdentifier(request);
      expect(id1).toBe(id2); // Same fingerprint

      const r1 = checkRateLimit(id1, config);
      expect(r1.success).toBe(true);

      const r2 = checkRateLimit(id2, config);
      expect(r2.success).toBe(true);

      const r3 = checkRateLimit(id1, config);
      expect(r3.success).toBe(false); // Rate limited
    });

    it('should rate limit based on validated IP when trusted proxies configured', async () => {
      const config = { limit: 2, windowMs: 60000 };

      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.45' },
      });

      const id = await getClientIdentifier(request, { trustedProxyCount: 1 });
      expect(id).toBe('203.0.113.45');

      const r1 = checkRateLimit(id, config);
      expect(r1.success).toBe(true);

      const r2 = checkRateLimit(id, config);
      expect(r2.success).toBe(true);

      const r3 = checkRateLimit(id, config);
      expect(r3.success).toBe(false); // Rate limited
    });

    it('should prevent bypass attempts with spoofed IPs when no trusted proxies', async () => {
      const config = { limit: 1, windowMs: 60000 };

      // Attacker tries to bypass by changing X-Forwarded-For
      const request1 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '1.1.1.1',
          'user-agent': 'AttackerAgent',
        },
      });

      const request2 = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '2.2.2.2', // Different IP
          'user-agent': 'AttackerAgent', // Same fingerprint
        },
      });

      const id1 = await getClientIdentifier(request1);
      const id2 = await getClientIdentifier(request2);

      // Both should resolve to the same fallback hash (same fingerprint)
      expect(id1).toBe(id2);

      const r1 = checkRateLimit(id1, config);
      expect(r1.success).toBe(true);

      const r2 = checkRateLimit(id2, config);
      expect(r2.success).toBe(false); // Still rate limited despite different IP
    });
  });
});
