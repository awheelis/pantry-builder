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
                                'meat','produce','dairy','dry','canned','frozen','other'
                              )),
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

CREATE INDEX IF NOT EXISTS idx_ri_recipe     ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_grocery_ingr  ON grocery_items(ingredient_id);
