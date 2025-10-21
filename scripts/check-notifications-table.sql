-- Verificar a estrutura da tabela notifications
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notifications';

-- Verificar se há algum trigger relacionado
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'notifications';
