import { useEffect, useState } from 'react';
import type { GroceryItem, CustomGroceryItem, IngredientCategory } from '../../types';
import { useGroceryStore } from '../../store/groceryStore';
import { useStoreStore } from '../../store/storeStore';
import { getCustomItems, addCustomItem, toggleCustomPurchase, deleteCustomItem } from '../../api/grocery';
import IngredientPickerSelect from '../common/IngredientPickerSelect';

const CATEGORIES: IngredientCategory[] = ['meat', 'produce', 'dairy', 'dry', 'canned', 'frozen', 'other'];

function GroceryRow({ item, onToggle }: { item: GroceryItem; onToggle: (id: number) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        opacity: item.is_purchased ? 0.5 : 1,
        background: item.is_purchased ? '#f9f9f9' : 'var(--surface)',
        transition: 'opacity 0.2s',
      }}
    >
      <input
        type="checkbox"
        checked={item.is_purchased === 1}
        onChange={() => onToggle(item.id)}
        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
      />
      <span style={{ flex: 1, fontWeight: 500, textDecoration: item.is_purchased ? 'line-through' : 'none' }}>
        {item.ingredient_name}
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        {Number(item.total_amount) % 1 === 0 ? Number(item.total_amount) : Number(item.total_amount).toFixed(2)} {item.unit}
      </span>
      {item.store_name && <span className="badge badge-store">{item.store_name}</span>}
    </div>
  );
}

export default function PanelGrocery() {
  const { items, fetch, toggle, categoryFilter, storeFilter, setCategoryFilter, setStoreFilter } = useGroceryStore();
  const { stores, fetch: fetchStores } = useStoreStore();
  const [customItems, setCustomItems] = useState<CustomGroceryItem[]>([]);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedIngName, setSelectedIngName] = useState('');

  useEffect(() => {
    fetch();
    fetchStores();
    getCustomItems().then(setCustomItems);
  }, []);

  useEffect(() => { fetch(); }, [categoryFilter, storeFilter]);

  async function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    const name = selectedIngName.trim();
    if (!name) return;
    const item = await addCustomItem(name);
    setCustomItems(prev => [...prev, item]);
    setSelectedIngId('');
    setSelectedIngName('');
  }

  async function handleToggleCustom(id: number) {
    const updated = await toggleCustomPurchase(id);
    setCustomItems(prev => prev.map(i => i.id === id ? updated : i));
  }

  async function handleDeleteCustom(id: number) {
    await deleteCustomItem(id);
    setCustomItems(prev => prev.filter(i => i.id !== id));
  }

  const grouped = CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const group = items
      .filter(i => i.category === cat)
      .sort((a, b) => (a.is_purchased ?? 0) - (b.is_purchased ?? 0));
    if (group.length > 0) acc[cat] = group;
    return acc;
  }, {});

  const total = items.length;
  const purchased = items.filter(i => i.is_purchased).length;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>Grocery List</h2>
        {total > 0 && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {purchased} / {total} purchased
          </span>
        )}
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <button className={`tag ${categoryFilter === '' ? 'active' : ''}`} onClick={() => setCategoryFilter('')}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} className={`tag ${categoryFilter === c ? 'active' : ''}`} onClick={() => setCategoryFilter(c)}>{c}</button>
          ))}
        </div>
        {stores.length > 0 && (
          <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
            <option value="">All stores</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>
          {items.length === 0 ? 'Stage some recipes to generate your grocery list.' : 'No items match the current filter.'}
        </p>
      )}

      {Object.entries(grouped).map(([cat, catItems]) => (
        <div key={cat} className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '8px 14px',
            background: 'var(--bg)',
            borderBottom: '1px solid var(--border)',
            fontWeight: 600,
            fontSize: 13,
            textTransform: 'capitalize',
            color: 'var(--primary)',
          }}>
            {cat}
          </div>
          {catItems.map(item => (
            <GroceryRow key={item.id} item={item} onToggle={toggle} />
          ))}
        </div>
      ))}

      {/* Custom / extra items — always shown */}
      <div className="card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '8px 14px',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          fontWeight: 600,
          fontSize: 13,
          color: 'var(--primary)',
        }}>
          Other Items
        </div>
        {customItems.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              opacity: item.is_purchased ? 0.5 : 1,
              background: item.is_purchased ? '#f9f9f9' : 'var(--surface)',
              transition: 'opacity 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={item.is_purchased === 1}
              onChange={() => handleToggleCustom(item.id)}
              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ flex: 1, fontWeight: 500, textDecoration: item.is_purchased ? 'line-through' : 'none' }}>
              {item.name}
            </span>
            <button
              className="btn-ghost"
              onClick={() => handleDeleteCustom(item.id)}
              style={{ fontSize: 16, padding: '2px 6px', color: 'var(--text-muted)' }}
            >
              ×
            </button>
          </div>
        ))}
        <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: 8, padding: '10px 14px', alignItems: 'flex-end' }}>
          <IngredientPickerSelect
            value={selectedIngId}
            onChange={(id, ing) => {
              setSelectedIngId(id);
              setSelectedIngName(ing?.name ?? '');
            }}
            onIngredientCreated={(ing) => {
              setSelectedIngId(String(ing.id));
              setSelectedIngName(ing.name);
            }}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" style={{ flexShrink: 0 }} disabled={!selectedIngName}>Add</button>
        </form>
      </div>
    </div>
  );
}
