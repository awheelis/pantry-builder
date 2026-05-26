export type IngredientCategory = 'meat' | 'produce' | 'dairy' | 'dry' | 'canned' | 'frozen' | 'other';

export interface Store {
  id: number;
  name: string;
}

export interface Ingredient {
  id: number;
  name: string;
  category: IngredientCategory;
  unit: string;
  suggested_purchase_location: number | null;
  store_name?: string | null;
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  serving_size: number;
  ease_rating: number | null;
  deliciousness_rating: number | null;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  ingredient_name: string;
  category: IngredientCategory;
  default_unit: string;
  amount: number;
  unit: string;
  is_substituted: 0 | 1;
  original_ingredient_id: number | null;
  original_ingredient_name: string | null;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredient[];
}

export interface StagedRecipe {
  id: number;
  recipe_id: number;
  recipe_name: string;
  serving_size: number;
  scale_factor: number;
  ease_rating: number | null;
  deliciousness_rating: number | null;
}

export interface GroceryItem {
  id: number;
  ingredient_id: number;
  ingredient_name: string;
  category: IngredientCategory;
  total_amount: number;
  unit: string;
  is_purchased: 0 | 1;
  store_id: number | null;
  store_name: string | null;
}

export interface BreakdownIngredient {
  ri_id: number;
  ingredient_id: number;
  ingredient_name: string;
  category: IngredientCategory;
  scaled_amount: number;
  unit: string;
  is_substituted: 0 | 1;
  original_ingredient_id: number | null;
  original_ingredient_name: string | null;
  is_purchased: 0 | 1 | null;
  grocery_total: number | null;
}

export interface Breakdown {
  staged_id: number;
  progress: number;
  ingredients: BreakdownIngredient[];
}
