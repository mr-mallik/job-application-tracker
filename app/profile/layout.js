'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  FolderOpen,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/Header';

const navigation = [
  { name: 'Basic Information', href: '/profile/basic', icon: User },
  { name: 'Work Experience', href: '/profile/experience', icon: Briefcase },
  { name: 'Qualifications', href: '/profile/education', icon: GraduationCap },
  { name: 'Skills', href: '/profile/skills', icon: Code },
  { name: 'Projects', href: '/profile/projects', icon: FolderOpen },
  { name: 'Account Settings', href: '/profile/settings', icon: Settings, destructive: true },
];

export default function ProfileLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Header user={user} currentPath={pathname} onLogout={handleLogout} />
      <div className="flex min-h-[calc(100vh-3.5rem)] max-w-7xl mx-auto">
        <aside className="w-64 border-r bg-muted/10 p-4 hidden md:block fixed top-20 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                    isActive
                      ? 'bg-primary/10 text-primary hover:bg-primary/15'
                      : 'text-muted-foreground hover:text-foreground',
                    item.destructive &&
                      !isActive &&
                      'hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      item.destructive && !isActive && 'text-destructive/70'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation - Horizontal Tabs */}
        <div className="md:hidden w-full border-b bg-background px-4 py-2 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    item.destructive &&
                      !isActive &&
                      'hover:bg-destructive/10 hover:text-destructive'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto md:ml-64">
          <div className="container max-w-5xl py-6 px-4 md:px-6">{children}</div>
        </main>
      </div>
    </>
  );
}
