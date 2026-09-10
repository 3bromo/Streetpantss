import { Collection } from '../lib/types'

/** THE FINAL system: exactly three collections, matching the three categories. */
export const collections: Collection[] = [
  {
    slug: 'wide-leg',
    title: 'Wide Leg',
    tagline: 'Volume as a statement.',
    description: 'Floor-skimming legs and high rises. Proportion pushed to the edge.',
    image: '/images/col-wideleg.jpg',
  },
  {
    slug: 'street-pants',
    title: 'Street Pants',
    tagline: 'The core of the rotation.',
    description:
      'Heavyweight twill, clean lines and utility done right. The pairs you reach for every single day.',
    image: '/images/col-cargo.jpg',
  },
  {
    slug: 'old-money',
    title: 'Old Money',
    tagline: 'Quiet luxury, street cut.',
    description: 'Soft tones, tailored drape and zero noise. Elegance that speaks quietly.',
    image: '/images/col-essentials.jpg',
  },
]

export function getCollection(slug: string): Collection | undefined {
  return collections.find((c) => c.slug === slug)
}
