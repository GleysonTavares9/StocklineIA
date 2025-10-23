-- Função para adicionar créditos a um usuário
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_type text,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_expires_in_days integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at timestamptz;
  v_new_balance integer;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Verifica se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Calcula a data de expiração
  IF p_expires_in_days IS NOT NULL AND p_expires_in_days > 0 THEN
    v_expires_at := NOW() + (p_expires_in_days * INTERVAL '1 day');
  END IF;

  -- Atualiza o saldo do usuário
  INSERT INTO public.profiles (id, credits_balance, credits_expire_at, updated_at)
  VALUES (p_user_id, p_amount, v_expires_at, NOW())
  ON CONFLICT (id) 
  DO UPDATE SET 
    credits_balance = profiles.credits_balance + p_amount,
    credits_expire_at = CASE 
      WHEN p_expires_in_days IS NOT NULL AND p_expires_in_days > 0 THEN 
        LEAST(COALESCE(profiles.credits_expire_at, v_expires_at), v_expires_at)
      ELSE 
        profiles.credits_expire_at 
      END,
    updated_at = NOW()
  RETURNING credits_balance, credits_expire_at INTO v_new_balance, v_expires_at;

  -- Registra a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    amount, 
    type, 
    reference_id, 
    description, 
    expires_at,
    status,
    metadata
  ) VALUES (
    p_user_id,
    p_amount,
    p_type,
    p_reference_id,
    COALESCE(p_description, 'Adição de ' || p_amount || ' créditos'),
    v_expires_at,
    'completed',
    jsonb_build_object('action', 'add_credits', 'reference_id', p_reference_id)
  )
  RETURNING id INTO v_transaction_id;

  -- Retorna o resultado
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'new_balance', v_new_balance,
    'expires_at', v_expires_at
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Função para deduzir créditos de um usuário
CREATE OR REPLACE FUNCTION public.deduct_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_action_type text,
  p_reference_id text DEFAULT NULL,
  p_description text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance integer;
  v_new_balance integer;
  v_transaction_id uuid;
  v_result jsonb;
BEGIN
  -- Verifica se o usuário existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado',
      'error_code', 'USER_NOT_FOUND'
    );
  END IF;

  -- Obtém o saldo atual com bloqueio para evitar condições de corrida
  SELECT credits_balance INTO v_current_balance
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Verifica se há saldo suficiente
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Créditos insuficientes',
      'error_code', 'INSUFFICIENT_CREDITS',
      'current_balance', v_current_balance,
      'required_amount', p_amount
    );
  END IF;

  -- Atualiza o saldo
  UPDATE public.profiles
  SET 
    credits_balance = credits_balance - p_amount,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- Registra a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    amount, 
    type, 
    reference_id, 
    description,
    status,
    metadata
  ) VALUES (
    p_user_id,
    -p_amount, -- Valor negativo para débito
    p_action_type,
    p_reference_id,
    COALESCE(p_description, 'Uso de ' || p_amount || ' créditos para ' || p_action_type),
    'completed',
    jsonb_build_object('action', p_action_type, 'reference_id', p_reference_id)
  )
  RETURNING id INTO v_transaction_id;

  -- Retorna o resultado
  v_result := jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'previous_balance', v_current_balance,
    'new_balance', v_new_balance,
    'amount_deducted', p_amount
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Função para verificar o saldo de créditos
CREATE OR REPLACE FUNCTION public.get_user_credit_balance(
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance_record record;
  v_result jsonb;
BEGIN
  -- Obtém o saldo do usuário
  SELECT 
    p.credits_balance,
    p.credits_expire_at,
    p.plan_id,
    p.updated_at,
    COUNT(ct.id) FILTER (WHERE ct.amount > 0) as total_credited,
    ABS(SUM(ct.amount) FILTER (WHERE ct.amount < 0)) as total_debited,
    COUNT(ct.id) FILTER (WHERE ct.amount < 0) as total_transactions
  INTO v_balance_record
  FROM public.profiles p
  LEFT JOIN public.credit_transactions ct ON ct.user_id = p.id
  WHERE p.id = p_user_id
  GROUP BY p.id, p.credits_balance, p.credits_expire_at, p.plan_id, p.updated_at;

  IF v_balance_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Usuário não encontrado',
      'error_code', 'USER_NOT_FOUND'
    );
  END IF;

  -- Constrói o resultado
  v_result := jsonb_build_object(
    'success', true,
    'balance', jsonb_build_object(
      'available', COALESCE(v_balance_record.credits_balance, 0),
      'expires_at', v_balance_record.credits_expire_at,
      'plan_id', v_balance_record.plan_id,
      'last_updated', v_balance_record.updated_at,
      'stats', jsonb_build_object(
        'total_credited', COALESCE(v_balance_record.total_credited, 0),
        'total_debited', COALESCE(v_balance_record.total_debited, 0),
        'total_transactions', COALESCE(v_balance_record.total_transactions, 0)
      )
    )
  );

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Função para expirar créditos antigos (deve ser executada diariamente)
CREATE OR REPLACE FUNCTION public.expire_old_credits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza perfis com créditos expirados
  WITH expired_credits AS (
    UPDATE public.profiles
    SET 
      credits_balance = 0,
      updated_at = NOW()
    WHERE 
      credits_balance > 0 
      AND credits_expire_at IS NOT NULL 
      AND credits_expire_at < NOW()
    RETURNING id, credits_balance, credits_expire_at
  )
  -- Registra as expirações
  INSERT INTO public.credit_transactions (
    user_id,
    amount,
    type,
    description,
    status,
    metadata
  )
  SELECT 
    id,
    -credits_balance,
    'expiration',
    'Créditos expirados em ' || credits_expire_at,
    'completed',
    jsonb_build_object('expired_at', credits_expire_at)
  FROM expired_credits;

  -- Limpa a data de expiração para créditos expirados
  UPDATE public.profiles
  SET 
    credits_expire_at = NULL,
    updated_at = NOW()
  WHERE 
    credits_balance = 0 
    AND credits_expire_at IS NOT NULL 
    AND credits_expire_at < NOW();
END;
$$;

-- Função para processar a compra de um pacote de créditos
CREATE OR REPLACE FUNCTION public.process_credit_purchase(
  p_user_id uuid,
  p_plan_id text,
  p_payment_id text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_plan_record record;
  v_result jsonb;
BEGIN
  -- Obtém os detalhes do plano
  SELECT * INTO v_plan_record
  FROM public.plans
  WHERE id = p_plan_id
  AND is_credit_pack = true
  AND is_active = true;

  IF v_plan_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Plano de crédito não encontrado ou inativo',
      'error_code', 'PLAN_NOT_FOUND'
    );
  END IF;

  -- Adiciona os créditos ao usuário
  v_result := public.add_user_credits(
    p_user_id := p_user_id,
    p_amount := v_plan_record.credits,
    p_type := 'purchase',
    p_reference_id := p_payment_id,
    p_description := 'Compra de ' || v_plan_record.credits || ' créditos - ' || v_plan_record.name,
    p_expires_in_days := v_plan_record.valid_days
  );

  -- Se houver erro, retorna o erro
  IF (v_result->>'success')::boolean = false THEN
    RETURN v_result;
  END IF;

  -- Registra a compra na tabela de assinaturas (opcional)
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    status,
    starts_at,
    renews_at
  ) VALUES (
    p_user_id,
    p_plan_id,
    'active',
    NOW(),
    CASE 
      WHEN v_plan_record.valid_days IS NOT NULL AND v_plan_record.valid_days > 0 THEN
        NOW() + (v_plan_record.valid_days * INTERVAL '1 day')
      ELSE
        NULL
    END
  );

  -- Retorna o resultado com informações adicionais
  RETURN jsonb_build_object(
    'success', true,
    'credits_added', v_plan_record.credits,
    'new_balance', (v_result->>'new_balance')::integer,
    'expires_in_days', v_plan_record.valid_days,
    'transaction_id', v_result->>'transaction_id'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- Cria um trigger para adicionar créditos iniciais a novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Adiciona créditos iniciais ao novo usuário
  PERFORM public.add_user_credits(
    p_user_id := NEW.id,
    p_amount := 20, -- Créditos iniciais
    p_type := 'signup_bonus',
    p_description := 'Bem-vindo! Créditos iniciais para teste',
    p_expires_in_days := 30 -- Expira em 30 dias
  );

  -- Cria um perfil para o novo usuário
  INSERT INTO public.profiles (id, email, credits_balance, credits_expire_at)
  VALUES (
    NEW.id, 
    NEW.email, 
    20, -- Créditos iniciais
    NOW() + INTERVAL '30 days' -- Expira em 30 dias
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Cria o trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Permissões
GRANT EXECUTE ON FUNCTION public.add_user_credits(uuid, integer, text, text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_user_credits(uuid, integer, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_credit_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_credit_purchase(uuid, text, text) TO authenticated;

-- Permissões para o trigger
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION public.add_user_credits IS 'Adiciona créditos à conta de um usuário';
COMMENT ON FUNCTION public.deduct_user_credits IS 'Deduz créditos da conta de um usuário';
COMMENT ON FUNCTION public.get_user_credit_balance IS 'Obtém o saldo de créditos de um usuário';
COMMENT ON FUNCTION public.expire_old_credits IS 'Expira créditos antigos (deve ser executada diariamente)';
COMMENT ON FUNCTION public.process_credit_purchase IS 'Processa a compra de um pacote de créditos';
COMMENT ON FUNCTION public.handle_new_user IS 'Manipula a criação de novos usuários, adicionando créditos iniciais';

-- Agendamento da função de expiração (opcional, requer privilégios de superusuário)
-- SELECT cron.schedule('0 0 * * *', 'SELECT public.expire_old_credits()');
