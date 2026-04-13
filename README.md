# QA Assessment — User Profile Form Automation

> This Readme document was built with assistance from [Claude](https://claude.ai) (Anthropic).

Automated test suite for the user profile creation form at [https://qa-assessment.pages.dev/](https://qa-assessment.pages.dev/).

## Tech Stack

- **Playwright v1.52** with TypeScript
- **Page Object Model (POM)** design pattern
- **GitHub Actions** CI/CD with matrix strategy (Chromium × Firefox × WebKit)

---

## Prerequisites

- Node.js v20+
- npm v9+
- Git

---

## Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd qa-assessment

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install --with-deps
```

---

## Running Tests

```bash
# All tests, all browsers
npm test

# Single browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Headed mode (watch the browser)
npm run test:headed

# Interactive debug mode
npm run test:debug

# Performance tests only
npx playwright test tests/performance.spec.ts

# Open the HTML report after a run
npm run report
```

---

## Project Structure

```
qa-assessment/
├── .github/
│   └── workflows/
│       └── playwright.yml        # CI/CD — cross-browser matrix on push/PR
├── pages/
│   └── UserProfilePage.ts        # Page Object Model (selectors + helpers)
├── tests/
│   ├── user-profile.spec.ts      # 17 functional test cases
│   ├── test-data.ts              # Centralised test inputs and expected messages
│   └── performance.spec.ts       # 5 performance tests (PF-001 to PF-005)
├── reports/                      # JSON test results (gitignored)
├── playwright-report/            # HTML report (gitignored)
├── playwright.config.ts          # Playwright configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
├── .gitignore
└── README.md
```

---

## Test Coverage

### Functional tests — `user-profile.spec.ts` (17 cases)

| TC ID | Category | Description | Expected Status |
|-------|----------|-------------|-----------------|
| TC-001 | Happy Path | Submit with all mandatory fields filled correctly | Pass |
| TC-002 | Happy Path | Submit with all fields (mandatory + optional) | Pass |
| TC-003 | Mandatory Validation | Error when first name is empty | Pass |
| TC-004 | Mandatory Validation | **BUG-001** — empty last name shows wrong error message | Fail (bug) |
| TC-005 | Mandatory Validation | Error when email is empty | Pass |
| TC-006 | Mandatory Validation | Error when confirm password is empty | Pass |
| TC-007 | Mandatory Validation | Error when passwords do not match | Pass |
| TC-008 | Format Validation | Reject numeric characters in first name | Pass |
| TC-009 | Format Validation | Reject special characters in last name | Pass |
| TC-010 | Format Validation | Block submission on invalid email format | Pass |
| TC-011 | Field Type Checks | **BUG-002** — password and confirm password fields must mask input | Fail (bug) |
| TC-012 | Field Type Checks | Phone field accepts exactly 10 digits and enforces the pattern | Pass |
| TC-013 | Field Type Checks | Date of birth accepts YYYY-MM-DD format | Pass |
| TC-014 | Field Type Checks | **BUG-004** — phone field pattern error gives no format hint to user | Fail (bug) |
| BUG-006 | Exploratory | Name fields reject valid names containing spaces | Fail (bug) |
| BUG-007 | Exploratory | Password validation accepts single-character passwords | Fail (bug) |
| BUG-008 | Exploratory | LinkedIn field is mandatory despite being labelled optional | Fail (bug) |


### Performance tests — `performance.spec.ts` (5 cases)

| PF ID | Description | Threshold |
|-------|-------------|-----------|
| PF-001 | Page load time | < 5000ms |
| PF-002 | TTFB and DOMContentLoaded | TTFB < 2000ms, DCL < 4000ms |
| PF-003 | Validation alert response time | < 3000ms |
| PF-004 | Full form fill + submit cycle | < 5000ms |
| PF-005 | Total resource transfer size | < 500KB |

### Performance test results

| PF ID | Chromium | Firefox | WebKit |
|-------|----------|---------|--------|
| PF-001 | Pass — 3356ms | Pass — 2096ms | Pass — 1158ms |
| PF-002 | **Fail** — DCL 19451ms (threshold 4000ms) | Pass — TTFB 54ms, DCL 1583ms | Pass — TTFB 668ms, Load 2316ms |
| PF-003 | **Fail** — no alert detected | Pass — 2503ms | Pass — 969ms |
| PF-004 | Pass — 608ms total | Pass — 1235ms total | Pass — 3098ms total |
| PF-005 | Pass — 1.5KB total | Pass — 1.5KB total | Pass — 1.5KB total |

---

## CI/CD Pipeline

Tests run automatically on every push and pull request to `main` via GitHub Actions (`.github/workflows/playwright.yml`). The pipeline uses a matrix strategy to run tests in parallel across Chromium, Firefox, and WebKit. HTML reports and test artifacts are uploaded for every run.

---

## Challenges & Limitations

**Alert-based validation.** The form uses JavaScript `alert()` dialogs for error messages. Playwright handles these via dialog event listeners, but this approach is inherently fragile. A production form should use inline DOM error messages instead.


