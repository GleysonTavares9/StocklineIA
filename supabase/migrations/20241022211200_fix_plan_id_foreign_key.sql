-- Primeiro, verifica se a tabela profiles tem a coluna plan_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'plan_id') THEN
    
    -- Remove a restrição de chave estrangeira existente se ela existir
    IF EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'profiles_plan_id_fkey' 
      AND table_name = 'profiles'
    ) THEN
      EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT profiles_plan_id_fkey';
    END IF;
    
    -- Atualiza os registros existentes para usar um valor padrão válido
    UPDATE public.profiles 
    SET plan_id = 'basic' 
    WHERE plan_id IS NULL OR plan_id NOT IN (SELECT id FROM public.plans);
    
    -- Adiciona a restrição de chave estrangeira corretamente
    ALTER TABLE public.profiles 
    ALTER COLUMN plan_id SET DEFAULT 'basic',
    ALTER COLUMN plan_id SET NOT NULL,
    ADD CONSTRAINT profiles_plan_id_fkey 
    FOREIGN KEY (plan_id) 
    REFERENCES public.plans(id) 
    ON DELETE SET DEFAULT;
    
  END IF;
END $$;

-- Atualiza a função handle_new_user para garantir que ela use um plan_id válido
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
    v_plan_id, -- Usa o ID do plano válido
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
