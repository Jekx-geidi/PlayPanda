<p align="center">
  <img src="src/assets/logo.svg" alt="PlayPanda" width="360" />
</p>

# PlayPanda

One platform for sports and e-sports tournaments — team registration, live brackets and standings, and a focused scorer interface, all in one place.

## Features

- **Any sport, any format** — a configurable scoring engine that adapts to basketball, badminton, Valorant, or whatever else is being run.
- **Live brackets & standings** — confirmed results advance brackets and update standings automatically, visible to the public in real time.
- **Built-in scorer tools** — assigned scorers get a focused, tablet-friendly interface with nothing more than what the match needs.
- **Google sign-in & role-based access** — Supabase-backed auth with dedicated dashboards for admins and scorers.

## Tech stack

- [React 19](https://react.dev/) + [React Router](https://reactrouter.com/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- [Supabase](https://supabase.com/) for auth and data
- [Vitest](https://vitest.dev/) + Testing Library for tests

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Other scripts

| Command | Description |
| --- | --- |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

## Environment

Supabase auth requires the following environment variables (e.g. in a local `.env`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Project structure

```
src/
  assets/       Static brand assets (logo, etc.)
  components/   Shared UI components (Header, JoinBanner, mascot, ...)
  context/      React context (auth)
  lib/          Shared helpers (roles, Supabase client)
  pages/        Route-level pages (Home, Login, Register, Admin, Scorer, ...)
public/
  images/       Marketing and mascot artwork
```
