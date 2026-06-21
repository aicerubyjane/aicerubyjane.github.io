# Project Instructions for Codex

## Project
This is a static personal portfolio website using HTML, CSS, and JavaScript.

## Commands
- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Run Playwright tests: `npm run test:e2e`
- Run headed Playwright tests: `npm run test:e2e:headed`
- Open Playwright report: `npm run test:e2e:report`

## UI Rules
- Keep the layout clean, responsive, smooth, and professional.
- Do not change the main layout unless explicitly requested.
- Do not make the hero image jump between light mode and dark mode.
- Keep the hero composition stable.
- Keep desktop and mobile behavior intact.

## Testing Rules
- After editing layout, run `npm run test:e2e`.
- For hero or dark mode changes, check `tests/dark-mode.spec.js`.
- Prefer stable selectors.
- Avoid fragile selectors like `nth-child` unless unavoidable.

## Debugging
- If tests fail, inspect the Playwright report, screenshots, video, or trace before editing again.
- Do not guess layout changes. Validate them with Playwright.