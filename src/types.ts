export type Language = 'en' | 'ar';

export type Page = 
  | 'landing' 
  | 'features' 
  | 'pricing' 
  | 'blog' 
  | 'faq' 
  | 'contact' 
  | 'terms' 
  | 'privacy' 
  | 'dashboard' 
  | 'admin'
  | 'business-cards'
  | 'social-media'
  | 'seo'
  | 'logo-maker';

export type DashboardTab = 
  | 'overview' 
  | 'names' 
  | 'logos' 
  | 'slogans' 
  | 'brand-kits' 
  | 'colors'
  | 'social-branding' 
  | 'history' 
  | 'billing' 
  | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  credits: number;
  subscriptionPlan: 'free' | 'pro' | 'business';
  billingCycle: 'monthly' | 'yearly';
  role: 'user' | 'admin';
  createdAt: string;
  lastFreeCreditGrant?: string;
  hasPurchasedCredits?: boolean;
}

export interface GeneratedName {
  name: string;
  meaning: string;
  meaningAr?: string;
  style: string;
  domainSuggestions: string[];
  tags?: string[];
  isFavorite?: boolean;
}

export interface GeneratedSlogan {
  slogan: string;
  vibe: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface GeneratedLogo {
  id: string;
  style: string;
  prompt: string;
  svg: string;
  createdAt: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface GeneratedBrandKit {
  id: string;
  name: string;
  slogan: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  typography: {
    heading: string;
    body: string;
    rationale: string;
  };
  socialKit: {
    bio: string;
    coverPrompt: string;
    postTemplate: string;
  };
  logoSvg?: string;
  createdAt: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UsageLog {
  id: string;
  type: 'name' | 'logo' | 'slogan' | 'brand-kit';
  prompt: string;
  creditsConsumed: number;
  createdAt: string;
}

export interface BlogArticle {
  id: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  contentEn: string;
  contentAr: string;
  date: string;
  image: string;
  author: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}
