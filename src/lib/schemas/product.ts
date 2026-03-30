import { z } from 'zod';

export const ProductSchema = z.object({
  name: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  price: z.number().nonnegative(),
  featured: z.boolean().default(false),
  tags: z.array(z.string().trim().min(1)).default([]),
});

export type Product = z.infer<typeof ProductSchema>;

export const StructuredSchemaRegistry = {
  product: ProductSchema,
} as const;

export type StructuredSchemaName = keyof typeof StructuredSchemaRegistry;

export function resolveStructuredSchema(schemaName: string) {
  const schema = StructuredSchemaRegistry[schemaName as StructuredSchemaName];
  if (!schema) {
    throw new Error(`Invalid schema selection: ${schemaName}`);
  }

  return schema;
}
