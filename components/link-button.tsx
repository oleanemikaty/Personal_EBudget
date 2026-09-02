'use client';

import Link from 'next/link';
import { Button, type ButtonProps } from '@/components/ui/button';

export function LinkButton({
  href,
  children,
  ...props
}: ButtonProps & { href: string }) {
  return (
    <Link href={href}>
      <Button {...props}>{children}</Button>
    </Link>
  );
}
