import { describe, expect, it } from 'vitest';
import { ProductSchema, resolveStructuredSchema } from './product';

describe('ProductSchema', () => {
  it('parses valid product data', () => {
    expect(
      ProductSchema.parse({
        name: 'Task Prism',
        summary: 'A compact AI workflow tracker.',
        price: 12,
        featured: true,
        tags: ['ai', 'productivity'],
      })
    ).toEqual({
      name: 'Task Prism',
      summary: 'A compact AI workflow tracker.',
      price: 12,
      featured: true,
      tags: ['ai', 'productivity'],
    });
  });

  it('rejects invalid schema selections', () => {
    expect(() => resolveStructuredSchema('unknown')).toThrow('Invalid schema selection: unknown');
  });
});
