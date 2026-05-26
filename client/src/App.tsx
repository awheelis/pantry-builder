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
      <div style={{ display: tab === 'plan' ? 'block' : 'none' }}><PanelStaging /></div>
      <div style={{ display: tab === 'grocery' ? 'block' : 'none' }}><PanelGrocery /></div>
      <div style={{ display: tab === 'library' ? 'block' : 'none' }}><LibraryPanel /></div>
    </AppShell>
  );
}
