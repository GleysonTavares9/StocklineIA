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
    
    -- Insere o perfil com todos os campos obrigatórios
    INSERT INTO public.profiles (id, username, email, credits, created_at)
    VALUES (
      NEW.id, 
      username_text,
      NEW.email, 
      3,
      NOW()
    );
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualiza perfis existentes que podem ter username nulo
DO $$
BEGIN
  -- Verifica se a coluna username existe e se há registros com username nulo
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'profiles' 
             AND column_name = 'username') THEN
             
    -- Atualiza registros onde o username é nulo
    UPDATE public.profiles 
    SET 
      username = COALESCE(
        username, 
        'user_' || substr(id::text, 1, 8)
      ),
      updated_at = NOW()
    WHERE username IS NULL OR username = '';
    
    -- Adiciona restrição NOT NULL à coluna username
    ALTER TABLE public.profiles 
    ALTER COLUMN username SET NOT NULL;
    
  END IF;
END $$;
