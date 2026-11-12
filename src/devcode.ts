import { sha256 } from './sha256.ts';

/** SHA-256 of the developer code (the code itself is never stored in the repo). */
export const DEV_CODE_HASH = '9396fc9ba70ad965adfb6091e93e7ac2b8dd43c7c4f9fbcde27238517d2bf334';

/** Upper-case and drop everything except letters and digits, so dashes/spaces/case do not matter. */
export const normalizeCode = (input: string) => input.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const verifyDevCode = (input: string, hash = DEV_CODE_HASH) => {
  const n = normalizeCode(input);
  return n.length > 0 && sha256(n) === hash;
};
