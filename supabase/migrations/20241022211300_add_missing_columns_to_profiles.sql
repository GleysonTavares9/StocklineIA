-- Primeiro, adiciona as colunas que estão faltando na tabela profiles
DO $$
BEGIN
  -- Adiciona a coluna full_name se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN full_name TEXT;
  END IF;

  -- Adiciona a coluna website se não existir
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN website TEXT;
  END IF;
  
  -- Atualiza os registros existentes com valores padrão
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(full_name, email),
    website = COALESCE(website, '')
  WHERE full_name IS NULL OR website IS NULL;
  
END $$;

-- Atualiza a função handle_new_user usando CREATE OR REPLACE para evitar problemas com o trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id TEXT;
  username_text TEXT;
BEGIN
  -- Verifica se o plano básico existe, se não, usa o primeiro plano disponível
  SELECT id INTO v_plan_id 
  FROM public.plans 
  WHERE id = 'basic' 
  LIMIT 1;
  
  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id 
    FROM public.plans 
    ORDER BY price ASC 
    LIMIT 1;
  END IF;
  
  -- Se ainda não houver planos, insere um plano básico
  IF v_plan_id IS NULL THEN
    INSERT INTO public.plans (id, name, description, price, credits)
    VALUES ('basic', 'Básico', 'Plano básico com recursos essenciais', 0, 10)
    RETURNING id INTO v_plan_id;
  END IF;
  
  -- Extrai o nome de usuário do email (parte antes do @)
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
    full_name,
    website,
    credits,
    plan_id,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    NEW.email,
    username_text,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Usa o full_name do metadata ou email
    COALESCE(NEW.raw_user_meta_data->>'website', ''), -- Usa o website do metadata ou string vazia
    10, -- Créditos iniciais
    v_plan_id, -- Usa o ID do plano válido
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
