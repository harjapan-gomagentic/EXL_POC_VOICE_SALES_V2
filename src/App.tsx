import { AppProvider, useApp } from './context/AppContext';
import Login from './screens/Login';
import HowItWorks from './screens/HowItWorks';
import Brief from './screens/Brief';
import CallBlueprint from './screens/CallBlueprint';
import Replay from './screens/Replay';
import Scorecard from './screens/Scorecard';

function Router() {
  const { state } = useApp();
  if (state.screen === 'how_it_works') return <HowItWorks />;
  if (state.screen === 'brief') return <Brief />;
  if (state.screen === 'call') return <CallBlueprint />;
  if (state.screen === 'replay') return <Replay />;
  if (state.screen === 'scorecard') return <Scorecard />;
  return <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <div className="app-viewport">
        <Router />
      </div>
    </AppProvider>
  );
}
