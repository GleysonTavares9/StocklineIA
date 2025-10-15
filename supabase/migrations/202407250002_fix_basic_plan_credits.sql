-- Update existing Básico plan users to have 10 credits
UPDATE profiles
SET credits = 10
WHERE plan = 'Básico';
