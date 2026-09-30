import React, { useEffect, useState } from 'react';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import Home from './pages/Home';
import { getMe, getStoredUser, getToken, logout } from './services/auth';

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [checking, setChecking] = useState(Boolean(getToken()));
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }

    getMe()
      .then(setUser)
      .catch(() => {
        logout();
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  function handleLogout() {
    logout();
    setUser(null);
    setShowAuth(false);
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">正在確認登入狀態…</div>;
  }

  if (!user) {
    return showAuth
      ? <AuthPage onAuthenticated={setUser} onBack={() => setShowAuth(false)} />
      : <Home onStart={() => setShowAuth(true)} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
