import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const instagram = defineCollection({
  // Loads all .json files in the src/content/instagram folder
  loader: glob({ pattern: '*.json', base: './src/content/instagram' }),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      shortcode: z.string(),
      caption: z.string().optional(),
      permalink: z.string().url(),
      timestamp: z.coerce.date(),
      mediaType: z.enum(['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM']),
      // Astro's image helper automatically resolves local relative paths
      localImage: image().optional(),
      localImages: z.array(image()).optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { instagram };
