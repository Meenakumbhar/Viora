// ─── Database Row Types ───────────────────────────────────────────────────────

export type EnquiryStatus = 'new' | 'read' | 'replied' | 'converted';
export type ServiceCategory = 'wedding' | 'funeral' | 'sports' | 'branding' | 'events';

// ─── App-level types used in lib/data.ts ─────────────────────────────────────

export interface Testimonial {
  quote: string;
  name: string;
  location: string;
}

export interface ProcessStep {
  number: number;
  title: string;
  description: string;
  timeframe: string;
}

export interface ServiceIncluded {
  name: string;
  description: string;
}

export interface ServiceTier {
  name: string;
  price: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export interface ServiceFaq {
  question: string;
  answer: string;
}

export interface ServiceData {
  slug: string;
  title: string;
  titleAccent: string;
  description: string;
  heroImage: string;
  tone: string;
  included: ServiceIncluded[];
  idealClient: string;
  tiers: ServiceTier[];
  faqs: ServiceFaq[];
  relatedSlugs: string[];
}

// One orderable option within a product — usually just a size (A1/A2/A3),
// but for products like Memorial Portraits where each option is a genuinely
// different style, `description` carries the material/finish details.
export interface ProductSize {
  label: string;
  dimensions: string;
  description?: string;
}

// Standalone catalog items (memorial keepsakes, cards, prints) — distinct
// from ServiceData, which describes a whole category of work rather than a
// single product a customer picks off a shelf.
export interface ProductData {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  category: ServiceCategory;
  image: string | null;
  sizes: ProductSize[];
  relatedSlugs: string[];
}

// Denormalized snapshot of a portfolio item at the time a quote/order referenced it —
// kept even if the portfolio item is later edited or deleted.
export interface PortfolioItemRef {
  id: string;
  title: string;
  category: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  service_type: string;
  event_date: string | null;
  quantity_estimate: string | null;
  description: string | null;
  source: string | null;
  portfolio_items: PortfolioItemRef[] | null;
  created_at: string;
  status: EnquiryStatus;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed';

export interface Order {
  id: string;
  enquiry_id: string | null;
  customer_name: string;
  customer_email: string;
  service_type: string;
  event_date: string | null;
  quantity_estimate: string | null;
  details: string | null;
  portfolio_items: PortfolioItemRef[] | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_amount: number | null;
  paypal_order_id: string | null;
  // Which designer the proofreader has routed this order to — null until assigned.
  assigned_designer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface OrderWithHistory extends Order {
  history: OrderStatusHistoryEntry[];
}

// ─── Design Review ─────────────────────────────────────────────────────────────

// A revision must clear the proofreader gate before a customer ever sees it:
// designer uploads (pending_proofreader_review) -> proofreader either bounces it
// back (returned_to_designer) or lets it through (pending_review) -> customer
// approves or requests changes -> designer's next revision starts the cycle over.
export type DesignRevisionStatus =
  | 'pending_proofreader_review'
  | 'returned_to_designer'
  | 'pending_review'
  | 'changes_requested'
  | 'approved';

export type DesignCommentAuthorRole = 'customer' | 'proofreader';

export type CommentResolutionField = 'designer_resolved' | 'proofreader_resolved';

export interface DesignComment {
  id: string;
  revision_id: string;
  image_index: number;
  x: number;
  y: number;
  comment: string;
  // Independent — the designer marking their own fix done never implies the
  // proofreader has confirmed it, and vice versa.
  designer_resolved: boolean;
  proofreader_resolved: boolean;
  author_role: DesignCommentAuthorRole;
  created_at: string;
}

export interface DesignRevision {
  id: string;
  order_id: string;
  version: number;
  image_urls: string[];
  notes: string | null;
  status: DesignRevisionStatus;
  created_at: string;
  comments: DesignComment[];
}

export interface DesignCommentInput {
  image_index: number;
  x: number;
  y: number;
  comment: string;
}

export interface OrderInput {
  customer_name: string;
  customer_email: string;
  service_type: string;
  event_date?: string | null;
  quantity_estimate?: string | null;
  details?: string | null;
  enquiry_id?: string | null;
  portfolio_items?: PortfolioItemRef[] | null;
}

// ─── User Accounts ─────────────────────────────────────────────────────────────

// Self-serve signup always creates 'user' — the other roles are staff, assigned
// by an admin via /admin/users, never chosen by the person signing up.
export type UserRole = 'user' | 'employee' | 'designer' | 'proofreader' | 'admin';
export const USER_ROLES: UserRole[] = ['user', 'employee', 'designer', 'proofreader', 'admin'];

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: string | null;
  role: UserRole;
  // Captured from the customer's first quote submission — lets returning
  // customers skip re-entering contact details on later orders.
  phone: string | null;
  country: string | null;
  created_at: string;
}

// Safe to send to the client — never include password_hash or the raw token.
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  role: UserRole;
  phone: string | null;
  country: string | null;
  created_at: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  country: string | null;
  subscribed_at: string;
  active: boolean;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: ServiceCategory;
  filters: PortfolioFilters;
  image_url: string;
  image_urls?: string[] | null;
  description: string | null;
  location: string | null;
  published: boolean;
  created_at: string;
}

export interface PortfolioFilters {
  style?: string[];
  passion?: string[];
  religion?: string[];
  colour?: string[];
  tribute?: string[];
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string | null;
  image_url: string | null;
  published_at: string;
  published: boolean;
  created_at: string;
}

/** @deprecated Use Post instead */
export type BlogPost = Post;

// ─── API Payload Types ────────────────────────────────────────────────────────

export interface EnquiryPayload {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  service_type: string;
  event_date?: string;
  quantity_estimate?: string;
  description?: string;
  source?: string;
  portfolio_items?: PortfolioItemRef[] | null;
}

export interface SubscriberPayload {
  email: string;
  first_name?: string;
  country?: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiSuccess<T = null> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = null> = ApiSuccess<T> | ApiError;
