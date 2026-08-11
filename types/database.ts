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

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  email_verified: boolean;
  verification_token: string | null;
  verification_token_expires: string | null;
  created_at: string;
}

// Safe to send to the client — never include password_hash or the raw token.
export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  email_verified: boolean;
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
  audience?: string[];
  religion?: string[];
  colour?: string[];
  format?: string[];
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
