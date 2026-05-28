// ============================================
// PROJECT PHOENIX — App Entry Point
// ============================================

import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/Auth/LoginScreen';
import Dashboard from './components/Dashboard/Dashboard';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-700 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs font-mono text-slate-600 tracking-[0.3em]">
            INITIALIZING...
          </p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <LoginScreen />;
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
