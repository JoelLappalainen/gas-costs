import { type ClassValue, clsx } from 'clsx';
import { useEffect, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type GasPriceInfo = {
  totalGasCost: number;
  gasCostPerPerson: number;
  details: {
    tripLength: number;
    gasPrice: number;
    consumption: number;
    persons: number;
  };
};

export function splitGasPrice(
  tripLength: number,
  gasPrice: number,
  consumption: number,
  persons: number
): GasPriceInfo {
  const gasCost = (tripLength / 100) * consumption * gasPrice;
  const gasCostPerPerson = gasCost / persons;

  return {
    totalGasCost: gasCost,
    gasCostPerPerson,
    details: {
      tripLength,
      gasPrice,
      consumption,
      persons,
    },
  };
}
