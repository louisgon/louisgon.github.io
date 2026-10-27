import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: file('src/content/projects.json'),
  schema: z.object({
    id: z.string(),
    order: z.number().int().positive(),
    title: z.string(),
    team: z.string(),
    url: z.url(),
    stack: z.array(z.string()),
    fact: z.string(),
    story: z.object({ brief: z.string(), did: z.string(), result: z.string() }).optional(),
  }),
});

export const collections = { projects };
