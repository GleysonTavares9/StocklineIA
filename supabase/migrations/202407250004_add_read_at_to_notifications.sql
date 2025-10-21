-- Adiciona a coluna read_at à tabela notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Atualiza as notificações já lidas para terem o read_at definido
UPDATE notifications
SET read_at = NOW()
WHERE read = true AND read_at IS NULL;
