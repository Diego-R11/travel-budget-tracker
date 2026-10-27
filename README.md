# Travel Budget Tracker

**Live demo:** https://travel-budget-tracker-seven.vercel.app

A mobile-first React app to control daily spending during a multi-country trip. Each day has its own budget; whatever you don't spend rolls over to the next day, and overspending is taken from the days that follow. Unexpected costs go to a separate emergency cushion so they don't distort the daily plan.

I built it to track my own trip through Spain, France, Switzerland and Italy, paying in EUR, CHF and COP.

## Features

- **Daily budget with carry-over** – "available today" = today's budget + what you saved (or minus what you overspent) on previous days.
- **Pace indicator** – how far above or below the plan you are up to today.
- **Multi-currency** – expenses in EUR, CHF or COP, converted to EUR with editable exchange rates; totals also shown in COP.
- **Emergency cushion** – expenses tagged *Emergency* come out of a separate fund.
- **Per-day breakdown** – collapsible day cards grouped by country, with progress bars (green / amber from 80% / red when over).
- **Safe delete** – two-step confirmation to remove an expense.
- **Persistence** – data stays in `localStorage`, with an in-memory fallback when storage is blocked.

## Tech stack

React 19 · TypeScript · Vite · Vitest · React Testing Library · user-event

## Architecture

```
src/
├── domain/        # Pure business logic, no React
│   ├── types.ts       # Expense, PlanDay, Trip, Rates
│   ├── budget.ts      # toEur, summarizeTrip (carry-over, pace, cushion), barStatus
│   └── format.ts      # Currency and date formatting
├── data/trip.ts   # Trip plan (days, budgets, sections)
├── hooks/
│   ├── useExpenses.ts     # useReducer (add/remove) + persistence
│   └── useLocalStorage.ts # useState synced to localStorage
├── components/    # Presentational components
│   ├── SummaryTiles.tsx, ExpenseForm.tsx, DayCard.tsx,
│   └── RatesPanel.tsx, ProgressBar.tsx
└── App.tsx        # Composes everything; derives the summary with useMemo
```

Key decisions:

- **Business rules live in `domain/` as pure functions.** The carry-over and pace calculations are the riskiest logic, so they are isolated from the UI and unit-tested directly.
- **The summary is derived, not stored.** Only the raw expense list is in state; totals are recalculated with `useMemo`, so there is a single source of truth and nothing can get out of sync.
- **`useReducer` for expenses** makes the allowed state transitions explicit (`add`, `remove`) and easy to test.
- **Amounts are converted when saved.** Each expense keeps its original amount and currency plus the EUR value at that moment, so changing a rate later doesn't rewrite history.
- **"Today" is injectable** (`<App today="..." />`), which makes the app testable on any date.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit + component tests
npm run build    # type-check and production build
```

## Tests

- `src/domain/budget.test.ts` – currency conversion, date clamping, carry-over, overspending, emergency cushion, pace, progress-bar thresholds.
- `src/App.test.tsx` – user flows: adding an expense, converting currencies, emergency expenses, validation, two-step delete and persistence.
