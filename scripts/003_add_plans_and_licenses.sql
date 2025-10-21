-- Create plans table for subscription tiers
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  credits_per_month INTEGER NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id),
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create licenses table for song usage rights
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL, -- personal, commercial, exclusive
  price DECIMAL(10, 2) DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  terms JSONB DEFAULT '{}'::jsonb
);

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for credits added, negative for used
  transaction_type TEXT NOT NULL, -- purchase, generation, refund, subscription
  description TEXT,
  reference_id UUID, -- song_id or subscription_id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, description, price, credits_per_month, features) VALUES
  ('Free', 'Começe gratuitamente', 0, 10, '["10 gerações por mês", "Qualidade padrão", "Uso pessoal"]'::jsonb),
  ('Pro', 'Para criadores sérios', 19.99, 100, '["100 gerações por mês", "Alta qualidade", "Uso comercial", "Download sem marca d''água"]'::jsonb),
  ('Premium', 'Produção ilimitada', 49.99, 500, '["500 gerações por mês", "Qualidade máxima", "Uso comercial", "Licenças exclusivas", "Suporte prioritário"]'::jsonb);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Plans are viewable by everyone" ON plans FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own licenses" ON licenses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
