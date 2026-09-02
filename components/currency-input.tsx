'use client';

import { useEffect, useState } from 'react';
import { formatNumberInput, parseFormattedNumber, getCurrencySymbol } from '@/lib/format';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;
  onChange: (rawValue: string, numericValue: number) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  large?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className,
  autoFocus = false,
  large = false,
}: CurrencyInputProps) {
  const settings = useSettings();
  const symbol = getCurrencySymbol(settings.currency);
  const [display, setDisplay] = useState('');

  useEffect(() => {
    // If the value is a raw number string, format it
    if (value && !value.includes('.')) {
      setDisplay(formatNumberInput(value));
    } else if (value) {
      setDisplay(value);
    } else {
      setDisplay('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatNumberInput(raw);
    setDisplay(formatted);
    const numeric = parseFormattedNumber(formatted);
    onChange(String(numeric), numeric);
  };

  if (large) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-2xl font-bold text-muted-foreground">{symbol}</span>
        <input
          type="text"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            'w-auto bg-transparent text-center text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40',
            className
          )}
          style={{ width: `${Math.max(60, (display || '').length * 24)}px` }}
          autoFocus={autoFocus}
          inputMode="numeric"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        {symbol}
      </span>
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        autoFocus={autoFocus}
        inputMode="numeric"
      />
    </div>
  );
}
