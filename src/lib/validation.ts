import * as z from 'zod';

export const float = z
  .custom<number>(
    (value) => {
      let res = false;
      if (typeof value === 'number') {
        res = value > 0 ? true : false;
      }
      if (typeof value === 'string' && !isNaN(Number(value))) {
        res = Number(value) > 0 ? true : false;
      }
      return res;
    },
    { message: 'Must be a positive number' }
  )
  .transform((value) => Number(value));
