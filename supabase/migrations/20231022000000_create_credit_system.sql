-- Enable the pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Create credit transactions table
create table if not exists credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  type text not null, -- 'purchase', 'usage', 'refund', 'bonus', 'referral'
  description text,
  reference_id text, -- Reference to related entity (subscription_id, music_id, etc.)
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create user credits table
create table if not exists user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available_credits integer not null default 0,
  used_credits integer not null default 0,
  total_credits integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for better performance
create index if not exists idx_credit_transactions_user_id on credit_transactions(user_id);
create index if not exists idx_credit_transactions_created_at on credit_transactions(created_at);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_user_credits_updated_at
before update on user_credits
for each row
execute function update_updated_at_column();

-- Function to add credits to a user
create or replace function add_credits(
  user_id uuid,
  credits_to_add integer,
  expires_in_days integer default 90,
  transaction_type text default 'purchase',
  description text default null,
  reference_id text default null
) returns json as $$
declare
  expires_at_value timestamptz;
  new_balance json;
begin
  -- Calculate expiration date
  expires_at_value := case 
    when expires_in_days > 0 then now() + (expires_in_days * interval '1 day')
    else null
  end;
  
  -- Insert transaction
  insert into credit_transactions (
    user_id, 
    amount, 
    type, 
    description, 
    reference_id,
    expires_at
  ) values (
    user_id, 
    credits_to_add, 
    transaction_type,
    description,
    reference_id,
    expires_at_value
  );
  
  -- Update user's credit balance
  insert into user_credits (
    user_id, 
    available_credits, 
    used_credits, 
    total_credits,
    expires_at
  )
  values (
    user_id,
    credits_to_add,
    0,
    credits_to_add,
    expires_at_value
  )
  on conflict (user_id) 
  do update set
    available_credits = user_credits.available_credits + credits_to_add,
    total_credits = user_credits.total_credits + credits_to_add,
    expires_at = least(user_credits.expires_at, expires_at_value),
    updated_at = now()
  returning 
    json_build_object(
      'available_credits', available_credits,
      'total_credits', total_credits,
      'expires_at', expires_at
    ) into new_balance;
  
  return new_balance;
end;
$$ language plpgsql security definer;

-- Function to deduct credits from a user
create or replace function deduct_credits(
  user_id uuid,
  credits_to_deduct integer,
  action_type text,
  reference_id text default null
) returns json as $$
declare
  available integer;
  new_balance json;
  transaction_id uuid;
begin
  -- Check if user has enough credits
  select available_credits into available
  from user_credits
  where user_id = $1
  for update; -- Lock the row to prevent race conditions
  
  if not found or available < credits_to_deduct then
    raise exception 'Insufficient credits';
  end if;
  
  -- Insert debit transaction
  insert into credit_transactions (
    user_id, 
    amount, 
    type, 
    description, 
    reference_id
  ) values (
    user_id, 
    -credits_to_deduct, 
    'usage',
    'Used for ' || action_type,
    reference_id
  )
  returning id into transaction_id;
  
  -- Update user's credit balance
  update user_credits
  set 
    available_credits = available_credits - credits_to_deduct,
    used_credits = used_credits + credits_to_deduct,
    updated_at = now()
  where user_id = $1
  returning 
    json_build_object(
      'available_credits', available_credits,
      'used_credits', used_credits,
      'total_credits', total_credits,
      'transaction_id', transaction_id
    ) into new_balance;
  
  return new_balance;
end;
$$ language plpgsql security definer;

-- Function to get user's credit balance with expiration info
create or replace function get_user_credit_balance(user_id uuid)
returns json as $$
  select json_build_object(
    'available', available_credits,
    'used', used_credits,
    'total', total_credits,
    'expires_at', expires_at,
    'expires_in_days', case 
      when expires_at is null then null 
      else (extract(epoch from (expires_at - now()))/86400)::integer 
    end
  )
  from user_credits
  where user_id = $1;
$$ language sql security definer;

-- Function to expire old credits
create or replace function expire_old_credits()
returns void as $$
begin
  update user_credits
  set 
    available_credits = 0,
    total_credits = used_credits,
    updated_at = now()
  where expires_at is not null 
    and expires_at < now()
    and available_credits > 0;
  
  -- Optional: Log expired credits
  insert into credit_transactions (
    user_id,
    amount,
    type,
    description
  )
  select 
    user_id,
    -available_credits,
    'expiration',
    'Credits expired'
  from user_credits
  where expires_at is not null 
    and expires_at < now()
    and available_credits > 0;
  
  return;
end;
$$ language plpgsql;

-- Create a scheduled job to expire old credits (runs daily)
-- Note: This requires pg_cron extension to be installed in your Supabase project
-- Uncomment and run this in your Supabase SQL editor if you have pg_cron enabled
/*
select cron.schedule(
  'expire-old-credits',
  '0 0 * * *', -- Every day at midnight
  $$select expire_old_credits()$$
);
*/

-- Set up RLS (Row Level Security) policies
-- Enable RLS on credit_transactions
alter table credit_transactions enable row level security;

-- Enable RLS on user_credits
alter table user_credits enable row level security;

-- Create policies for credit_transactions
create policy "Users can view their own transactions"
on credit_transactions for select
using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
on credit_transactions for insert
with check (auth.uid() = user_id);

-- Create policies for user_credits
create policy "Users can view their own credit balance"
on user_credits for select
using (auth.uid() = user_id);

-- Create a function to handle new user signup (to be called by a trigger)
create or replace function handle_new_user() 
returns trigger as $$
begin
  -- Add free credits to new users
  perform add_credits(
    new.id, 
    20, -- 20 free credits (1 free song)
    30, -- Expires in 30 days
    'signup_bonus',
    'Welcome bonus for new users'
  );
  
  return new;
end;
$$ language plpgsql security definer;

-- Create a trigger to add free credits to new users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
