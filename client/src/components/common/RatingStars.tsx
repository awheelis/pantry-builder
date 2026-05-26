interface Props {
  value: number | null;
  onChange?: (v: number) => void;
  label?: string;
}

export default function RatingStars({ value, onChange, label }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {label && <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 60 }}>{label}</span>}
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          className="btn-ghost"
          style={{
            padding: '2px 4px',
            color: value != null && n <= value ? '#f39c12' : 'var(--border)',
            fontSize: 18,
          }}
          onClick={() => onChange?.(n)}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  );
}
