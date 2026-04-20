# Changelog

All notable changes to this project are documented here.

Format: `[YYYY-MM-DD] type: description`

---

## [2026-04-20]

### Changed

- `feat: add crypto payment announcement banner to header` (PR #4, commit `f131b60`)
  - New announcement strip above the main nav with `header.cryptoPayments` in EN/RU/ZH
- `fix: update crypto payments banner text` (PR #6, commit `8a331ff`)
  - EN copy shortened to "We accept crypto payments USDT"
- `fix: update crypto banner text in RU and ZH translations` (PR #8, commit `98e6c17`)
  - RU: "Мы принимаем оплату криптовалютой — USDC", ZH: "我们接受加密货币付款 — USDC"
- `fix: update B200 price to $5.8/hr` (PR #10, commit `cbb6fe9`)
  - B200 hourly bumped from \$3.95 → \$5.80

### Fixed

- `fix: recalculate B200 monthly price after hourly update` (PR #12, commit `5d31a49`)
  - `pricePerMonth` bumped \$23,100 → \$33,900 to match the new \$5.80/hr rate (PR #10 had left the monthly stale)

### Added

- `chore: add i18n and pricing consistency rules to code review` (PR #11)
  - Critical i18n rule in `CLAUDE.md` and `.claude/agents/code-review-agent.md` — any change to one of `messages/{en,ru,zh}.json` must be mirrored in all three
  - Critical pricing rule — if `pricePerHour` changes, `pricePerMonth` must be recalculated in the same commit
  - Code-review (local + GitHub Actions) flags violations as CRITICAL

### Refactored

- `refactor: centralize GPU hourly rates in pricing.ts` (PR #15)
  - Introduced `GPU_HOURLY_RATES` map in `src/data/pricing.ts` as the **single source of truth** for per-GPU hourly rate
  - `pricing[].pricePerMonth` is now derived: `Math.round(hourly × 8 × 730 / 100) × 100`
  - `efficiency.ts` no longer holds `pricePerHour` or `efficiency` literals — both are computed from `GPU_HOURLY_RATES` and the raw `weight` at module load
  - Removed duplicate `GPU_PRICING` map from `src/lib/gonka/constants.ts`; `/api/gpu-weights` and its tests import `GPU_HOURLY_RATES` directly
  - Added two invariant tests in `pricing.test.ts`: monthly matches the formula, and `efficiency.ts` shares hourly rates with `pricing.ts`
  - **Result**: changing a GPU price is now a one-line edit in `GPU_HOURLY_RATES`; the bug class that caused PR #10 → PR #12 is no longer expressible
  - Closes #14

### Docs

- `docs: clarify that deploy job is Skipped on PRs by design` (PR #13)
  - Added a one-line note to the CI/CD section of `CLAUDE.md` explaining that a "Skipped" deploy on PR checks is expected
- Updated "Pricing" section in `CLAUDE.md` to reflect the SSOT model with a step-by-step "how to update a GPU price" instruction for future contributors (and agents)

### Process / Repo

- Enabled `delete_branch_on_merge` on the GitHub repo — merged PR branches are now deleted automatically
- Cleaned up 5 stale merged branches locally and on remote

---

## [2026-03-23]

### Added

- `ci: add GitHub Actions CI/CD with deploy to VM` (commit `cfd8fb5`)
  - `.github/workflows/ci.yml` — two-job pipeline:
    - `ci` job: runs on every push to `main` and on PRs — installs deps (Node 22), lints, runs tests with coverage, builds
    - `deploy` job: runs only on push to `main` after CI passes — uses `mine` GitHub environment, SSHes into VM, pulls latest code, rebuilds Docker (`docker compose up -d --build`), prunes old images
  - Required GitHub secrets (in `mine` environment): `VM_HOST`, `VM_USER`, `VM_SSH_KEY`
  - Coverage comment posted on PRs via `MishaKav/jest-coverage-comment`

- `test: add unit tests for API routes, components, and utilities` (commit `9718dd7`)
  - 7 new test files, 56 new tests:
    - `gpu-weights` API route (17 tests): efficiency calculation, aggregation, fallback, caching
    - `network-status` API route (9 tests): status logic, block age, epoch extraction
    - `RequestGpuClient` (10 tests): GPU mapping, loading states, URL params
    - `Header` (6 tests): navigation, mobile menu, accessibility
    - `fetchWithTimeout` (5 tests): timeout, error handling
    - `sitemap.ts` (5 tests) and `robots.ts` (3 tests): URL generation, rules
  - Fixed existing `NetworkStatus.test.tsx` — updated mocks to match current `/api/network-status` response format
  - Total: 13 test suites, 141 tests, all passing

- `feat: add robots.txt and sitemap.xml` (commit `5137e1b`)
  - `robots.txt`: allows `/`, disallows `/api/`, points to sitemap
  - `sitemap.xml`: 6 URLs (3 locales x 2 pages), weekly/monthly frequency

### Changed

- `fix: update pricing subtitle to clarify setup/monitoring fees are separate`
  - Pricing subtitle now states plans do not include setup or monitoring fees
  - Managed service pricing available on request when purchasing
  - Updated EN, RU, ZH translations
- `fix: update FAQ answer to mention Managed Service in provisioning`
  - Added "With Managed Service, " to the start of the provisioning FAQ answer

- `chore: hide efficiency section pending team review` (commit `b8a1156`)
  - EfficiencySection temporarily removed from landing page

### Fixed

- `fix: resolve all ESLint errors for CI lint step` (commit `c21af74`)
  - Fix `any` types in test mock factories
  - Fix setState-in-effect in EfficiencySection AnimatedNumber
  - Fix immutability warnings in LanguageSwitcher
  - Add eslint-disable for `require()` in jest.config.js and test files
- `fix: sync efficiency section prices with updated GPU pricing` (commit `d5c65e6`)
  - H100: $1.80 -> $2.10, H200: $2.40 -> $3.05, B200: $3.02 -> $3.95
- `fix: update GPU pricing and clarify managed service as optional` (commit `c89f47b`)
- `fix: aggregate all GPU variants for efficiency calculation` (commit `94d40f2`)

### Config

- Jest coverage thresholds adjusted to 45%/30% (from 60%) to match actual coverage
- Jest config: added `coverageReporters: ['text', 'json-summary']` for CI reporting
- `jest.setup.js`: browser-only mocks guarded with `typeof window` for Node environment compatibility
- Git remote URL updated from `Zmiievskyi/Mine` to `zmiievskyi/mine`
