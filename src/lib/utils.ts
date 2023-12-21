import { Dictionary, CustomErrorMessageTypes } from '@/dictionaries/en';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { z } from 'zod';

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

/**
 * Function to split gas price between persons.
 *
 * @param tripLength
 * @param gasPrice
 * @param consumption
 * @param persons
 * @returns {GasPriceInfo}
 */
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

/**
 * Zod schema to convert string to number. Accepts comma and dot as decimal separator.
 */
export const stringToNumber = z.coerce
  .string()
  .refine((val) => /^[0-9]+([,.][0-9]+)?$/.test(val), {
    params: { type: 'customStringToNumber' },
  })
  .transform((val) => Number(val.replace(',', '.')));

/**
 * Get Zod with localised error messages.
 *
 * @param {Dictionary} dictionary
 * @returns {Zod} zod with localised error messages
 */
export function getZodWithLocaleErrors(dictionary: Dictionary) {
  const messages = dictionary.errorMessages;

  const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
    if (issue.code === z.ZodIssueCode.custom) {
      const { type }: { type?: CustomErrorMessageTypes } = issue.params || {};
      if (!type) return { message: ctx.defaultError };
      const message = messages?.[type] || ctx.defaultError;
      return { message };
    }
    return { message: ctx.defaultError };
  };

  z.setErrorMap(customErrorMap);
  return z;
}
