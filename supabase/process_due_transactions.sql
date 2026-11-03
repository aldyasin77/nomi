-- ============================================================
-- Nomi: Atomic Recurring Transactions Execution via Supabase RPC
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Pastikan kolom penanda last_processed_month ada di tabel recurring_transactions
ALTER TABLE public.recurring_transactions 
ADD COLUMN IF NOT EXISTS last_processed_month TEXT DEFAULT NULL;

-- 2. Buat index untuk mempercepat filter transaksi rutin yang jatuh tempo
CREATE INDEX IF NOT EXISTS idx_recurring_due_lookup 
ON public.recurring_transactions(user_id, is_active, execution_day, last_processed_month);

-- 3. Buat Database Function (RPC): process_due_transactions
-- Menjalankan eksekusi secara atomik dalam satu transaksi database dengan row-level lock (FOR UPDATE),
-- sehingga 100% kebal terhadap race condition dan duplikasi saat dibuka di banyak perangkat secara bersamaan.
CREATE OR REPLACE FUNCTION public.process_due_transactions(current_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
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
    -- Validasi keamanan: Pastikan pemanggil hanya mengeksekusi datanya sendiri
    IF auth.uid() IS NOT NULL AND auth.uid() <> current_user_id THEN
        RAISE EXCEPTION 'Akses ditolak: User ID tidak cocok dengan sesi login.';
    END IF;

    -- Ambil waktu saat ini di zona waktu 'Asia/Jakarta' (WIB)
    v_today_jakarta := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
    v_current_day := EXTRACT(DAY FROM v_today_jakarta)::INT;
    v_current_year := EXTRACT(YEAR FROM v_today_jakarta)::INT;
    v_current_month_num := EXTRACT(MONTH FROM v_today_jakarta)::INT;
    v_current_month_str := TO_CHAR(v_today_jakarta, 'YYYY-MM');
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_today_jakarta) + INTERVAL '1 month - 1 day'))::INT;

    -- Cari data recurring_transactions milik current_user_id
    -- Kriteria:
    -- 1. user_id = current_user_id
    -- 2. is_active = true
    -- 3. tanggal_pencairan <= hari_ini (dengan penanganan bulan pendek jika tgl 31)
    -- 4. last_processed_month IS DISTINCT FROM bulan_ini
    -- FOR UPDATE: Mengunci row agar jika ada perangkat lain memanggil di saat bersamaan,
    -- panggilan kedua akan menunggu transaksi ini commit dan tidak akan memproses ulang (mencegah duplikasi).
    FOR v_item IN
        SELECT *
        FROM public.recurring_transactions
        WHERE user_id = current_user_id
          AND is_active = TRUE
          AND last_processed_month IS DISTINCT FROM v_current_month_str
          AND (
              execution_day <= v_current_day 
              OR (execution_day >= v_days_in_month AND v_current_day = v_days_in_month)
          )
        FOR UPDATE
    LOOP
        -- Tentukan tanggal transaksi (cair pada tanggal eksekusinya di bulan ini)
        v_target_day := LEAST(v_item.execution_day, v_days_in_month);
        v_tx_date := MAKE_DATE(v_current_year, v_current_month_num, v_target_day);

        -- Normalisasi tipe transaksi ke format lowercase yang diterima tabel transactions
        IF LOWER(v_item.type) = 'income' OR LOWER(v_item.type) = 'pemasukan' THEN
            v_clean_type := 'income';
        ELSIF LOWER(v_item.type) = 'transfer' THEN
            v_clean_type := 'transfer';
        ELSE
            v_clean_type := 'expense';
        END IF;

        -- 1. INSERT ke tabel transactions
        -- Trigger database (trigger_update_wallet_balance) akan otomatis memperbarui saldo dompet!
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
            current_user_id,
            v_item.wallet_id,
            CASE WHEN v_clean_type = 'transfer' THEN v_item.to_wallet_id ELSE NULL END,
            CASE WHEN v_clean_type = 'transfer' THEN NULL ELSE v_item.category_id END,
            v_clean_type,
            v_item.amount,
            COALESCE(v_item.note, 'Transaksi Rutin'),
            v_tx_date
        );

        -- 2. Di dalam transaksi yang sama, langsung UPDATE last_processed_month
        UPDATE public.recurring_transactions
        SET last_processed_month = v_current_month_str,
            updated_at = NOW()
        WHERE id = v_item.id;

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'processed_count', v_processed_count,
        'processed_month', v_current_month_str
    );
END;
$$;

