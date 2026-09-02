'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, Plus, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/income', label: 'Income', icon: TrendingUp },
  { href: '/quick-add', label: 'Add', icon: Plus, isCenter: true },
  { href: '/transactions', label: 'Activity', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-20" />;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div className="nav-glass w-full max-w-md border-t border-border/50 safe-bottom">
        <div className="flex items-end justify-around px-2 pt-2 pb-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            if (item.isCenter) {
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className="flex flex-col items-center gap-1 -mt-6"
                  aria-label={item.label}
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.5} />
                  </motion.div>
                </button>
              );
            }

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="flex flex-1 flex-col items-center gap-1 py-1"
                aria-label={item.label}
              >
                <div className="relative flex h-8 w-12 items-center justify-center rounded-xl">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <Icon
                    className={cn(
                      'relative h-5 w-5 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    strokeWidth={2}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
