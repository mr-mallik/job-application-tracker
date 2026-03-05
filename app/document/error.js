'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DocumentError({ error, reset }) {
  useEffect(() => {
    console.error('[DocumentError boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-semibold text-destructive">Something went wrong</h2>
      <pre className="text-xs bg-muted rounded p-4 max-w-2xl overflow-auto whitespace-pre-wrap">
        {error?.message || String(error)}
        {'\n\n'}
        {error?.stack}
      </pre>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
