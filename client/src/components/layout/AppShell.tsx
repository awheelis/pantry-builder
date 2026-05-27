import type { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';

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
  const { user, logout } = useAuthStore();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header">
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary)', whiteSpace: 'nowrap' }}>Pantry Builder</span>
        <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'none' }} className="user-email">{user?.email}</span>
          <button className="btn-ghost" style={{ fontSize: 13 }} onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
