# Contributing to PalitaNa

## Branches and pull requests

- Create a short-lived branch from `develop` and open the pull request back into `develop`.
- Use a lowercase prefix and kebab-case subject, such as `feature/buyer-experience`, `fix/pickup-retry`, or `style/mobile-cart`.
- Use `main` for releases. Review the integration changes on `develop` before a release pull request.
- Include a summary, checks run, and any database or environment changes in the pull request.

## Commits

Write Conventional Commits in the form `type: imperative summary`. Use a scope when it clarifies the affected part of the app.

```text
feat: add campus buyer experience
fix(pickups): preserve cart items on retry
test: cover meetup rescheduling
docs: document the release workflow
```

Keep each commit focused. Add a body when a change requires a migration or coordinated release.

## Names and checks

- Use PascalCase for React component and page files, such as `ListingDetailsPage.jsx`.
- Use camelCase for functions, variables, and file names for hooks and utility modules. Use UPPER_SNAKE_CASE for shared constants.
- Use kebab-case for route slugs and CSS class names. Use snake_case for database objects and SQL filenames.
- Keep environment values in ignored local files and document public variable names in `.env.example`.
- Run `npm run lint`, `npm test`, and `npm run build` before requesting review.
- For pickup changes, test the buyer and seller flows with separate accounts in demo mode or staging.
