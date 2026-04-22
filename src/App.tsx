import { AppProvider, useApp } from './context/AppContext';
import Login from './screens/Login';
import Brief from './screens/Brief';
import Call from './screens/Call';

function Router() {
  const { state } = useApp();
  if (state.screen === 'brief') return <Brief />;
  if (state.screen === 'call') return <Call />;
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
