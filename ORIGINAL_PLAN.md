# Pantry Builder — Original Implementation Plan

This document captures the design decisions made before any code was written. It reflects the requirements as clarified through the initial planning conversation.

---

## Context

The user wants a single-admin webapp that manages the full flow from recipe selection → compiled grocery list → cooking readiness tracking. The core problems solved are:

1. **Recipe scaling** — recipes are often cooked at different quantities than the original source, breaking the ingredient list.
2. **Multi-store sourcing** — ingredients need to be bought at different stores, adding a confusing temporal and logistical dimension.
3. **Post-purchase tracking** — after shopping, it's hard to know which ingredient belongs to which recipe at which quantity.

---

## Tech Stack

- **Frontend**: React + TypeScript, Vite
- **Backend**: Node.js + Express + better-sqlite3
- **Database**: SQLite (file on Render persistent disk)
- **Deploy**: Render.com — single Web Service with persistent disk at `/var/data/pantry.db`
- **Auth**: None for v1

Key decisions made during planning:

- SQLite over Postgres: simpler ops for a single-user app; Render's persistent disk handles durability.
- No auth for v1: the app is personal/private; login adds friction with no multi-user benefit yet.
- Managed store list (not freeform): stores are a finite, reusable set — a dropdown prevents typos and enables filtering.
- Binary purchase state (not partial amounts): keeps the grocery model simple; "you bought it or you didn't."
- Ingredient library as a prerequisite: recipes are built from existing ingredients only, so the library is the source of truth.
- `grocery_items` as a materialized table (not a view): `is_purchased` must persist, so it can't be pure derivation — it's rebuilt transactionally on every staging change while preserving purchase state.

---

## Folder Structure

```
pantry-builder/
├── package.json               # root scripts only (build, dev via concurrently)
├── .gitignore
├── render.yaml
│
├── client/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts         # /api proxy → localhost:3001 in dev
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── types/index.ts     # TS interfaces mirroring DB schema
│       ├── api/               # typed fetch wrappers per resource
│       │   ├── client.ts      # base fetch + error handling
│       │   ├── stores.ts
│       │   ├── ingredients.ts
│       │   ├── recipes.ts
│       │   └── grocery.ts
│       ├── hooks/             # one hook per resource (useStores, useRecipes…)
│       ├── store/             # Zustand: stagingStore.ts, groceryStore.ts
│       └── components/
│           ├── layout/        # AppShell, TabNav
│           ├── panel-staging/ # RecipeArchive, StagingArea, StagedRecipeCard,
│           │                  # ScaleFactorInput, IngredientSubstitutor,
│           │                  # SubstitutionDiff, CookBreakdown
│           ├── panel-grocery/ # GroceryList, GroceryItem, GroceryFilters, CategorySection
│           ├── library/       # IngredientLibrary, IngredientForm, StoreManager, StoreForm
│           ├── recipe-editor/ # RecipeForm, RecipeIngredientRow
│           └── common/        # SearchInput, RatingStars, ProgressBar, ConfirmDialog, Select
│
└── server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts           # Express entry; serves /api + static client/dist in prod
        ├── db/
        │   ├── connection.ts  # better-sqlite3 singleton; reads DB_PATH env var
        │   ├── schema.sql
        │   └── migrate.ts     # runs schema.sql synchronously on startup
        ├── routes/            # stores, ingredients, recipes, recipeIngredients, staged, grocery
        ├── models/            # typed query helpers per table
        └── middleware/        # errorHandler, validateBody
```

---

## SQLite Schema

```sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stores (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ingredients (
  id                          INTEGER PRIMARY KEY AUTOINCREMENT,
  name                        TEXT NOT NULL UNIQUE,
  category                    TEXT NOT NULL CHECK (category IN (
                                'meat','produce','dairy','dry','canned','frozen','other')),
  unit                        TEXT NOT NULL,
  suggested_purchase_location INTEGER REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  name                 TEXT NOT NULL,
  description          TEXT,
  serving_size         REAL NOT NULL DEFAULT 1,
  ease_rating          INTEGER CHECK (ease_rating BETWEEN 1 AND 5),
  deliciousness_rating INTEGER CHECK (deliciousness_rating BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id              INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id          INTEGER NOT NULL REFERENCES ingredients(id),
  amount                 REAL NOT NULL,
  unit                   TEXT NOT NULL,
  is_substituted         INTEGER NOT NULL DEFAULT 0,
  original_ingredient_id INTEGER REFERENCES ingredients(id)
);

CREATE TABLE IF NOT EXISTS staged_recipes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id    INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  scale_factor REAL NOT NULL DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS grocery_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ingredient_id INTEGER NOT NULL UNIQUE REFERENCES ingredients(id),
  total_amount  REAL NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL,
  is_purchased  INTEGER NOT NULL DEFAULT 0
);
```

---

## API Routes

### Stores
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stores` | List all |
| POST | `/api/stores` | Create |
| PUT | `/api/stores/:id` | Rename |
| DELETE | `/api/stores/:id` | Delete |

### Ingredients
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ingredients` | List (`?category=` `?store=`) |
| POST | `/api/ingredients` | Create |
| PUT | `/api/ingredients/:id` | Update |
| DELETE | `/api/ingredients/:id` | Delete |

### Recipes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/recipes` | List (`?q=` search) |
| GET | `/api/recipes/:id` | Single recipe + ingredients |
| POST | `/api/recipes` | Create |
| PUT | `/api/recipes/:id` | Update header |
| DELETE | `/api/recipes/:id` | Delete |

### Recipe Ingredients
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/recipes/:id/ingredients` | List |
| POST | `/api/recipes/:id/ingredients` | Add |
| PUT | `/api/recipes/:id/ingredients/:riId` | Update amount/unit |
| DELETE | `/api/recipes/:id/ingredients/:riId` | Remove |
| POST | `/api/recipes/:id/ingredients/:riId/substitute` | Swap ingredient; tracks original |
| POST | `/api/recipes/:id/ingredients/:riId/revert` | Restore original ingredient |

### Staged Recipes
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/staged` | List |
| POST | `/api/staged` | Stage a recipe |
| PUT | `/api/staged/:id` | Update scale factor → triggers grocery rebuild |
| DELETE | `/api/staged/:id` | Unstage → triggers grocery rebuild |
| DELETE | `/api/staged` | Clear all |

### Grocery List
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/grocery` | Compiled list (`?category=` `?store=`) |
| POST | `/api/grocery/rebuild` | Force recompute (idempotent) |
| PATCH | `/api/grocery/:id/purchase` | Toggle `is_purchased` |

### Cook Breakdown
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/staged/:id/breakdown` | Scaled ingredients + purchased % for one staged recipe |

---

## Component Tree

```
App → AppShell → TabNav (3 tabs)

[Cook Plan tab] → PanelStaging
  ├── RecipeArchive (left)
  │   ├── SearchInput
  │   ├── RecipeArchiveItem[] → [Stage] [Edit] [Delete]
  │   └── [+ New Recipe] → RecipeForm modal
  └── StagingArea (right)
      └── StagedRecipeCard[]
          ├── ScaleFactorInput
          ├── SubstitutionDiff     — ~~original~~ → replacement badges
          ├── [Cook view] → CookBreakdown modal
          │   └── ingredient rows: name | scaled amount | purchased ✓ | ProgressBar
          └── [Swap ingredients] → IngredientSubstitutor modal
              └── per-ingredient swap Select + [Restore original]

[Grocery List tab] → PanelGrocery
  ├── GroceryFilters (category chips + store dropdown)
  └── CategorySection[] (grouped by ingredient.category)
      └── GroceryItem[] (checkbox, amount, unit, store badge)

[Library tab] → LibraryPanel
  ├── IngredientLibrary (CRUD: name, category, unit, store)
  └── StoreManager (CRUD: name)
```

---

## Critical Implementation Details

### Grocery Rebuild (`rebuildGroceryList()`)

Called on every staging mutation (stage, unstage, scale change, substitution). Runs inside a single SQLite transaction:

1. Iterate all staged recipes × their recipe_ingredients × scale_factor, accumulating `ingredient_id → {total_amount, unit}`.
2. `INSERT … ON CONFLICT(ingredient_id) DO UPDATE SET total_amount = excluded.total_amount` — preserves `is_purchased` for already-purchased items.
3. `DELETE FROM grocery_items WHERE ingredient_id NOT IN (…)` — removes ingredients no longer needed.

Ingredients that appear in multiple staged recipes with the same unit are summed. Mismatched units are not converted (v1 limitation).

### Substitution Tracking

`recipe_ingredients` stores:
- `is_substituted` (0/1) — whether the current ingredient differs from the original
- `original_ingredient_id` — FK to the ingredient as originally written in the recipe

On re-substitution, `original_ingredient_id` is preserved (not overwritten with the intermediate), so the diff always shows original vs. current.

UI renders: ~~original name~~ → **current name**

Revert clears both fields and restores the original `ingredient_id`.

### Cook Breakdown Progress

`GET /api/staged/:id/breakdown` joins `recipe_ingredients × staged_recipes × grocery_items` to return each ingredient's scaled amount and whether it has been purchased. Progress = `purchased_count / total_count * 100`. Binary — no partial purchase amounts in v1.

### Render Deployment

```yaml
services:
  - type: web
    name: pantry-builder
    env: node
    buildCommand: npm run build
    startCommand: node server/dist/index.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DB_PATH
        value: /var/data/pantry.db
    disk:
      name: pantry-db
      mountPath: /var/data
      sizeGB: 1
```

SQLite file lives on Render's persistent disk (`/var/data/pantry.db`). The `migrate.ts` script runs synchronously on startup, so schema changes are applied automatically on every deploy with no migration race conditions.

---

## Verification Checklist

1. `npm run dev` — frontend on `:5173`, backend on `:3001`
2. Library tab: create stores, create ingredients assigned to those stores
3. Cook Plan: create a recipe, add ingredients from the library
4. Stage the recipe → confirm grocery list populates
5. Change scale factor → confirm grocery amounts update
6. Substitute an ingredient → confirm substitution diff renders, grocery list reflects new ingredient
7. Check off a grocery item → confirm `is_purchased` persists, recipe progress bar updates
8. Unstage recipe → confirm grocery items are removed
9. Deploy to Render → confirm SQLite file persists across redeploys (`/var/data/pantry.db`)
