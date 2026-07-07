# Pull Request

## Task

[Swagger/OpenAPI UI (Final Task)](https://github.com/rolling-scopes-school/tasks/blob/master/react/modules/tasks/final.md)

## Demo

- Deployed app: <!-- link -->
- Video walkthrough: <!-- YouTube link -->

## Description

<!-- What was implemented in this PR -->

## Score

Total: **X / 550**

### Feature 1: App Header (60 points)

- [ ] Non-authenticated users see Sign In and Sign Up buttons in the header's upper right corner (15)
- [ ] Authenticated users see History and Sign Out buttons in the header's upper right corner (10)
- [ ] Navigation link to About page is available in header and footer (10)
- [ ] If the token is expired/invalid, the user is redirected from private routes to the Main page (10)
- [ ] Pressing the Sign In / Sign Up button redirects to the route with the respective form (15)

### Feature 2: Sign In / Sign Up (50 points)

- [ ] Buttons for Sign In / Sign Up / Sign Out are present everywhere they should be (10)
- [ ] Client-side validation is implemented (20)
- [ ] Upon successful login, the user is redirected to the Main page (10)
- [ ] Logged-in users are redirected from Sign In / Sign Up routes to the Main page (10)

### Feature 3: Swagger Editor (120 points)

- [ ] Loading/pasting OpenAPI/Swagger schema in JSON and YAML formats is supported (25)
- [ ] Auto-detection of input format (JSON vs YAML) is implemented (20)
- [ ] Format switching with automatic conversion (JSON ↔ YAML) works correctly (20)
- [ ] Schema validation with error indication is implemented (15)
- [ ] Authenticated users can save schemas; saved schema restored on next login (10)
- [ ] The Viewer automatically populates with endpoints when the schema is valid (10)
- [ ] Responsive split view adjusts based on screen orientation (20)

### Feature 4: Swagger Viewer (120 points)

- [ ] Endpoint list is displayed with organization by path/method (20)
- [ ] Endpoint details show method, path, and all parameter types (25)
- [ ] Request schema and example payloads are displayed (20)
- [ ] Response schema, examples, and all supported status codes are displayed (25)
- [ ] Try-It-Out functionality works end to end (20)
- [ ] Generate cURL button with copy-to-clipboard functionality is implemented (10)

### Feature 5: History and Analytics (70 points)

- [ ] Server-side generated history with informational empty state (15)
- [ ] Requests sorted by timestamp, most recent first (10)
- [ ] All required analytics recorded server-side and displayed (45)

### Feature 6: About Page (25 points)

- [ ] About page is accessible to all users (5)
- [ ] Contains information about the RS School course (5)
- [ ] Contains team member information (10)
- [ ] Design is consistent with the application design (5)

### Feature 7: General Requirements (55 points)

- [ ] Multiple (at least 2) languages with an i18n toggler in the header (30)
- [ ] Sticky header with animation (10)
- [ ] Errors are displayed in a user-friendly format (10)
- [ ] Private routes are properly protected (5)

### Feature 8: YouTube Video (50 points)

- [ ] A 5–7 minute video demonstrating all implemented features (50)
