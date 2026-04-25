import { z } from 'zod';

export const AssertionSchema = z.object({
  type: z.enum(['contains', 'notContains', 'regex', 'length', 'custom']),
  value: z.string(),
  description: z.string().optional(),
});

export const FixtureSchema = z.object({
  id: z.string().min(1),
  description: z.string().optional(),
  modality: z.enum(['text', 'image', 'speech', 'video']),
  input: z.object({
    prompt: z.string().min(1),
    modelId: z.string().optional(),
  }),
  assertions: z.array(AssertionSchema).min(1, 'At least one assertion is required'),
  tags: z.array(z.string()).optional(),
  enabled: z.boolean().default(true),
});

export type Fixture = z.infer<typeof FixtureSchema>;
export type Assertion = z.infer<typeof AssertionSchema>;
export type AssertionType = Assertion['type'];

export function validateFixtures(data: unknown): Fixture[] {
  const parsed = z.array(FixtureSchema).safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues ?? [];
    const errors = issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    throw new Error(`Fixture validation failed: ${errors}`);
  }
  return parsed.data;
}