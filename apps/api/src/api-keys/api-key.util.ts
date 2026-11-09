import { createHash, randomBytes } from 'node:crypto';

export const API_KEY_PREFIX = 'lk_';
const DISPLAY_PREFIX_CHARS = 8;

export interface GeneratedApiKey {
  plain: string;
  hash: string;
  prefix: string;
}

export function hashApiKey(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
}

export function generateApiKey(): GeneratedApiKey {
  const plain = `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
  return { plain, hash: hashApiKey(plain), prefix: plain.slice(0, DISPLAY_PREFIX_CHARS) };
}
