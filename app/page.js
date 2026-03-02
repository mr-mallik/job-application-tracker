'use client';

import { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import Loader from '@/components/Loader';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <Loader message="Loading your applications..." />;
  }

  if (!user) {
    return (
      <AuthPage
        onLogin={(u, t) => {
          setUser(u);
          setToken(t);
        }}
      />
    );
  }

  return (
    <>
      <Header
        user={user}
        currentPath="/"
        onLogout={() => {
          localStorage.clear();
          setUser(null);
          setToken(null);
        }}
      />
      <Dashboard
        user={user}
        token={token}
        onLogout={() => {
          localStorage.clear();
          setUser(null);
          setToken(null);
        }}
        onUserUpdate={setUser}
      />
    </>
  );
}
