# PalitaNa

PalitaNa is a campus marketplace for Visayas State University. Buyers discover nearby listings, arrange public meetups, and pay sellers directly in person. The app uses React, Vite, React Router, and Supabase.

## Run locally

Use Node.js 24 and npm.

```sh
npm ci
npm run dev -- --mode demo
```

Open [localhost:5173](http://localhost:5173). Demo mode includes sample listings and stores activity in your browser. Create two demo accounts to try both sides of a pickup.

## Marketplace features

- Browse by campus area, price, condition, or a seller’s published pickup window.
- Save items, select items in a seller-grouped cart, or request one item directly.
- Propose a meetup, confirm or reschedule it, and track changes in a private conversation and timeline.
- Use the Campus Meetup Card for directions and a calendar reminder. Confirm receipt and leave a review after the handoff.
- Post a wanted item and receive private replies linking to available listings.
- Post listing photos, manage availability, and publish a pickup window for Between Classes search.

## Connect Supabase

1. Copy `.env.example` to `.env.local`. Add your project URL and public publishable key. The original `VITE_SUPABASE_ANON_KEY` variable also works with a public legacy anon key.
2. For a new or disposable project, run the scripts below in order in the SQL Editor. On an existing deployment, apply only the scripts it is missing.
3. Configure the site URL and approved `/login` redirect URLs in Supabase Auth. Configure custom SMTP for external verification and password reset emails if needed.
4. Start the connected app with `npm run dev`.

| Order | Script | Adds |
| --- | --- | --- |
| 1 | [setup.sql](supabase/setup.sql) | Listings, requests, and initial row access policies |
| 2 | [marketplace_completion.sql](supabase/marketplace_completion.sql) | Listing photos and additional listing and pickup states |
| 3 | [campus_marketplace.sql](supabase/campus_marketplace.sql) | Campus scheduling, private chat, saved items, and reviews |
| 4 | [buyer_experience.sql](supabase/buyer_experience.sql) | Pickup workflow, seller availability, and wanted posts |

The app reads the marketplace tables named `draft_*`. If upgrading the older React deployment, plan the catalog migration from its legacy `products` table before switching traffic. These scripts leave the old table in place and do not copy its rows.

For the Vercel draft, coordinate the last SQL script with the matching frontend release. It changes how pickup status updates are submitted. Verify the two-account flow in staging and recheck email redirects before deploying. Keep database passwords, private keys, and SMTP credentials out of Vite variables and Git.

## Project layout

| Path | Contents |
| --- | --- |
| `src/pages/` | Route-level buyer, seller, and account views |
| `src/components/` | Shared UI and pickup interactions |
| `src/context/` and `src/hooks/` | Authentication, catalog, cart, and saved item state |
| `src/lib/` | Supabase and demo adapters, pickup rules, and listing uploads |
| `supabase/` | Database setup and upgrade scripts |
| `tests/` | Pickup and request regression tests |

## Checks

```sh
npm run lint
npm test
npm run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch, commit, and naming conventions.
