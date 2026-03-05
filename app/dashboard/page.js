'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!t || !u) {
      router.replace('/auth/login');
      return;
    }
    setToken(t);
    setUser(JSON.parse(u));
  }, [router]);

  if (!user) return null;

  return (
    <Dashboard
      user={user}
      token={token}
      onLogout={() => {
        localStorage.clear();
        router.replace('/');
      }}
      onUserUpdate={(updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }}
    />
  );
}
