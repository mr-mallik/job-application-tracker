'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="space-y-6 text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 flex items-center justify-center animate-spin">
              <Image
                src="/assets/logo/jobtracker-logo.png"
                alt="Job Tracker Logo"
                width={96}
                height={96}
                priority
                className="drop-shadow-lg"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Image
              src="/assets/logo/jobtracker-text.png"
              alt="Job Application Tracker"
              width={300}
              height={40}
              priority
              className="mx-auto"
            />
            <p className="text-sm text-muted-foreground">Loading your applications...</p>
          </div>
        </div>
      </div>
    );
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
