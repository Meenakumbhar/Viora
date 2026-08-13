export interface SavedPortfolioItem {
  id: string;
  title: string;
  category: string;
  image?: string;
}

const SAVED_KEY = 'viora-portfolio-saved';

export function readSavedItems(): SavedPortfolioItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = window.localStorage.getItem(SAVED_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed as SavedPortfolioItem[] : [];
  } catch {
    return [];
  }
}

export function isItemSaved(id: string): boolean {
  return readSavedItems().some((item) => item.id === id);
}

export function saveItem(item: SavedPortfolioItem): SavedPortfolioItem[] {
  const current = readSavedItems();
  if (current.some((entry) => entry.id === item.id)) return current;
  const next = [...current, item];
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('portfolio-saved-updated'));
  return next;
}

export function unsaveItem(id: string): SavedPortfolioItem[] {
  const next = readSavedItems().filter((item) => item.id !== id);
  window.localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('portfolio-saved-updated'));
  return next;
}

export function toggleSavedItem(item: SavedPortfolioItem): SavedPortfolioItem[] {
  return isItemSaved(item.id) ? unsaveItem(item.id) : saveItem(item);
}
