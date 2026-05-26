import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the API module before importing the store
vi.mock('../api/recipes', () => ({
  getStaged: vi.fn(),
  stageRecipe: vi.fn(),
  updateScaleFactor: vi.fn(),
  unstageRecipe: vi.fn(),
  clearStaged: vi.fn(),
}));

import * as api from '../api/recipes';
import { useStagingStore } from '../store/stagingStore';

const mockStaged = [
  { id: 1, recipe_id: 10, recipe_name: 'Bread', serving_size: 4, scale_factor: 1, ease_rating: null, deliciousness_rating: null },
  { id: 2, recipe_id: 11, recipe_name: 'Cake', serving_size: 8, scale_factor: 2, ease_rating: 4, deliciousness_rating: 5 },
];

beforeEach(() => {
  vi.clearAllMocks();
  useStagingStore.setState({ staged: [], loading: false });
});

describe('useStagingStore.fetch', () => {
  it('loads staged recipes into state', async () => {
    vi.mocked(api.getStaged).mockResolvedValue(mockStaged);
    await useStagingStore.getState().fetch();
    expect(useStagingStore.getState().staged).toEqual(mockStaged);
    expect(useStagingStore.getState().loading).toBe(false);
  });
});

describe('useStagingStore.stage', () => {
  it('calls stageRecipe then refreshes list', async () => {
    vi.mocked(api.stageRecipe).mockResolvedValue(mockStaged[0]);
    vi.mocked(api.getStaged).mockResolvedValue(mockStaged);
    await useStagingStore.getState().stage(10);
    expect(api.stageRecipe).toHaveBeenCalledWith(10);
    expect(useStagingStore.getState().staged).toEqual(mockStaged);
  });
});

describe('useStagingStore.updateScale', () => {
  it('calls updateScaleFactor and refreshes', async () => {
    vi.mocked(api.updateScaleFactor).mockResolvedValue(mockStaged[0]);
    vi.mocked(api.getStaged).mockResolvedValue([mockStaged[0]]);
    await useStagingStore.getState().updateScale(1, 3.5);
    expect(api.updateScaleFactor).toHaveBeenCalledWith(1, 3.5);
    expect(useStagingStore.getState().staged).toHaveLength(1);
  });
});

describe('useStagingStore.unstage', () => {
  it('calls unstageRecipe and refreshes', async () => {
    useStagingStore.setState({ staged: mockStaged });
    vi.mocked(api.unstageRecipe).mockResolvedValue(undefined);
    vi.mocked(api.getStaged).mockResolvedValue([mockStaged[1]]);
    await useStagingStore.getState().unstage(1);
    expect(api.unstageRecipe).toHaveBeenCalledWith(1);
    expect(useStagingStore.getState().staged).toHaveLength(1);
  });
});

describe('useStagingStore.clearAll', () => {
  it('calls clearStaged and empties state', async () => {
    useStagingStore.setState({ staged: mockStaged });
    vi.mocked(api.clearStaged).mockResolvedValue(undefined);
    await useStagingStore.getState().clearAll();
    expect(api.clearStaged).toHaveBeenCalled();
    expect(useStagingStore.getState().staged).toHaveLength(0);
  });
});
