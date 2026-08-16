import { describe, expect, it } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  portfolioItemRefsSchema,
  designCommentsSchema,
  orderFormInputSchema,
  portfolioItemInputSchema,
} from '@/lib/schemas';

describe('emailSchema', () => {
  it('accepts a valid email and lowercases/trims it', () => {
    expect(emailSchema.parse('  Someone@Example.com  ')).toBe('someone@example.com');
  });

  it('rejects an empty string', () => {
    expect(emailSchema.safeParse('').success).toBe(false);
  });

  it('rejects a string with no @', () => {
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
  });
});

describe('passwordSchema', () => {
  it('accepts an 8+ character password', () => {
    expect(passwordSchema.safeParse('longenough').success).toBe(true);
  });

  it('rejects a password under 8 characters', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
  });
});

describe('portfolioItemRefsSchema', () => {
  it('accepts a well-formed list', () => {
    const result = portfolioItemRefsSchema.safeParse([
      { id: 'p1', title: 'Wedding Card', category: 'wedding' },
    ]);
    expect(result.success).toBe(true);
  });

  it('caps the list at 20 items', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ id: `p${i}`, title: `Item ${i}`, category: 'wedding' }));
    const result = portfolioItemRefsSchema.parse(items);
    expect(result).toHaveLength(20);
  });

  it('drops non-object entries before validating', () => {
    const result = portfolioItemRefsSchema.parse([null, 'garbage', { id: 'p1', title: 'Real Item', category: '' }]);
    expect(result).toEqual([{ id: 'p1', title: 'Real Item', category: '' }]);
  });

  it('allows null/undefined (optional field)', () => {
    expect(portfolioItemRefsSchema.safeParse(null).success).toBe(true);
    expect(portfolioItemRefsSchema.safeParse(undefined).success).toBe(true);
  });
});

describe('designCommentsSchema', () => {
  it('accepts a comment whose image_index is within bounds', () => {
    const schema = designCommentsSchema(3);
    const result = schema.safeParse([{ image_index: 2, x: 0.5, y: 0.5, comment: 'Looks great' }]);
    expect(result.success).toBe(true);
  });

  it('rejects an image_index at or beyond imageCount', () => {
    const schema = designCommentsSchema(3);
    const result = schema.safeParse([{ image_index: 3, x: 0.5, y: 0.5, comment: 'Out of range' }]);
    expect(result.success).toBe(false);
  });

  it('clamps the bound to 0 when imageCount is 0, still rejecting any index', () => {
    const schema = designCommentsSchema(0);
    const result = schema.safeParse([{ image_index: 0, x: 0, y: 0, comment: 'x' }]);
    // max(imageCount - 1, 0) === 0, so index 0 is the only value that can pass
    expect(result.success).toBe(true);
    expect(schema.safeParse([{ image_index: 1, x: 0, y: 0, comment: 'x' }]).success).toBe(false);
  });

  it('rejects x/y outside the normalized 0-1 range', () => {
    const schema = designCommentsSchema(5);
    expect(schema.safeParse([{ image_index: 0, x: 1.5, y: 0.5, comment: 'x' }]).success).toBe(false);
    expect(schema.safeParse([{ image_index: 0, x: 0.5, y: -0.1, comment: 'x' }]).success).toBe(false);
  });
});

describe('orderFormInputSchema', () => {
  it('accepts a fully empty draft (every field optional)', () => {
    expect(orderFormInputSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid photo_option enum value', () => {
    const result = orderFormInputSchema.safeParse({ photo_option: 'sepia' });
    expect(result.success).toBe(false);
  });

  it('rejects an additional_products entry missing required fields', () => {
    const result = orderFormInputSchema.safeParse({
      additional_products: [{ slug: 'card', title: 'Card' }], // missing size, quantity
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed additional_products entry', () => {
    const result = orderFormInputSchema.safeParse({
      additional_products: [{ slug: 'card', title: 'Memorial Card', size: 'A5', quantity: 50 }],
    });
    expect(result.success).toBe(true);
  });
});

describe('portfolioItemInputSchema', () => {
  const base = {
    title: 'Autumn Wedding',
    category: 'wedding' as const,
    image_url: 'https://example.com/img.jpg',
  };

  it('accepts a minimal valid item', () => {
    expect(portfolioItemInputSchema.safeParse(base).success).toBe(true);
  });

  it('rejects an unknown category', () => {
    const result = portfolioItemInputSchema.safeParse({ ...base, category: 'birthday' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing image_url', () => {
    const { image_url: _omit, ...withoutImage } = base;
    const result = portfolioItemInputSchema.safeParse(withoutImage);
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = portfolioItemInputSchema.safeParse({ ...base, title: '' });
    expect(result.success).toBe(false);
  });
});
