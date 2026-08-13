export interface PortfolioCartItem {
  id: string;
  title: string;
  category: string;
  quantity: number;
  // Optional so older/simpler cart entries (or ones added before this field
  // existed) still read back fine — the cart UI falls back to a placeholder.
  image?: string;
  size?: string;
  // The quote-form service label this item implies (e.g. 'Funeral & Memorial')
  // — lets a quote raised from this item skip asking for it again.
  serviceType?: string;
}

const CART_KEY = 'viora-portfolio-cart';

export function readPortfolioCart(): PortfolioCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(CART_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as PortfolioCartItem[] : [];
  } catch {
    return [];
  }
}

export function addToPortfolioCart(item: Omit<PortfolioCartItem, 'quantity'>): PortfolioCartItem[] {
  const cart = readPortfolioCart();
  const existing = cart.find((entry) => entry.id === item.id);
  const next = existing
    ? cart.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry)
    : [...cart, { ...item, quantity: 1 }];
  window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('portfolio-cart-updated'));
  return next;
}

export function updatePortfolioCartQuantity(id: string, quantity: number): PortfolioCartItem[] {
  const next = readPortfolioCart()
    .map((item) => item.id === id ? { ...item, quantity } : item)
    .filter((item) => item.quantity > 0);
  window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('portfolio-cart-updated'));
  return next;
}

export function removeFromPortfolioCart(id: string): PortfolioCartItem[] {
  return updatePortfolioCartQuantity(id, 0);
}

// Called once a quote request has actually been submitted for these items —
// leaving them in the cart afterward would let a customer re-submit the same
// items as a second, duplicate quote request.
export function clearPortfolioCart(): void {
  window.localStorage.setItem(CART_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('portfolio-cart-updated'));
}
