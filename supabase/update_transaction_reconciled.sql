-- ============================================================
-- Nomi: Wallet Balance Reconciliation on Transaction Update
-- Run this script in Supabase Dashboard -> SQL Editor if needed
-- ============================================================

-- Function to handle wallet balance updates automatically whenever a transaction is inserted, updated, or deleted
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

    -- Handle UPDATE (revert OLD, apply NEW)
    ELSIF (TG_OP = 'UPDATE') THEN
        -- 1. Revert efek finansial data lama (OLD)
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

        -- 2. Terapkan efek finansial data baru (NEW)
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

-- Pastikan trigger terpasang pada tabel transactions
DROP TRIGGER IF EXISTS trigger_update_wallet_balance ON public.transactions;

CREATE TRIGGER trigger_update_wallet_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();

