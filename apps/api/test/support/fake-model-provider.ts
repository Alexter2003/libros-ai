import { ModelProvider } from '../../src/ai/providers/model-provider';

export function fakeProvider(parts: Partial<ModelProvider> = {}): ModelProvider {
  return {
    generate: () => Promise.reject(new Error('generate is not scripted')),
    converse: () => Promise.reject(new Error('converse is not scripted')),
    ...parts,
  };
}
