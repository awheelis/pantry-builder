import { useState } from 'react';
import AppShell from './components/layout/AppShell';
import PanelStaging from './components/panel-staging/PanelStaging';
import PanelGrocery from './components/panel-grocery/PanelGrocery';
import LibraryPanel from './components/library/LibraryPanel';

type Tab = 'plan' | 'grocery' | 'library';

export default function App() {
  const [tab, setTab] = useState<Tab>('plan');

  return (
    <AppShell tab={tab} setTab={setTab}>
      {tab === 'plan' && <PanelStaging />}
      {tab === 'grocery' && <PanelGrocery />}
      {tab === 'library' && <LibraryPanel />}
    </AppShell>
  );
}
