import { useState, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import PanelStaging from './components/panel-staging/PanelStaging';
import PanelGrocery from './components/panel-grocery/PanelGrocery';
import LibraryPanel from './components/library/LibraryPanel';
import AuthGate from './components/auth/AuthGate';
import { useAuthStore } from './store/authStore';

type Tab = 'plan' | 'grocery' | 'library';

export default function App() {
  const [tab, setTab] = useState<Tab>('plan');
  const { checkAuth, setUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
    const handleUnauth = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauth);
    return () => window.removeEventListener('auth:unauthorized', handleUnauth);
  }, []);

  return (
    <AuthGate>
      <AppShell tab={tab} setTab={setTab}>
        <div style={{ display: tab === 'plan' ? 'block' : 'none' }}><PanelStaging /></div>
        {tab === 'grocery' && <PanelGrocery />}
        {tab === 'library' && <LibraryPanel />}
      </AppShell>
    </AuthGate>
  );
}
