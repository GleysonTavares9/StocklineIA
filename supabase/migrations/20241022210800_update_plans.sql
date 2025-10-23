-- Remove todos os planos existentes
TRUNCATE TABLE plans RESTART IDENTITY CASCADE;

-- Insere os novos planos
INSERT INTO public.plans (
  id,
  name,
  description,
  price,
  credits,
  price_id,
  features
) VALUES 
-- Plano Básico
(
  '1',
  'Básico',
  'Ideal para quem está começando',
  29.90,
  100,
  'price_1SFr8GEaMssn2zemQADq2BjG',
  '["100 créditos por mês", "Suporte por email", "Acesso básico", "Até 10 gerações por dia"]'::jsonb
),
-- Plano Intermediário
(
  '2',
  'Intermediário',
  'Para quem já está evoluindo',
  49.90,
  200,
  'price_1SFr8mEaMssn2zemIlFlxF7z',
  '["200 créditos por mês", "Suporte prioritário", "Acesso a recursos intermediários", "Até 20 gerações por dia", "Exportação em resolução HD"]'::jsonb
),
-- Plano Avançado
(
  '3',
  'Avançado',
  'Para uso profissional',
  99.90,
  500,
  'price_1SFr8VEaMssn2zemOfkVwP5W',
  '["500 créditos por mês", "Suporte prioritário", "Acesso a todos os recursos", "Exportação em Full HD", "Até 50 gerações por dia", "Armazenamento de 30 dias"]'::jsonb
),
-- Plano Premium
(
  '4',
  'Premium',
  'Para negócios em crescimento',
  199.90,
  1200,
  'price_1SLB0TEaMssn2zem6SYUuG0v',
  '["1200 créditos por mês", "Suporte 24/7", "Acesso a todos os recursos", "Exportação em 4K", "Até 120 gerações por dia", "Armazenamento de 60 dias", "Acesso à API básico"]'::jsonb
),
-- Plano Empresarial
(
  '5',
  'Empresarial',
  'Solução corporativa',
  449.90,
  3000,
  'price_1SLB0qEaMssn2zemmnjCeIyD',
  '["3000 créditos por mês", "Suporte dedicado", "Todos os recursos premium", "Exportação em 8K", "Gerações ilimitadas", "Armazenamento de 90 dias", "API ilimitada", "Conta de gerente dedicada", "Relatórios personalizados", "Treinamento da equipe"]'::jsonb
);

-- Tenta encontrar e atualizar a sequência, se existir
DO $$
DECLARE
    seq_name text;
    max_id bigint;
BEGIN
    -- Obtém o nome da sequência
    SELECT pg_get_serial_sequence('plans', 'id') INTO seq_name;
    
    -- Se encontrou a sequência, atualiza
    IF seq_name IS NOT NULL THEN
        SELECT MAX(id::bigint) INTO max_id FROM plans;
        IF max_id IS NOT NULL THEN
            EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH ' || (max_id + 1);
            RAISE NOTICE 'Sequência % atualizada para %', seq_name, max_id + 1;
        END IF;
    ELSE
        RAISE NOTICE 'Nenhuma sequência encontrada para a coluna id da tabela plans';
    END IF;
END $$;
