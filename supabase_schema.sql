-- =====================================================
-- GOLF CHARITY SUBSCRIPTION PLATFORM - SUPABASE SCHEMA
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query)
-- =====================================================

-- Drop existing tables to recreate with correct schema
DROP TABLE IF EXISTS draw_results CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS charity_events CASCADE;
DROP TABLE IF EXISTS charity_contributions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS draws CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS charities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Charities table (created first since profiles references it)
CREATE TABLE charities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  category TEXT,
  featured BOOLEAN DEFAULT FALSE,
  total_raised NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  polar_customer_id TEXT,
  selected_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_contribution_pct INTEGER DEFAULT 10 CHECK (charity_contribution_pct >= 10 AND charity_contribution_pct <= 100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  polar_subscription_id TEXT UNIQUE,
  polar_customer_id TEXT,
  product_id TEXT,
  plan TEXT CHECK (plan IN ('month', 'year')),
  status TEXT DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'active', 'canceled', 'past_due', 'revoked')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Golf Scores table
CREATE TABLE scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  played_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Charity Contributions table
CREATE TABLE charity_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  charity_id UUID REFERENCES charities(id),
  amount NUMERIC NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Charity Events table
CREATE TABLE charity_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  charity_id UUID REFERENCES charities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  registration_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Draws table
CREATE TABLE draws (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'simulated', 'published')),
  draw_type TEXT DEFAULT 'random' CHECK (draw_type IN ('random', 'algorithmic')),
  winning_numbers INTEGER[] NOT NULL DEFAULT '{}',
  total_prize_pool NUMERIC DEFAULT 0,
  five_match_pool NUMERIC DEFAULT 0,
  four_match_pool NUMERIC DEFAULT 0,
  three_match_pool NUMERIC DEFAULT 0,
  jackpot_rollover NUMERIC DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 9. Draw Results (winners) table
CREATE TABLE draw_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draw_id UUID REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  match_type TEXT CHECK (match_type IN ('5-match', '4-match', '3-match')),
  matched_numbers INTEGER[],
  prize_amount NUMERIC DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'submitted', 'approved', 'rejected')),
  proof_image_url TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- 10. Orders table (Polar payment events)
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  polar_order_id TEXT UNIQUE,
  user_id UUID REFERENCES profiles(id),
  amount NUMERIC,
  currency TEXT DEFAULT 'usd',
  billing_reason TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_polar_id ON subscriptions(polar_subscription_id);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_played_date ON scores(played_date DESC);
CREATE INDEX idx_charities_featured ON charities(featured);
CREATE INDEX idx_charity_contributions_user ON charity_contributions(user_id);
CREATE INDEX idx_charity_contributions_charity ON charity_contributions(charity_id);
CREATE INDEX idx_charity_events_charity ON charity_events(charity_id);
CREATE INDEX idx_charity_events_date ON charity_events(event_date);
CREATE INDEX idx_draws_status ON draws(status);
CREATE INDEX idx_draws_date ON draws(draw_date DESC);
CREATE INDEX idx_draw_results_draw ON draw_results(draw_id);
CREATE INDEX idx_draw_results_user ON draw_results(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_orders_polar_id ON orders(polar_order_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- TRIGGER: Auto-create profile on auth.users insert
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER charities_updated_at BEFORE UPDATE ON charities FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Charity total rollup helper
CREATE OR REPLACE FUNCTION increment_charity_total(charity_id_input UUID, amount_input NUMERIC)
RETURNS void AS $$
BEGIN
  UPDATE charities
  SET total_raised = COALESCE(total_raised, 0) + COALESCE(amount_input, 0)
  WHERE id = charity_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Scores
CREATE POLICY "Users can view own scores" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access scores" ON scores FOR ALL USING (auth.role() = 'service_role');

-- Charities: Public read
CREATE POLICY "Anyone can view charities" ON charities FOR SELECT USING (true);
CREATE POLICY "Service role full access charities" ON charities FOR ALL USING (auth.role() = 'service_role');

-- Charity Contributions
CREATE POLICY "Users can view own contributions" ON charity_contributions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access contributions" ON charity_contributions FOR ALL USING (auth.role() = 'service_role');

-- Charity Events: Public read
CREATE POLICY "Anyone can view charity events" ON charity_events FOR SELECT USING (true);
CREATE POLICY "Service role full access charity events" ON charity_events FOR ALL USING (auth.role() = 'service_role');

-- Notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');

-- Draws: Public read published
CREATE POLICY "Anyone can view published draws" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Service role full access draws" ON draws FOR ALL USING (auth.role() = 'service_role');

-- Draw Results
CREATE POLICY "Users can view own draw results" ON draw_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access draw results" ON draw_results FOR ALL USING (auth.role() = 'service_role');

-- Orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- SEED DATA: Sample Charities
-- =====================================================
INSERT INTO charities (name, description, image_url, category, featured) VALUES
('Golf For Good Foundation', 'Bringing golf opportunities to underserved communities worldwide. We provide equipment, training, and course access to young people who might never otherwise experience the game.', 'https://images.pexels.com/photos/6646933/pexels-photo-6646933.jpeg', 'Youth Development', true),
('Green Fairways Trust', 'Dedicated to environmental conservation through sustainable golf course management and wildlife habitat restoration on courses around the world.', 'https://images.pexels.com/photos/6995090/pexels-photo-6995090.jpeg', 'Environment', true),
('Swing For Hope', 'Supporting mental health awareness through golf therapy programs. Our courses provide therapeutic environments for veterans and first responders.', 'https://images.unsplash.com/photo-1559027615-cd4628902d4a', 'Mental Health', false),
('Birdie Brigade', 'A charity focused on using golf events to raise funds for children hospitals. Every birdie counts towards saving young lives.', 'https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg', 'Healthcare', true),
('Tee It Forward', 'Empowering women and girls through golf scholarships, mentoring programs, and creating inclusive golfing environments globally.', 'https://images.unsplash.com/photo-1591491719622-6e71a352d0e4', 'Education', false),
('The Back Nine Project', 'Providing adaptive golf programs for individuals with disabilities. Making the sport accessible and enjoyable for everyone.', 'https://images.pexels.com/photos/7551667/pexels-photo-7551667.jpeg', 'Accessibility', false);

INSERT INTO charity_events (charity_id, title, description, location, event_date, registration_url)
SELECT id, 'Spring Charity Golf Day', 'Fundraising golf day with community coaching and donor meet-up.', 'Pune Golf Club', NOW() + INTERVAL '21 days', 'https://example.com/register'
FROM charities
WHERE name = 'Golf For Good Foundation';

-- =====================================================
-- DONE! You should see "Success. No rows returned" message
-- =====================================================
