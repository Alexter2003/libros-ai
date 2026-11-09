import { describe, expect, it } from 'vitest';
import { SimilarItem } from '../../src/ai/embeddings/embeddings.service';
import { buildRagPrompt, filterRelevant } from '../../src/chat/rag-prompt';

const base: SimilarItem = {
  id: 'i1',
  title: 'Saga',
  author: 'Brian K. Vaughan',
  kind: 'COMIC',
  genre: 'Fantasy',
  year: 2012,
  series: 'Saga',
  synopsis: 'A couple flees across the galaxy.',
  score: 0.7,
};

describe('rag prompt', () => {
  it('keeps only items at or above the minimum similarity', () => {
    const items = [base, { ...base, id: 'i2', score: 0.1 }];
    expect(filterRelevant(items, 0.3).map((candidate) => candidate.id)).toEqual(['i1']);
  });

  it('includes the items, the conversation and the question', () => {
    const prompt = buildRagPrompt({
      items: [base],
      history: [
        { role: 'USER', content: 'earlier question' },
        { role: 'ASSISTANT', content: 'earlier answer' },
      ],
      question: 'current question',
    });
    expect(prompt).toContain('Saga');
    expect(prompt).toContain('Brian K. Vaughan');
    expect(prompt).toContain('User: earlier question');
    expect(prompt).toContain('Assistant: earlier answer');
    expect(prompt).toContain('Question: current question');
  });
});
