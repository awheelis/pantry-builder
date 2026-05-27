import { useEffect, useState } from 'react';
import { useStoreStore } from '../../store/storeStore';

export default function StoreManager() {
  const { stores, fetch, create, update, remove } = useStoreStore();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => { fetch(); }, []);

  async function add() {
    if (!newName.trim()) return;
    await create(newName.trim());
    setNewName('');
  }

  async function save(id: number) {
    if (!editName.trim()) return;
    await update(id, editName.trim());
    setEditId(null);
  }

  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Stores</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Store name" onKeyDown={e => e.key === 'Enter' && add()} />
        <button className="btn-primary" onClick={add}>Add</button>
      </div>
      {stores.map(s => (
        <div key={s.id} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          {editId === s.id ? (
            <>
              <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} autoFocus onKeyDown={e => e.key === 'Enter' && save(s.id)} />
              <button className="btn-primary" onClick={() => save(s.id)}>Save</button>
              <button className="btn-ghost" onClick={() => setEditId(null)}>Cancel</button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }}>{s.name}</span>
              <button className="btn-ghost" onClick={() => { setEditId(s.id); setEditName(s.name); }}>Edit</button>
              <button className="btn-danger" onClick={() => remove(s.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
      {stores.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No stores yet.</p>}
    </div>
  );
}
