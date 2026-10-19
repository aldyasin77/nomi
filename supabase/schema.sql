-- ============================================================
-- Nomi: Personal Finance Tracker — Database Schema & Policies
-- Execute this entire script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. Create Tables
-- ============================================================

-- 2.1 Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'e-wallet', 'savings', 'investment')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    annual_interest_rate NUMERIC(5, 2) DEFAULT 0.00,
    interest_payout_date NUMERIC(2, 0) DEFAULT NULL,
    card_theme TEXT DEFAULT 'aurora',
    bank_logo TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    monthly_limit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Row Level Security (RLS) - 100% Data Isolation
-- ============================================================

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Wallets
CREATE POLICY "Users can view own wallets"
    ON public.wallets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
    ON public.wallets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
    ON public.wallets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets"
    ON public.wallets FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for Categories
CREATE POLICY "Users can view own categories"
    ON public.categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
    ON public.categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
    ON public.categories FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
    ON public.categories FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for Transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- 4. Database Trigger: Auto Update Wallet Balance
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.wallets
            SET balance = balance + NEW.amount, updated_at = NOW()
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets
            SET balance = balance - NEW.amount, updated_at = NOW()
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            -- Deduct from source wallet
            UPDATE public.wallets
            SET balance = balance - NEW.amount, updated_at = NOW()
            WHERE id = NEW.wallet_id;
            -- Add to destination wallet
            IF NEW.to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets
                SET balance = balance + NEW.amount, updated_at = NOW()
                WHERE id = NEW.to_wallet_id;
            END IF;
        END IF;
        RETURN NEW;

    -- Handle DELETE (revert balance)
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.wallets
            SET balance = balance - OLD.amount, updated_at = NOW()
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets
            SET balance = balance + OLD.amount, updated_at = NOW()
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.wallets
            SET balance = balance + OLD.amount, updated_at = NOW()
            WHERE id = OLD.wallet_id;
            IF OLD.to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets
                SET balance = balance - OLD.amount, updated_at = NOW()
                WHERE id = OLD.to_wallet_id;
            END IF;
        END IF;
        RETURN OLD;

    -- Handle UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert OLD
        IF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            IF OLD.to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.to_wallet_id;
            END IF;
        END IF;

        -- Apply NEW
        IF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            IF NEW.to_wallet_id IS NOT NULL THEN
                UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.to_wallet_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON public.transactions;

CREATE TRIGGER trigger_update_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

-- ============================================================
-- 5. Auto-Seed Default Categories on User Registration
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.categories (user_id, name, type, monthly_limit) VALUES
        (NEW.id, 'Food & Dining', 'expense', 3000000.00),
        (NEW.id, 'Transportation', 'expense', 1000000.00),
        (NEW.id, 'Housing & Utilities', 'expense', 2500000.00),
        (NEW.id, 'Entertainment & Leisure', 'expense', 1000000.00),
        (NEW.id, 'Shopping & Groceries', 'expense', 2000000.00),
        (NEW.id, 'Salary / Income', 'income', 0.00),
        (NEW.id, 'Savings Interest', 'income', 0.00),
        (NEW.id, 'Investment / Dividend', 'income', 0.00);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_on_auth_user_created ON auth.users;

CREATE TRIGGER trigger_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_default_categories();

-- ============================================================
-- 7. Recurring Transactions (Subscriptions & Auto-debits)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    execution_day NUMERIC(2, 0) NOT NULL CHECK (execution_day >= 1 AND execution_day <= 31),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recurring transactions"
    ON public.recurring_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring transactions"
    ON public.recurring_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring transactions"
    ON public.recurring_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring transactions"
    ON public.recurring_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Migration for existing databases:
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS bank_logo TEXT DEFAULT NULL;

