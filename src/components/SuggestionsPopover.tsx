'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Command, CommandGroup, CommandItem } from '@/components/ui/command';

import { Popover, PopoverContent } from '@/components/ui/popover';

import { Anchor } from '@radix-ui/react-popover';
import { Prediction } from '@/lib/google';

export function SuggestionsPopover({
  open,
  setOpen,
  suggestions,
  selectedSuggestionId,
  setSelectedSuggestionId,
  setInputValue,
  clearErrors,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  suggestions: Prediction[];
  selectedSuggestionId: string;
  setSelectedSuggestionId: (id: string) => void;
  setInputValue: (value: string) => void;
  clearErrors: () => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Anchor />
      <PopoverContent
        className="w-[300px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandGroup>
            {suggestions.map((suggestion) => (
              <CommandItem
                value={suggestion.description}
                key={suggestion.place_id}
                onSelect={() => {
                  setSelectedSuggestionId(suggestion.place_id);
                  setInputValue(suggestion.description);
                  clearErrors();
                  setTimeout(() => setOpen(false), 600);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    suggestion.place_id === selectedSuggestionId
                      ? 'opacity-100'
                      : 'opacity-0'
                  )}
                />
                {suggestion.description}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
