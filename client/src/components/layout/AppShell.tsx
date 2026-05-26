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
      <header className="app-header">
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', whiteSpace: 'nowrap' }}>Pantry Builder</span>
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
                borderRadius: 'var(--radius)',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
