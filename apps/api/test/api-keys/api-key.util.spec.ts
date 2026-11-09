import { describe, expect, it } from 'vitest';
import { generateApiKey, hashApiKey } from '../../src/api-keys/api-key.util';

describe('api key util', () => {
  it('hashes deterministically', () => {
    expect(hashApiKey('lk_abc')).toBe(hashApiKey('lk_abc'));
    expect(hashApiKey('lk_abc')).not.toBe(hashApiKey('lk_abd'));
  });

  it('never stores the plain key in the hash or prefix', () => {
    const key = generateApiKey();
    expect(key.hash).not.toContain(key.plain);
    expect(key.hash).toBe(hashApiKey(key.plain));
    expect(key.plain.startsWith(key.prefix)).toBe(true);
    expect(key.prefix.length).toBeLessThan(key.plain.length);
  });

  it('generates unique keys with the expected format', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateApiKey().plain));
    expect(keys.size).toBe(50);
    for (const plain of keys) expect(plain).toMatch(/^lk_[A-Za-z0-9_-]{43}$/);
  });
});
