import { useState, useEffect } from 'react';
import type { StagedRecipe, Breakdown } from '../../types';
import { useStagingStore } from '../../store/stagingStore';
import { useGroceryStore } from '../../store/groceryStore';
import { getBreakdown } from '../../api/recipes';
import ProgressBar from '../common/ProgressBar';
import CookBreakdown from './CookBreakdown';
import IngredientSubstitutor from './IngredientSubstitutor';

interface Props { staged: StagedRecipe; }

export default function StagedRecipeCard({ staged }: Props) {
  const { unstage, updateScale } = useStagingStore();
  const fetchGrocery = useGroceryStore(s => s.fetch);
  const [scale, setScale] = useState(String(staged.scale_factor));
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    getBreakdown(staged.id).then(d => setProgress(d.progress));
  }, [staged.id]);

  async function handleScale() {
    const n = Number(scale);
    if (n > 0 && n !== staged.scale_factor) {
      await updateScale(staged.id, n);
      await fetchGrocery();
    }
  }

  async function handleUnstage() {
    await unstage(staged.id);
    await fetchGrocery();
  }

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{staged.recipe_name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Serves {(staged.serving_size * staged.scale_factor).toFixed(2).replace(/\.?0+$/, '')}
          </div>
          {progress !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Ready</span>
              <ProgressBar value={progress} />
              <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{progress}%</span>
            </div>
          )}
        </div>
        <button className="btn-ghost" style={{ color: 'var(--danger)' }} onClick={handleUnstage}>✕</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
        <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Scale ×</label>
        <input
          type="number"
          min="0.25"
          step="0.25"
          value={scale}
          onChange={e => setScale(e.target.value)}
          onBlur={handleScale}
          onKeyDown={e => e.key === 'Enter' && handleScale()}
          style={{ width: 80 }}
        />
        <button className="btn-secondary" onClick={() => setShowBreakdown(true)}>Cook view</button>
        <button className="btn-secondary" onClick={() => setShowSubs(true)}>Swap ingredients</button>
      </div>

      {showBreakdown && <CookBreakdown staged={staged} onClose={() => setShowBreakdown(false)} />}
      {showSubs && <IngredientSubstitutor staged={staged} onClose={() => setShowSubs(false)} />}
    </div>
  );
}
