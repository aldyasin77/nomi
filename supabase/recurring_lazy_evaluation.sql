-- ============================================================
-- Nomi: Recurring Transactions Automation (Lazy Evaluation & RPC)
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Siapkan Kolom Penanda pada Tabel recurring_transactions
ALTER TABLE public.recurring_transactions 
ADD COLUMN IF NOT EXISTS last_processed_month TEXT DEFAULT NULL;

-- 2. Buat Index untuk mempercepat filter transaksi rutin aktif
CREATE INDEX IF NOT EXISTS idx_recurring_last_processed_month 
ON public.recurring_transactions(user_id, is_active, last_processed_month);

-- 3. Stored Procedure (RPC): process_due_recurring_transactions
-- Fungsi ini mengambil semua recurring_transactions aktif milik user saat ini,
-- mengecek apakah tanggal hari ini >= execution_day dan belum diproses di bulan ini,
-- lalu melakukan INSERT ke tabel transactions dan UPDATE ke recurring_transactions.
CREATE OR REPLACE FUNCTION public.process_due_recurring_transactions()
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_today_jakarta DATE;
    v_current_day INT;
    v_current_year INT;
    v_current_month_num INT;
    v_current_month_str TEXT;
    v_days_in_month INT;
    v_item RECORD;
    v_target_day INT;
    v_tx_date DATE;
    v_clean_type TEXT;
    v_processed_count INT := 0;
BEGIN
    -- Dapatkan user id dari session aktif
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
    END IF;

    -- Waktu lokal Indonesia (WIB = UTC+7)
    v_today_jakarta := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
    v_current_day := EXTRACT(DAY FROM v_today_jakarta)::INT;
    v_current_year := EXTRACT(YEAR FROM v_today_jakarta)::INT;
    v_current_month_num := EXTRACT(MONTH FROM v_today_jakarta)::INT;
    v_current_month_str := TO_CHAR(v_today_jakarta, 'YYYY-MM');
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_today_jakarta) + INTERVAL '1 month - 1 day'))::INT;

    -- Loop transaksi rutin aktif yang belum diproses di bulan ini
    FOR v_item IN
        SELECT *
        FROM public.recurring_transactions
        WHERE user_id = v_user_id
          AND is_active = TRUE
          AND (last_processed_month IS NULL OR last_processed_month != v_current_month_str)
    LOOP
        -- Tangani bulan pendek (misal tanggal 31 di bulan dengan 30 hari)
        v_target_day := LEAST(v_item.execution_day, v_days_in_month);

        -- Kondisi: Tanggal hari ini >= tanggal pencairan
        IF v_current_day >= v_target_day THEN
            v_tx_date := MAKE_DATE(v_current_year, v_current_month_num, v_target_day);

            -- Tipe transaksi lowercase untuk tabel transactions
            IF LOWER(v_item.type) = 'income' OR LOWER(v_item.type) = 'pemasukan' THEN
                v_clean_type := 'income';
            ELSIF LOWER(v_item.type) = 'transfer' THEN
                v_clean_type := 'transfer';
            ELSE
                v_clean_type := 'expense';
            END IF;

            -- 1. Insert ke tabel transactions
            -- Trigger trigger_update_wallet_balance akan otomatis mengupdate saldo dompet!
            INSERT INTO public.transactions (
                user_id,
                wallet_id,
                to_wallet_id,
                category_id,
                type,
                amount,
                note,
                transaction_date
            ) VALUES (
                v_user_id,
                v_item.wallet_id,
                CASE WHEN v_clean_type = 'transfer' THEN v_item.to_wallet_id ELSE NULL END,
                CASE WHEN v_clean_type = 'transfer' THEN NULL ELSE v_item.category_id END,
                v_clean_type,
                v_item.amount,
                COALESCE(v_item.note, 'Transaksi Rutin'),
                v_tx_date
            );

            -- 2. Langsung UPDATE last_processed_month pada recurring_transactions
            UPDATE public.recurring_transactions
            SET last_processed_month = v_current_month_str,
                updated_at = NOW()
            WHERE id = v_item.id;

            v_processed_count := v_processed_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'current_month', v_current_month_str
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Uji coba langsung eksekusi sekarang
SELECT public.process_due_recurring_transactions();

