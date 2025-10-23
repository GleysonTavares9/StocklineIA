-- Adiciona a coluna username à tabela profiles se ela não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'username') THEN
    
    -- Adiciona a coluna username
    ALTER TABLE public.profiles 
    ADD COLUMN username TEXT;
    
    -- Atualiza os registros existentes com um valor padrão
    UPDATE public.profiles 
    SET username = 'user_' || substr(id::text, 1, 8)
    WHERE username IS NULL;
    
    -- Torna a coluna NOT NULL
    ALTER TABLE public.profiles 
    ALTER COLUMN username SET NOT NULL;
    
    -- Adiciona uma restrição de unicidade
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_username_key UNIQUE (username);
    
  END IF;
END $$;

-- Atualiza a função handle_new_user para incluir o campo username
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
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      NEW.email,
      username_text,
      3, -- Créditos iniciais
      NOW(),
      NOW()
    );
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
