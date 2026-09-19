// ─── Products ─────────────────────────────────────────────────────────
// Part of the lib/data boundary: this is the surface pages and route
// handlers import, instead of reaching into lib/db directly. Keeping the
// public surface domain-scoped (rather than one 2,000-line module) means
// the UI can be rewritten against a stable contract, and the queries behind
// it can later move out of lib/db without touching a single caller.
import 'server-only';

export {
  getProducts,
  getProductsByType,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  getAllProductsForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/db';

export type {
  ProductInput,
} from '@/lib/db';
