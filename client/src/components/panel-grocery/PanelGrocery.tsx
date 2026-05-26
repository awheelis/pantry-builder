import { useEffect, useState } from 'react';
import type { GroceryItem, IngredientCategory, Store } from '../../types';
import { useGroceryStore } from '../../store/groceryStore';
import { getStores } from '../../api/stores';

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
        {item.total_amount % 1 === 0 ? item.total_amount : item.total_amount.toFixed(2)} {item.unit}
      </span>
      {item.store_name && <span className="badge badge-store">{item.store_name}</span>}
    </div>
  );
}

export default function PanelGrocery() {
  const { items, fetch, toggle, categoryFilter, storeFilter, setCategoryFilter, setStoreFilter } = useGroceryStore();
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    fetch();
    getStores().then(setStores);
  }, []);

  useEffect(() => { fetch(); }, [categoryFilter, storeFilter]);

  const grouped = CATEGORIES.reduce<Record<string, GroceryItem[]>>((acc, cat) => {
    const group = items.filter(i => i.category === cat);
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
    </div>
  );
}
