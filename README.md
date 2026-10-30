# Palita-Na

**The official source code of Palita-Na** — a campus marketplace for VSU (Visayas State University) students to buy and sell pre-owned items. 0% commission, 100% in-person safe trades on campus.

> This React repository is the official and active version of the project. The original static HTML/CSS/JS site is kept separately as the legacy reference.

## Tech Stack

- **React** + **Vite** — UI and dev server
- **React Router** — pages and navigation (`/`, `/search`, `/checkout/:id`)
- **Plain CSS** — migrated from the legacy site (Tailwind planned)
- **Supabase** — live products database (PostgreSQL); auth & listings *in progress*

## Features

- Product grid with photos, prices, conditions, and locations
- Sidebar filters — location, condition, and price range (Apply to commit)
- Sorting — Latest Listed (by date), Price Low→High, Price High→Low
- Pagination
- Search with a dedicated results page + clear (✕) button
- Product detail / checkout page per listing

## Getting Started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run lint     # run ESLint
npm run build    # production build
```

## Project Structure

```
src/
  components/   # Navbar, SearchBar, FiltersSidebar, SortBar, ProductCard, ...
  pages/        # HomePage, SearchResultsPage, CheckoutPage, PageUnderDevelopment
  lib/          # supabase.js — shared Supabase client
  App.jsx       # routes table
```

## Roadmap

- [x] Static site port to React
- [x] Interactive filters, sorting, pagination
- [x] Search page
- [x] Supabase — products table, live data fetch
- [ ] User accounts and real listings ("List an Item")
- [ ] Cart
- [ ] Tailwind CSS migration

---

Developed by **73yel** · Student project · Baybay City, Leyte
