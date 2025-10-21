-- Add plan and credits to profiles table
      ALTER TABLE profiles
      ADD COLUMN plan TEXT DEFAULT 'Básico',
      ADD COLUMN credits INTEGER DEFAULT 10;

      -- Create a function to insert a new profile when a user signs up
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email)
        VALUES (new.id, new.email);
        INSERT INTO public.user_subscriptions (user_id, plan_name, status)
        VALUES (NEW.id, 'Básico', 'active');
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Create a trigger to call the function when a new user is created
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

      -- Set initial credits for existing users, just in case
      UPDATE profiles
      SET plan = 'Básico', credits = 10
      WHERE plan IS NULL;