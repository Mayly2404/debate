import React from 'react';
import { useSyncedState } from './hooks/useSyncedState';
import { useSoundEffects } from './components/SoundManager';
import DisplayPage from './pages/DisplayPage';
import HostPage from './pages/HostPage';
import TeamPage from './pages/TeamPage';
import UserPage from './pages/UserPage';

export default function App() {
  const route = window.__APP_ROUTE__ || 'display';
  const { state, actions, scoreSummary, statsSummary } = useSyncedState();
  useSoundEffects(state);

  if (route === 'host') return <HostPage state={state} actions={actions} />;
  if (route === 'ungho') return <TeamPage state={state} actions={actions} team="support" />;
  if (route === 'phandoi') return <TeamPage state={state} actions={actions} team="oppose" />;
  if (route === 'user') return <UserPage state={state} actions={actions} />;
  return <DisplayPage state={state} scoreSummary={scoreSummary} statsSummary={statsSummary} />;
}
