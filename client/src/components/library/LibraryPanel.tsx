import { useState } from 'react';
import IngredientLibrary from './IngredientLibrary';
import StoreManager from './StoreManager';

type Sub = 'ingredients' | 'stores';

export default function LibraryPanel() {
  const [sub, setSub] = useState<Sub>('ingredients');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['ingredients', 'stores'] as Sub[]).map(s => (
          <button
            key={s}
            className={sub === s ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setSub(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {sub === 'ingredients' && <IngredientLibrary />}
      {sub === 'stores' && <StoreManager />}
    </div>
  );
}
