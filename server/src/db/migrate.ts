import pool from './connection';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS ingredients (
  id                          SERIAL PRIMARY KEY,
  name                        TEXT NOT NULL UNIQUE,
  category                    TEXT NOT NULL CHECK (category IN ('meat','produce','dairy','dry','canned','frozen','other')),
  unit                        TEXT NOT NULL,
  suggested_purchase_location INTEGER REFERENCES stores(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS recipes (
  id                   SERIAL PRIMARY KEY,
  name                 TEXT NOT NULL,
  description          TEXT,
  serving_size         NUMERIC NOT NULL DEFAULT 1,
  ease_rating          INTEGER CHECK (ease_rating BETWEEN 1 AND 5),
  deliciousness_rating INTEGER CHECK (deliciousness_rating BETWEEN 1 AND 5)
);
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id                     SERIAL PRIMARY KEY,
  recipe_id              INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id          INTEGER NOT NULL REFERENCES ingredients(id),
  amount                 NUMERIC NOT NULL,
  unit                   TEXT NOT NULL,
  is_substituted         SMALLINT NOT NULL DEFAULT 0,
  original_ingredient_id INTEGER REFERENCES ingredients(id)
);
CREATE TABLE IF NOT EXISTS staged_recipes (
  id           SERIAL PRIMARY KEY,
  recipe_id    INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  scale_factor NUMERIC NOT NULL DEFAULT 1.0
);
CREATE TABLE IF NOT EXISTS grocery_items (
  id            SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL UNIQUE REFERENCES ingredients(id),
  total_amount  NUMERIC NOT NULL DEFAULT 0,
  unit          TEXT NOT NULL,
  is_purchased  SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ri_recipe     ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_grocery_ingr  ON grocery_items(ingredient_id);
CREATE TABLE IF NOT EXISTS custom_grocery_items (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  is_purchased SMALLINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE
)
`;

const MIGRATIONS = `
ALTER TABLE stores               ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ingredients          ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE recipes              ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE staged_recipes       ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE grocery_items        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE custom_grocery_items ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE grocery_items DROP CONSTRAINT IF EXISTS grocery_items_ingredient_id_key;
ALTER TABLE grocery_items ADD CONSTRAINT IF NOT EXISTS grocery_items_user_ingredient_unique UNIQUE (user_id, ingredient_id);
`;

export async function migrate() {
  const statements = SCHEMA.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of statements) {
    await pool.query(sql);
  }
  // Idempotent column/constraint additions for the multi-user migration
  const alterStatements = MIGRATIONS.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of alterStatements) {
    await pool.query(sql);
  }
  console.log('[db] schema applied');
}

