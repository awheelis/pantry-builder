import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../api/grocery', () => ({
  getGrocery: vi.fn(),
  togglePurchase: vi.fn(),
}));

import * as api from '../api/grocery';
import { useGroceryStore } from '../store/groceryStore';
import type { GroceryItem } from '../types';

const mockItems: GroceryItem[] = [
  { id: 1, ingredient_id: 10, ingredient_name: 'Flour', category: 'dry', total_amount: 2, unit: 'cups', is_purchased: 0, store_id: null, store_name: null },
  { id: 2, ingredient_id: 11, ingredient_name: 'Milk', category: 'dairy', total_amount: 1, unit: 'gallons', is_purchased: 1, store_id: 5, store_name: 'Aldi' },
];

beforeEach(() => {
  vi.clearAllMocks();
  useGroceryStore.setState({ items: [], categoryFilter: '', storeFilter: '', loading: false });
});

describe('useGroceryStore.fetch', () => {
  it('loads items without filters', async () => {
    vi.mocked(api.getGrocery).mockResolvedValue(mockItems);
    await useGroceryStore.getState().fetch();
    expect(api.getGrocery).toHaveBeenCalledWith({ category: undefined, store: undefined });
    expect(useGroceryStore.getState().items).toEqual(mockItems);
    expect(useGroceryStore.getState().loading).toBe(false);
  });

  it('passes active filters to getGrocery', async () => {
    useGroceryStore.setState({ categoryFilter: 'dairy', storeFilter: '5' });
    vi.mocked(api.getGrocery).mockResolvedValue([mockItems[1]]);
    await useGroceryStore.getState().fetch();
    expect(api.getGrocery).toHaveBeenCalledWith({ category: 'dairy', store: '5' });
  });
});

describe('useGroceryStore.toggle', () => {
  it('updates the toggled item in state', async () => {
    useGroceryStore.setState({ items: mockItems });
    const toggled = { ...mockItems[0], is_purchased: 1 as const };
    vi.mocked(api.togglePurchase).mockResolvedValue(toggled);
    await useGroceryStore.getState().toggle(1);
    expect(useGroceryStore.getState().items[0].is_purchased).toBe(1);
    expect(useGroceryStore.getState().items[1].is_purchased).toBe(1); // untouched
  });
});

describe('useGroceryStore filter setters', () => {
  it('setCategoryFilter updates categoryFilter', () => {
    useGroceryStore.getState().setCategoryFilter('produce');
    expect(useGroceryStore.getState().categoryFilter).toBe('produce');
  });

  it('setStoreFilter updates storeFilter', () => {
    useGroceryStore.getState().setStoreFilter('3');
    expect(useGroceryStore.getState().storeFilter).toBe('3');
  });

  it('clearing filter resets to empty string', () => {
    useGroceryStore.setState({ categoryFilter: 'meat' });
    useGroceryStore.getState().setCategoryFilter('');
    expect(useGroceryStore.getState().categoryFilter).toBe('');
  });
});
