import { useEffect, useState } from 'react';
import type { Breakdown, StagedRecipe } from '../../types';
import { getBreakdown } from '../../api/recipes';
import ProgressBar from '../common/ProgressBar';

interface Props {
  staged: StagedRecipe;
  onClose: () => void;
}

export default function CookBreakdown({ staged, onClose }: Props) {
  const [data, setData] = useState<Breakdown | null>(null);

  useEffect(() => {
    getBreakdown(staged.id).then(setData);
  }, [staged.id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{staged.recipe_name} — Cook Breakdown</h2>
          <button className="btn-ghost" onClick={onClose}>✕</button>
        </div>
        {data && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ready</span>
              <ProgressBar value={data.progress} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{data.progress}%</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', fontWeight: 500 }}>Ingredient</th>
                  <th style={{ textAlign: 'right', padding: '6px 8px', fontWeight: 500 }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '6px 0', fontWeight: 500 }}>Purchased</th>
                </tr>
              </thead>
              <tbody>
                {data.ingredients.map(ing => (
                  <tr key={ing.ri_id} style={{ borderBottom: '1px solid var(--border)', opacity: ing.is_purchased ? 0.5 : 1 }}>
                    <td style={{ padding: '8px 0' }}>
                      {ing.is_substituted ? (
                        <span>
                          <span className="strikethrough">{ing.original_ingredient_name}</span>
                          {' → '}
                          <strong>{ing.ingredient_name}</strong>
                        </span>
                      ) : ing.ingredient_name}
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 8px', tabularNums: true } as React.CSSProperties}>
                      {ing.scaled_amount} {ing.unit}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 0' }}>
                      {ing.is_purchased ? '✓' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {!data && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}
      </div>
    </div>
  );
}
