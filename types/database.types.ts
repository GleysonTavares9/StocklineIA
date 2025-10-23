// Core types
type Json = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Json | undefined } 
  | Json[]

type Timestamp = string;

// Database Tables
export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference_id: string | null;
  description: string | null;
  expires_at: Timestamp | null;
  created_at: Timestamp;
  metadata: Json;
};

export type License = {
  id: string;
  song_id: string | null;
  user_id: string | null;
  license_type: string;
  price: number;
  purchased_at: Timestamp;
  expires_at: Timestamp | null;
  terms: Json;
};

export type Music = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  prompt: string | null;
  audio_url: string;
  video_url: string | null;
  image_url: string | null;
  style: string | null;
  duration: number;
  is_vocal_removed: boolean;
  status: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  metadata: Json;
  task_id: string | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: Timestamp;
  read_at: Timestamp | null;
};

export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  credits: number;
  features: string[];
  is_active: boolean;
  is_credit_pack: boolean;
  is_popular: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
  valid_days: number | null;
  price_id: string | null;
};

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  credits: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  stripe_customer_id: string | null;
  plan_id: string;
  credits_balance: number;
  credits_expire_at: Timestamp | null;
};

export type Song = {
  id: string;
  user_id: string;
  title: string | null;
  style: string | null;
  lyrics: string | null;
  is_instrumental: boolean;
  audio_url: string | null;
  image_url: string | null;
  status: string;
  suno_task_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  is_cover: boolean;
  original_audio_url: string | null;
  task_id: string | null;
  duration: number | null;
  metadata: Json;
};

export type Subscription = {
  id: string;
  user_id: string | null;
  plan_id: string | null;
  status: string;
  current_period_start: Timestamp;
  current_period_end: Timestamp | null;
  stripe_subscription_id: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type UserActivity = {
  id: string;
  user_id: string | null;
  action: string;
  metadata: Json | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

export type UserSubscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  generations_used: number;
  starts_at: Timestamp;
  renews_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};
