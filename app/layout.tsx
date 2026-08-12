import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { MonthProvider } from '@/hooks/use-month';
import { BottomNav } from '@/components/bottom-nav';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Budget — Personal Finance Manager',
  description:
    'A premium personal budget manager. Track spending, manage budgets, and reach savings goals.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budget',
  },
  formatDetection: {
    telephone: false,
  },
  themeColor: '#0a0f1c',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <MonthProvider>
            <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background">
              <main className="flex-1 pb-24">{children}</main>
              <BottomNav />
            </div>
            <Toaster position="top-center" />
          </MonthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
