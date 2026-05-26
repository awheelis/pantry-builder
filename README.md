# Pantry Builder

A personal webapp for going from a list of recipes to a fully organized, store-sorted grocery list — and for tracking cooking readiness once you've started shopping.

---

## The problem it solves

- Recipes are often scaled up or down, which breaks the ingredient quantities from the original source.
- Ingredients need to be bought at different stores, adding a confusing multi-trip dimension to grocery planning.
- After shopping, it's hard to remember which ingredient belongs to which recipe and in what quantity.

Pantry Builder handles all three: scale recipes, route ingredients to the right store, and track what's been purchased per recipe.

---

## How to use it

The app has three tabs: **Cook Plan**, **Grocery List**, and **Library**. The intended flow is left to right.

### Step 0 — Build your library (Library tab)

Before creating recipes, you need an ingredient library.

1. Go to **Library → Stores** and add the grocery stores you shop at (e.g., Aldi, Costco).
2. Go to **Library → Ingredients** and add each ingredient you cook with. For each one, set:
   - **Name** — what you call it
   - **Category** — meat, produce, dairy, dry, canned, frozen, or other
   - **Unit** — the default unit (cups, lbs, oz, count, etc.)
   - **Store** — where you normally buy it

Recipes can only use ingredients that exist in the library, so build this out as you add recipes over time.

### Step 1 — Create recipes (Cook Plan tab → Recipe Archive)

1. Click **+ New Recipe** in the Recipe Archive (left column).
2. Fill in the recipe name, a description or cookbook reference (e.g., "Marcella Hazan p.198"), and serving size.
3. Optionally rate ease of preparation and deliciousness (1–5 stars) — useful for choosing what to cook.
4. Add ingredients: pick from your library, set the amount and unit for this recipe.
5. Save. The recipe now lives in the archive permanently.

### Step 2 — Stage recipes for a cooking session (Cook Plan tab → Staging Area)

The staging area is your active meal plan for a given shopping trip.

1. Find a recipe in the archive and click **Stage** — it moves to the Staging Area (right column).
2. Set a **Scale ×** multiplier if you're cooking more or fewer servings than the recipe default (e.g., `2` doubles everything).
3. If you want to swap an ingredient (e.g., almond flour instead of all-purpose flour), click **Swap ingredients**. The original is tracked so you can see what changed and revert it.
4. Stage as many recipes as you want for the trip.

As soon as a recipe is staged, its ingredients appear in the Grocery List.

### Step 3 — Shop from the Grocery List (Grocery List tab)

The grocery list is automatically compiled from all staged recipes, with amounts aggregated and scaled.

- **Filter by category** (produce, dairy, dry, etc.) to work through one section of the store at a time.
- **Filter by store** to build a per-store list for each stop on your trip.
- **Check off items** as you put them in your cart. Purchased items move to the bottom of the list.

### Step 4 — Track cooking readiness (Cook Plan tab → Cook view)

Once you've started shopping, click **Cook view** on any staged recipe to see:

- Each ingredient with its scaled quantity.
- Which items have been purchased (checked off in the Grocery List).
- An overall **% ready** progress bar for that recipe.

This is useful when you're cooking across multiple shopping trips, or when you want to know which recipe you can start first.

### Wrapping up a session

When the cooking session is done, click **Clear all** in the Staging Area to reset. The grocery list clears with it. Your recipe archive and ingredient library are permanent.

---

## Running locally

**Prerequisites:** Node.js 18+

```bash
# Install all dependencies
npm install
npm install --prefix client
npm install --prefix server

# Start both servers (frontend on :5173, backend on :3001)
npm run dev
```

Open `http://localhost:5173`.

The SQLite database file is created automatically at `server/pantry.db` on first run.

### Running tests

```bash
# Server (Jest + Supertest — 68 tests)
npm test --prefix server

# Client (Vitest + React Testing Library — 27 tests)
npm test --prefix client
```

---

## Deploying to Render

The repo includes a `render.yaml` that configures a single Web Service with a 1 GB persistent disk for the SQLite file.

1. Push this repo to GitHub.
2. In the Render dashboard, click **New → Blueprint** and connect the repo.
3. Render will read `render.yaml` and create the service automatically.
4. The database persists at `/var/data/pantry.db` across deploys and restarts.

No environment variables need to be set manually — they are defined in `render.yaml`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Zustand |
| Backend | Node.js, Express, better-sqlite3 |
| Database | SQLite (WAL mode, foreign keys on) |
| Tests | Jest + Supertest (server), Vitest + React Testing Library (client) |
| Deployment | Render.com (single service + persistent disk) |

---

## Project structure

```
pantry-builder/
├── client/          # Vite + React frontend
│   └── src/
│       ├── api/         # typed fetch wrappers
│       ├── components/  # UI components by panel
│       ├── store/       # Zustand state (staging, grocery)
│       └── types/       # shared TypeScript interfaces
├── server/          # Express + SQLite backend
│   └── src/
│       ├── db/          # schema.sql, migration, connection
│       ├── models/      # query helpers per table
│       ├── routes/      # REST route handlers
│       └── middleware/  # error handler
└── render.yaml      # Render deployment config
```
