
// ===========================================
// ENUMS - Match your Prisma schema exactly
// ===========================================

export enum UserRole {
  VISITOR = 'VISITOR',
  REGISTERED = 'REGISTERED',
  SUBSCRIBED = 'SUBSCRIBED',
  ADMIN = 'ADMIN'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PRO = 'PRO',
  PREMIUM = 'PREMIUM'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum MockupStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum MarkingTechnique {
  SERIGRAFIA = 'SERIGRAFIA',
  TRANSFER_DIGITAL = 'TRANSFER_DIGITAL',
  VINILO_TEXTIL = 'VINILO_TEXTIL',
  TRANSFER_SERIGRAFICO = 'TRANSFER_SERIGRAFICO',
  BORDADO = 'BORDADO',
  IMPRESION_DIGITAL = 'IMPRESION_DIGITAL',
  DOMING = 'DOMING',
  TAMPOGRAFIA = 'TAMPOGRAFIA',
  GRABADO_LASER = 'GRABADO_LASER',
  SUBLIMACION = 'SUBLIMACION',
  TERMOGRABADO = 'TERMOGRABADO',
  ETIQUETA_DIGITAL = 'ETIQUETA_DIGITAL',
  VINILO_ADHESIVO = 'VINILO_ADHESIVO',
  TRANSFER_CERAMICO = 'TRANSFER_CERAMICO',
  MOLDE_3D = 'MOLDE_3D',
  GRABADO_FUEGO = 'GRABADO_FUEGO',
  GRABADO_UV = 'GRABADO_UV',
  GRABADO_RELIEVE = 'GRABADO_RELIEVE',
  SERIGRAFIA_CIRCULAR = 'SERIGRAFIA_CIRCULAR'
}

// ===========================================
// AUTH TYPES
// ===========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: string;
}

// ===========================================
// USER TYPES
// ===========================================

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_credits: number;
  used_credits: number;
  total_mockups: number;
  has_active_subscription: boolean;
}

export interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
}

export interface UserChangePassword {
  current_password: string;
  new_password: string;
}

// ===========================================
// CREDIT TYPES
// ===========================================

export interface CreditBalance {
  total_credits: number;
  used_credits: number;
  remaining_credits: number;
  expiring_soon: number;
  next_expiry_date?: string;
}

export interface CreditPackage {
  amount: number;
  price: number;
  bonus_credits?: number;
  popular: boolean;
  savings_percentage?: number;
}

export interface CreditPurchase {
  amount: number;
  payment_method_id: string;
}

export interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  amount: number;
  description: string;
  mockup_id?: string;
  created_at: string;
}

export interface CreditResponse {
  id: string;
  user_id: string;
  amount: number;
  used: number;
  remaining: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditHistoryResponse {
  transactions: CreditTransaction[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreditPackagesResponse {
  packages: CreditPackage[];
}

// ===========================================
// MOCKUP TYPES
// ===========================================

export interface MockupCreate {
  name?: string;
  product_id?: string;
  marking_technique: MarkingTechnique;
  marking_zone_x: number;
  marking_zone_y: number;
  marking_zone_w: number;
  marking_zone_h: number;
  logo_scale?: number; // 0.1-3.0, default 1.0
  logo_rotation?: number; // -360 to 360, default 0
  logo_color?: string;
  logo_opacity?: number;
}

export interface Technique{
  name: string,
  display_name:string,
  description:string,
  premium_only: boolean,
}
export interface MockupResponse {
  id: string;
  user_id: string;
  product_id?: string;
  name?: string;
  status: MockupStatus;
  marking_technique: MarkingTechnique;
  product_image_url?: string;
  logo_image_url?: string;
  result_image_url?: string;
  marking_zone_x: number;
  marking_zone_y: number;
  marking_zone_w: number;
  marking_zone_h: number;
  logo_scale: number;
  logo_rotation: number;
  logo_color?: string;
  logo_opacity?: number;
  processing_time?: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  product_image_url?: string;
  logo_image_url?: string;
  result_image_url?: string;
  marking_technique: MarkingTechnique;
  marking_zone_x: number;
  marking_zone_y: number;
  marking_zone_w: number;
  marking_zone_h: number;
  logo_scale: number;
  logo_rotation: number;
  logo_color?: string;
  logo_opacity?: number;
  created_at?: string;
  status?: MockupStatus;
}

export interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  availableTechniques: string[];
  mockupTechniques: Technique[];
  loading: boolean;
  error: string | null;
}

export interface MockupTechniqueInfo {
  name: string;
  display_name: string;
  description: string;
  texture_preview_url?: string;
  premium_only: boolean;
}

export interface MockupGenerationStatus {
  mockup_id: string;
  status: MockupStatus;
  progress?: number; // 0-100
  estimated_time?: number;
  error_message?: string;
}

// ===========================================
// PRODUCT TYPES
// ===========================================

export interface ProductResponse {
  id: string;
  name: string;
  description?: string;
  category: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  name: string;
  count: number;
}

// ===========================================
// SUBSCRIPTION TYPES
// ===========================================

export interface SubscriptionPlanInfo {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  credits_per_month: number;
  features: string[];
  is_popular: boolean;
}

export interface SubscriptionResponse {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  client_secret?: string;
}

export interface SubscriptionUsage {
  subscription: SubscriptionResponse;
  credits_used_this_period: number;
  credits_remaining: number;
  days_remaining: number;
  auto_renew: boolean;
}
