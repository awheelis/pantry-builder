import type { ReactNode } from 'react';

type Tab = 'plan' | 'grocery' | 'library';

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  children: ReactNode;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'plan', label: 'Cook Plan' },
  { id: 'grocery', label: 'Grocery List' },
  { id: 'library', label: 'Library' },
];

export default function AppShell({ tab, setTab, children }: Props) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow)',
      }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)' }}>Pantry Builder</span>
        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: tab === t.id ? 'var(--primary-light)' : 'transparent',
                color: tab === t.id ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: tab === t.id ? 600 : 400,
                border: 'none',
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                fontSize: 14,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main style={{ flex: 1, padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
