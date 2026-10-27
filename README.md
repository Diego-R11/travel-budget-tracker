# Travel Budget Tracker

**Live demo:** https://travel-budget-tracker-seven.vercel.app

A mobile-first React app to control daily spending during a multi-country trip. Each day has its own budget; whatever you don't spend rolls over to the next day, and overspending is taken from the days that follow. Unexpected costs go to a separate emergency cushion so they don't distort the daily plan.

I built it to track my own trip through Spain, France, Switzerland and Italy, paying in EUR, CHF and COP. Everything about the trip is configurable, so it works for any trip.

## Features

- **Daily budget with carry-over** – "available today" = today's budget + what you saved (or minus what you overspent) on previous days.
- **Pace indicator** – how far above or below the plan you are up to today.
- **Configurable trip** – edit the name, emergency cushion and every day (date, city, country, budget); add or remove days, or apply the same budget to all of them. Days are grouped by country automatically.
- **Any currency** – add currencies with their exchange rate, edit rates, choose the base currency (budgets) and a reference currency for totals (e.g. your home currency).
- **Swipe to edit** – swipe an expense left to reveal *Edit* and *Delete*. A one-time hint shows the gesture; delete has *Undo*. Edits can change the amount, currency, category, note or day.
- **Emergency cushion** – expenses tagged *Emergency* come out of a separate fund.
- **Light and dark mode** following the system setting.
- **Persistence** in `localStorage`, with an in-memory fallback when storage is blocked and a migration from the first version's data format.

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Radix UI) · lucide-react · Vitest · React Testing Library

## Architecture

```
src/
├── domain/              # Pure business logic, no React
│   ├── types.ts             # Trip, PlanDay, Currency, Expense
│   ├── budget.ts            # Conversion, summarizeTrip (carry-over, pace, cushion), barStatus
│   ├── tripSettings.ts      # Pure edits: days, currencies, change of base currency
│   ├── expenses.ts          # Draft → stored expense
│   ├── swipe.ts             # Where a swiped row settles
│   └── format.ts            # Money and date formatting
├── state/
│   ├── appReducer.ts        # One reducer for trip + expenses
│   ├── storage.ts           # Load/save, v1 → v2 migration
│   └── useTripStore.ts      # useReducer + persistence
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── settings/            # Settings sheet: trip, days, currencies
│   ├── SummaryCards, ExpenseForm, DayCard, SwipeableRow, BudgetBar
├── data/trip.ts         # Sample trip used on first launch
└── App.tsx              # Composition, edit dialog, undo, swipe hint
```

Key decisions:

- **Business rules live in `domain/` as pure functions.** Carry-over, pace and re-basing currencies are the riskiest logic, so they're isolated from the UI and unit-tested directly. The reducer only delegates to them.
- **One reducer for trip and expenses.** Some actions touch both: removing a day deletes its expenses, and changing the base currency re-expresses every budget and saved amount. Keeping them together makes those transitions atomic.
- **The summary is derived, not stored.** Only raw data lives in state; totals are recalculated with `useMemo`, so there's a single source of truth.
- **Expenses reference days by id, not by date.** Dates can be edited without losing the expenses attached to that day.
- **Amounts are converted when saved.** Each expense keeps its original amount and currency plus the converted value, so changing a rate later doesn't rewrite history.
- **Rates are "units per 1 base"** (1 EUR = 3650 COP) because that's how people read exchange rates; it avoids typing tiny decimals.
- **Swipe built on Pointer Events** with `touch-action: pan-y`, so vertical scrolling keeps working. The actions are real buttons: keyboard users can tab to them, which opens the row.
- **Native `<select>` styled like shadcn** instead of a custom dropdown: better on mobile and simpler to test.
- **"Today" and the initial state are injectable** (`<App today="..." initialState={...} />`), which makes the app testable on any date.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit + component tests
npm run build    # type-check and production build
```

## Tests (39)

- `domain/budget.test.ts` – conversion, current day with gaps and unsorted days, country sections, carry-over, overspending, cushion, pace.
- `domain/tripSettings.test.ts` – adding/removing days, duplicate dates, currency validation, rates, changing the base currency without changing the money.
- `state/state.test.ts` – reducer transitions and v1 data migration.
- `App.test.tsx` – user flows: add, convert, emergency, validation, swipe, swipe hint, edit, move to another day, delete + undo, editing budgets and countries, adding currencies.
