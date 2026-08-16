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
  address: string | null;
  source: string | null;
  portfolio_items: PortfolioItemRef[] | null;
  created_at: string;
  status: EnquiryStatus;
}

// ─── Order Form ────────────────────────────────────────────────────────────────
// The detailed print-spec form a customer fills in once a quote is placed —
// deceased/service details, page count, and (only for a bespoke design) the
// add-on products they'd like alongside it.

export type OrderFormStatus = 'draft' | 'submitted';
export type PhotoOption = 'none' | 'colour' | 'bw';
export type InsidePagesStyle = 'bw' | 'match_cover';
export type PhotoSuppliedVia = 'email' | 'post';

export interface OrderFormProduct {
  slug: string;
  title: string;
  size: string;
  quantity: number;
}

export interface OrderForm {
  id: string;
  enquiry_id: string;
  deceased_name: string | null;
  funeral_date: string | null;
  funeral_time: string | null;
  venue_name: string | null;
  date_of_birth: string | null;
  date_of_death: string | null;
  age_of_deceased: string | null;
  photo_option: PhotoOption | null;
  bespoke_design: boolean;
  bespoke_details: string | null;
  number_of_pages: string | null;
  inside_pages_style: InsidePagesStyle | null;
  quantity: string | null;
  photo_qty: number | null;
  photo_supplied_via: PhotoSuppliedVia | null;
  photo_instructions: string | null;
  additional_products: OrderFormProduct[] | null;
  callback_requested: boolean;
  callback_phone: string | null;
  additional_notes: string | null;
  status: OrderFormStatus;
  created_at: string;
  updated_at: string;
}

export type OrderFormInput = Partial<Omit<OrderForm, 'id' | 'enquiry_id' | 'status' | 'created_at' | 'updated_at'>>;

export type OrderStatus = 'pending' | 'in_progress' | 'completed';
export type PaymentStatus = 'unpaid' | 'paid' | 'failed';
export type PaymentProvider = 'paypal' | 'stripe';

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
  payment_provider: PaymentProvider | null;
  paypal_order_id: string | null;
  stripe_session_id: string | null;
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
  name: string | null;
  email_verified: boolean;
  role: UserRole;
  // Captured from the customer's first quote submission — lets returning
  // customers skip re-entering contact details on later orders.
  phone: string | null;
  country: string | null;
  // Default delivery/venue address, shown like a saved Amazon address on the
  // quick-quote form — the customer can still type a different one per order.
  address: string | null;
  created_at: string;
}

// Same shape as User today — kept as its own type since it's the one meant
// for client responses, in case a genuinely sensitive field is added later.
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
  role: UserRole;
  phone: string | null;
  country: string | null;
  address: string | null;
  created_at: string;
}

// A price for one specific portfolio piece, the same for every customer who
// doesn't have something more specific set for them (see CustomerItemPrice
// — the full lookup order is on getEffectivePrice in lib/db.ts). No row
// means "not set" — that, combined with no CustomerItemPrice either, is
// what "pending" means on the pricing page.
export interface PortfolioItemPrice {
  id: string;
  portfolio_item_id: string;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// The genuinely per-customer, per-piece price — the same item can cost a
// different amount for different customers. Most specific price there is;
// always wins first over PortfolioItemPrice's shared baseline.
export interface CustomerItemPrice {
  id: string;
  user_id: string;
  portfolio_item_id: string;
  price: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

// What a logged-in customer actually sees on the pricing page: the most
// specific price that resolves for them (see getEffectivePrice in
// lib/db.ts for the full order). `negotiated` distinguishes a price that's
// personal to them (a customer-item override) from a generic item
// baseline, so the UI can label them differently ("Your price" vs.
// "Starting from").
export interface EffectivePrice {
  price: number;
  currency: string;
  negotiated: boolean;
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
  template_number: string | null;
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
  phone?: string | null;
  country?: string | null;
  service_type: string;
  event_date?: string | null;
  quantity_estimate?: string | null;
  description?: string | null;
  address?: string | null;
  source?: string | null;
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
