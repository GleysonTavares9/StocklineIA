-- Primeiro, remover a restrição de chave estrangeira existente
ALTER TABLE IF EXISTS public.profiles
DROP CONSTRAINT IF EXISTS profiles_plan_id_fkey;

-- Recriar a chave estrangeira com ON DELETE SET NULL
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES public.plans(id)
ON DELETE SET NULL;
