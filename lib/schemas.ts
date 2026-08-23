import { z } from 'zod';
import { USER_ROLES } from '@/types/database';

// Reused across every route that accepts an email address.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.');

export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters.');

// Client-supplied "which portfolio pieces prompted this enquiry" list — never
// trusted verbatim, capped and trimmed the same way on every route that takes it.
export const portfolioItemRefSchema = z.object({
  id: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().max(50).default(''),
});
export const portfolioItemRefsSchema = z
  .array(z.unknown())
  .transform((items) =>
    items
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .slice(0, 20)
  )
  .pipe(z.array(portfolioItemRefSchema))
  .nullable()
  .optional();

// A design-review/proofreading mark pinned to a specific proof image at a
// normalized (0-1) x/y position. `imageCount` bounds `image_index` to the
// actual number of images on the revision being commented on.
export function designCommentsSchema(imageCount: number) {
  return z
    .array(
      z.object({
        image_index: z.number().int().min(0).max(Math.max(imageCount - 1, 0)),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        comment: z.string().trim().min(1).max(2000),
      })
    )
    .max(200);
}

export const userRoleSchema = z.enum(USER_ROLES as unknown as [string, ...string[]]);

// A designer/admin uploading a new proof — one or more R2 image URLs plus optional notes.
export const designUploadSchema = z.object({
  imageUrls: z
    .array(z.string().trim().min(1).max(2000))
    .min(1, 'At least one image URL is required.')
    .max(50),
  // Positionally matched to imageUrls, e.g. "Thank You Card" — lets a bundled
  // order's proofs (several products in one upload) be told apart on the
  // review tabs instead of just "Image 1, Image 2, ...".
  imageLabels: z.array(z.string().trim().max(200).nullable()).max(50).nullish(),
  notes: z.string().trim().max(5000).nullish(),
});

export const commentResolutionSchema = z.object({
  field: z.enum(['designer_resolved', 'proofreader_resolved']),
  value: z.boolean(),
});

// The `comments` array's per-item `image_index` bound depends on how many
// images the specific revision being reviewed has, which is only known once
// the route has fetched it — so the top-level action/shape is validated
// eagerly, and `comments` (still present but unvalidated in detail here) is
// re-checked against designCommentsSchema(imageCount) once that's known.
export function proofreadBodySchema<const T extends readonly [string, ...string[]]>(actions: T) {
  return z.object({
    action: z.enum(actions),
    comments: z.array(z.unknown()).optional(),
  });
}

const PORTFOLIO_CATEGORIES = ['wedding', 'funeral', 'sports', 'branding', 'events'] as const;

// Shared by the admin create/update portfolio-item routes. `filters` is an
// open bag of named tag groups (style, passion, …) so it's validated shape
// (string keys -> bounded string arrays) rather than an exact key set.
// Every field is optional — this is a save-as-you-go draft form (see
// upsertOrderForm), only `deceased_name` becomes required at submit time,
// checked separately in the route since that depends on the `submit` flag.
export const orderFormInputSchema = z.object({
  deceased_name: z.string().trim().max(200).nullish(),
  funeral_date: z.string().trim().max(50).nullish(),
  funeral_time: z.string().trim().max(50).nullish(),
  venue_name: z.string().trim().max(300).nullish(),
  date_of_birth: z.string().trim().max(50).nullish(),
  date_of_death: z.string().trim().max(50).nullish(),
  age_of_deceased: z.string().trim().max(50).nullish(),
  photo_option: z.enum(['none', 'colour', 'bw']).nullish(),
  bespoke_design: z.boolean().optional(),
  bespoke_details: z.string().trim().max(5000).nullish(),
  number_of_pages: z.string().trim().max(50).nullish(),
  inside_pages_style: z.enum(['bw', 'match_cover']).nullish(),
  quantity: z.string().trim().max(50).nullish(),
  photo_qty: z.number().int().min(0).max(1000).nullish(),
  photo_supplied_via: z.enum(['email', 'post']).nullish(),
  photo_instructions: z.string().trim().max(2000).nullish(),
  additional_products: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(200),
        title: z.string().trim().min(1).max(300),
        size: z.string().trim().min(1).max(100),
        quantity: z.number().int().min(1).max(10000),
      })
    )
    .max(50)
    .nullish(),
  callback_requested: z.boolean().optional(),
  callback_phone: z.string().trim().max(50).nullish(),
  additional_notes: z.string().trim().max(5000).nullish(),
  backpage_information: z.string().trim().max(5000).nullish(),
  attachment_url: z.string().trim().max(2000).nullish(),
});

export const portfolioItemInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(300),
  category: z.enum(PORTFOLIO_CATEGORIES),
  description: z.string().trim().max(2000).nullish(),
  location: z.string().trim().max(200).nullish(),
  image_url: z.string().trim().min(1, 'An image is required.').max(2000),
  image_urls: z.array(z.string().trim().max(2000)).max(20).nullish(),
  filters: z.record(z.string(), z.array(z.string().max(100)).max(50)).optional(),
  template_number: z.string().trim().max(50).nullish(),
  published: z.boolean().optional(),
});

// Shared by the admin create/update product routes — same shape/style as
// portfolioItemInputSchema. `slug` is unique per product (products are
// addressed by slug in URLs, unlike portfolio items which use id).
const productSizeSchema = z.object({
  label: z.string().trim().min(1).max(100),
  dimensions: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
});

const slugPattern = /^[a-z0-9-]+$/;

export const productInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required.')
    .max(200)
    .regex(slugPattern, 'Slug may only contain lowercase letters, numbers, and hyphens.'),
  type_slug: z
    .string()
    .trim()
    .min(1, 'Type is required.')
    .max(200)
    .regex(slugPattern, 'Type slug may only contain lowercase letters, numbers, and hyphens.'),
  type_label: z.string().trim().min(1, 'Type label is required.').max(200),
  title: z.string().trim().min(1, 'Title is required.').max(300),
  subtitle: z.string().trim().max(300).nullish(),
  description: z.string().trim().max(3000).nullish(),
  category: z.enum(PORTFOLIO_CATEGORIES),
  image_url: z.string().trim().max(2000).nullish(),
  image_urls: z.array(z.string().trim().max(2000)).max(20).nullish(),
  sizes: z.array(productSizeSchema).min(1, 'At least one size is required.').max(20),
  related_slugs: z.array(z.string().trim().max(200)).max(20).optional(),
  published: z.boolean().optional(),
});
