-- Cria a tabela plans se não existir
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insere os planos iniciais se a tabela estiver vazia
INSERT INTO public.plans (id, name, description, price, credits)
VALUES 
  ('basic', 'Básico', 'Plano básico com recursos essenciais', 0, 10),
  ('premium', 'Premium', 'Plano premium com recursos avançados', 29, 100)
ON CONFLICT (id) DO NOTHING;

-- Remove a restrição de chave estrangeira existente se ela existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_plan_id_fkey' 
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles 
    DROP CONSTRAINT profiles_plan_id_fkey;
  END IF;
END $$;

-- Adiciona a restrição de chave estrangeira corretamente
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_id_fkey 
FOREIGN KEY (plan_id) 
REFERENCES public.plans(id) 
ON DELETE SET NULL;

-- Atualiza a função handle_new_user para definir um plano padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extrai o nome de usuário do email (parte antes do @)
  DECLARE
    username_text TEXT;
  BEGIN
    username_text := split_part(NEW.email, '@', 1);
    
    -- Garante que o nome de usuário não esteja vazio
    IF username_text = '' THEN
      username_text := 'user_' || substr(NEW.id::text, 1, 8);
    END IF;
    
    -- Verifica se o nome de usuário já existe
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = username_text) LOOP
      username_text := username_text || substr(gen_random_uuid()::text, 1, 4);
    END LOOP;
    
    -- Insere o perfil com todos os campos obrigatórios
    INSERT INTO public.profiles (
      id, 
      email, 
      username, 
      credits,
      plan_id,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.email,
      username_text,
      10, -- Créditos iniciais
      'basic', -- Plano básico por padrão
      NOW(),
      NOW()
    );
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
