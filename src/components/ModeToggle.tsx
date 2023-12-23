'use client';

import * as React from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dictionary } from '@/dictionaries/en';

export function ModeToggle({
  dictionary,
  className,
}: {
  dictionary: Dictionary;
  className?: string;
}) {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={className}>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{dictionary.srThemeMenu}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ml-2">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="text-base"
        >
          {dictionary.light}
          {theme === 'light' && <SelectedCheckmark />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="text-base"
        >
          {dictionary.dark}
          {theme === 'dark' && <SelectedCheckmark />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="text-base"
        >
          {dictionary.system}
          {theme === 'system' && <SelectedCheckmark />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectedCheckmark() {
  return (
    <Check
      className="absolute right-2 top-1/2 -translate-y-1/2 transform"
      size="1rem"
    />
  );
}
