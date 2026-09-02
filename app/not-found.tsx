'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-sm font-medium text-muted-foreground">Page not found</p>
      <h1 className="text-2xl font-bold">That page does not exist</h1>
      <Button asChild>
        <Link href="/">Return to dashboard</Link>
      </Button>
    </main>
  );
}
