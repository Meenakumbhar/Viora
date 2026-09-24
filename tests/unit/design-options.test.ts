import { describe, expect, it } from 'vitest';
import { buildDesignOptions } from '@/components/OrderFormClient';
import type { PortfolioItem, Product } from '@/types/database';

const portfolioItem = {
  id: '11111111-1111-1111-1111-111111111111',
  title: 'Golden Wheat',
  category: 'funeral',
  template_number: '104',
} as PortfolioItem;

const product = {
  slug: 'memory-cards-classic',
  title: 'Memory Cards',
  type_label: 'Memorial keepsake',
  sizes: [
    { label: 'A5', dimensions: '148x210mm' },
    { label: 'A6', dimensions: '105x148mm' },
  ],
} as Product;

describe('buildDesignOptions', () => {
  it('labels portfolio items by template number so they are searchable by it', () => {
    const [option] = buildDesignOptions([portfolioItem], []);
    expect(option.id).toBe(portfolioItem.id);
    expect(option.title).toContain('Template #104');
  });

  // A product ref must stay in the `slug::size` shape syncOrderPricingFromCatalog
  // parses — anything else falls through to the portfolio_item_id UUID lookup
  // and silently fails to price the order.
  it('gives each product size a pricing-compatible composite id', () => {
    const options = buildDesignOptions([], [product]);
    expect(options.map((o) => o.id)).toEqual([
      'memory-cards-classic::A5',
      'memory-cards-classic::A6',
    ]);
    expect(options[0].title).toBe('Memory Cards — A5');
  });
});
