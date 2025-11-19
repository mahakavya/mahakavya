-- Admin Dashboard Schema Migration
-- Creates all tables and policies needed for /niyantrana admin dashboard

-- 1. Users & Roles (extend existing user_profiles if needed)
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','ADMIN','SUPER_ADMIN','MASTER_ADMIN'));
    END IF;
END $$;

-- 2. Content moderation signals
CREATE TABLE IF NOT EXISTS public.moderation_flags (
    id bigserial PRIMARY KEY,
    content_type text NOT NULL CHECK (content_type IN ('post','reel','comment')),
    content_id uuid NOT NULL,
    reporter_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason text NOT NULL,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    created_at timestamptz NOT NULL DEFAULT now(),
    reviewed_by uuid REFERENCES public.profiles(id),
    reviewed_at timestamptz
);

-- 3. Fundraisers summary
CREATE TABLE IF NOT EXISTS public.fundraisers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    target_amount numeric(12,2) NOT NULL CHECK (target_amount >= 0),
    raised_amount numeric(12,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','CLOSED')),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Subscriptions (Premium)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'PREMIUM',
    status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','CANCELLED','EXPIRED')),
    started_at timestamptz NOT NULL DEFAULT now(),
    ends_at timestamptz
);

-- 5. Usage snapshots (daily aggregates)
CREATE TABLE IF NOT EXISTS public.daily_usage (
    usage_date date NOT NULL,
    dau int NOT NULL DEFAULT 0,
    new_signups int NOT NULL DEFAULT 0,
    premium_active int NOT NULL DEFAULT 0,
    posts int NOT NULL DEFAULT 0,
    reels int NOT NULL DEFAULT 0,
    messages int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (usage_date)
);

-- 6. Audit log for admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id bigserial PRIMARY KEY,
    actor_id uuid REFERENCES public.profiles(id),
    action text NOT NULL,
    target text,
    meta jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 8. Helper function: is_admin()
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.profiles
        WHERE id = uid AND role IN ('ADMIN','SUPER_ADMIN','MASTER_ADMIN')
    );
$$;

-- 9. RLS Policies
-- User profiles
CREATE POLICY "admins read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "self read profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Moderation flags
CREATE POLICY "admins read moderation" ON public.moderation_flags
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "admins update moderation" ON public.moderation_flags
    FOR UPDATE TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Fundraisers
CREATE POLICY "admins read fundraisers" ON public.fundraisers
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "creators read own fundraisers" ON public.fundraisers
    FOR SELECT TO authenticated
    USING (creator_id = auth.uid());

-- Subscriptions
CREATE POLICY "admins read subscriptions" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "users read own subscriptions" ON public.user_subscriptions
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Daily usage
CREATE POLICY "admins read usage" ON public.daily_usage
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

-- Audit logs
CREATE POLICY "admins read audit" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin(auth.uid()));

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_status ON public.moderation_flags(status);
CREATE INDEX IF NOT EXISTS idx_moderation_flags_created_at ON public.moderation_flags(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fundraisers_status ON public.fundraisers(status);
CREATE INDEX IF NOT EXISTS idx_fundraisers_created_at ON public.fundraisers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_daily_usage_date ON public.daily_usage(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 11. Functions for dashboard metrics
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    result json;
BEGIN
    -- Check if user is admin
    IF NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT json_build_object(
        'dau_today', COALESCE((SELECT dau FROM public.daily_usage WHERE usage_date = CURRENT_DATE), 0),
        'new_signups_today', COALESCE((SELECT new_signups FROM public.daily_usage WHERE usage_date = CURRENT_DATE), 0),
        'premium_active', (SELECT COUNT(*) FROM public.user_subscriptions WHERE status = 'ACTIVE'),
        'total_revenue_est', (SELECT COUNT(*) * 499 FROM public.user_subscriptions WHERE status = 'ACTIVE'),
        'open_flags', (SELECT COUNT(*) FROM public.moderation_flags WHERE status = 'PENDING'),
        'active_fundraisers', (SELECT COUNT(*) FROM public.fundraisers WHERE status = 'ACTIVE')
    ) INTO result;

    RETURN result;
END;
$$;

-- 12. Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fundraisers_updated_at
    BEFORE UPDATE ON public.fundraisers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
