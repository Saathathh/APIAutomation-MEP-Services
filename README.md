# API Automation

API test automation framework built with [Playwright](https://playwright.dev/) for testing Authentication, Authorization, Feature Flag, and License APIs.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd APIAutomation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the required environment variables from `.env.example`.

## Running Tests

Run all API tests:
```bash
npm run test:api
```

Run a specific test project:
```bash
npx playwright test --project=api
npx playwright test --project=authorization
```

Run a specific test file:
```bash
npx playwright test tests/api/license/v4/account.spec.ts
```

View HTML report:
```bash
npx playwright show-report
```

## Project Structure

```
├── api/
│   ├── auth/
│   │   └── TokenManager.ts          # Token acquisition and caching (Okta TOTP)
│   └── clients/
│       ├── authentication/           # Auth API clients (AuthService, Product, User)
│       ├── authorization/            # Authorization API clients (Claim, Role, Session)
│       ├── featureflag/              # Feature Flag API client
│       └── license/                  # License API clients (Account, Customer, License)
├── tests/
│   └── api/
│       ├── authentication/           # Authentication API tests (v1, v2, v3)
│       ├── authorization/            # Authorization API tests (claim, role, service, session)
│       ├── featureflag/              # Feature Flag API tests (v2, v3)
│       └── license/                  # License API tests (v1, v3, v4)
├── utilities/
│   └── ApiBaseTest.ts                # Base test fixtures and API client setup
├── global-setup.ts                   # Global setup - acquires TID token before tests
├── playwright.config.ts              # Playwright configuration
├── package.json                      # Dependencies and scripts
└── .env                              # Environment variables (not committed)
```

## Test Projects

| Project         | Description                          | Parallel | Workers |
|-----------------|--------------------------------------|----------|---------|
| `api`           | All API tests except authorization   | Yes      | Default |
| `authorization` | Authorization API tests              | No       | 1       |

## Key Features

- **Token Management** - Automatic token acquisition via client credentials when available, with cached browser-based Okta TOTP fallback
- **Custom Fixtures** - Reusable API clients injected via Playwright fixtures
- **Multi-version Support** - Tests for multiple API versions (v1, v2, v3, v4)
- **CI Ready** - Configured with retries and single worker for CI environments
