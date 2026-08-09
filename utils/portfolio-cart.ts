export interface PortfolioCartItem {
  id: string;
  title: string;
  category: string;
  quantity: number;
  unitPrice: number;
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
