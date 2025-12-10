import { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { TodayContainer } from './features/today/TodayContainer';
import { HistoryView } from './features/history/HistoryView';
import { SettingsView } from './features/settings/SettingsView';

type View = 'today' | 'history' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('today');

  const renderView = () => {
    switch (currentView) {
      case 'today':
        return <TodayContainer />;
      case 'history':
        return <HistoryView onNavigateToToday={() => setCurrentView('today')} />;
      case 'settings':
        return <SettingsView onNavigateToToday={() => setCurrentView('today')} />;
      default:
        return <TodayContainer />;
    }
  };

  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AppLayout>
  );
}

export default App;
