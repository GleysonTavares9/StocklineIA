-- Update the handle_new_user function to set initial credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 3);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles with 10 credits to have 3 if they were created with the default
UPDATE public.profiles 
SET credits = 3 
WHERE credits = 10 
  AND created_at > NOW() - INTERVAL '1 day';

-- Update the default value for future inserts
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 3;
