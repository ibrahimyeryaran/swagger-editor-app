# Swagger Editor App

A **Swagger/OpenAPI UI with REST client capabilities** built for the [RS School React course final task](https://rs.school/courses/reactjs). Edit OpenAPI specifications in JSON or YAML, browse the endpoints they define, and execute real requests through a CORS-free server-side proxy.

**Live demo:** _link will be added after deployment_

## Features

- **Swagger Editor** — CodeMirror-based editor with automatic JSON/YAML format detection, one-click conversion between formats, and structural OpenAPI 3.x / Swagger 2.0 validation with line-aware error messages.
- **Swagger Viewer** — endpoints organized by path and method with parameters (path, query, header, cookie), request/response schemas, examples, and all declared status codes.
- **Try It Out** — fill in parameters, headers, and body, then execute the request through the Next.js server (no CORS issues). 4xx/5xx responses are shown in the response section, exactly like a REST client.
- **cURL generation** — build a cURL command from the current request state and copy it to the clipboard.
- **Authentication** — email/password sign up and sign in via Supabase, with client-side validation (email format; password with min 8 chars, letter, digit, special character, Unicode support).
- **Saved schemas** — authenticated users can save their schema; it is restored automatically on the next login.
- **History & Analytics** — server-rendered history of executed requests with duration, status code, timestamp, method, request/response sizes, error details, and per-request detail pages.
- **i18n** — English and Turkish, switchable from the header.
- **Responsive split view** — horizontal editor/viewer split in landscape, vertical in portrait.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · next-intl · Supabase (Auth + Postgres) · CodeMirror 6 · js-yaml · Vitest + Testing Library · ESLint + Prettier + Husky

## Getting started

### 1. Install

```bash
git clone <repo-url>
cd swagger-editor-app
npm install
```

### 2. Configure Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the script from [`supabase/schema.sql`](supabase/schema.sql) to create the tables and row-level security policies.
3. (Recommended) In **Authentication → Sign In / Up → Email**, disable _Confirm email_ so users can sign in right after registration.
4. Copy `.env.example` to `.env` and fill in your project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

## How the CORS-free proxy works

The **Try It Out** feature never calls the target API from the browser. The request details are sent to the `POST /api/proxy` route handler, which performs the HTTP request server-side, measures duration and payload sizes, records analytics for authenticated users, and returns the target's status, headers, and body to the client. No separate proxy service is required — it runs as part of the Next.js app.

## Scripts

| Script                  | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| `npm run dev`           | Start the development server                                  |
| `npm run build`         | Production build                                              |
| `npm start`             | Serve the production build                                    |
| `npm run lint`          | Run ESLint                                                    |
| `npm run format`        | Format the codebase with Prettier                             |
| `npm test`              | Run the test suite                                            |
| `npm run test:coverage` | Run tests with the coverage report (80%+ statements enforced) |

## Testing

Unit and component tests are written with Vitest and Testing Library and cover the OpenAPI utilities, UI components, API route handlers, and pages. Statement coverage is above 90%.

## Team

- [İbrahim Yeryaran](https://github.com/ibrahimyeryaran) — team lead & developer
