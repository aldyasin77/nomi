-- ============================================================
-- Nomi: Savings Interest & Tax (20%) Automation with pg_cron
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Create the Stored Procedure to Process Monthly Savings Interest & Tax
CREATE OR REPLACE FUNCTION public.process_monthly_savings_interest()
RETURNS TABLE (
    processed_wallets INT,
    created_transactions INT,
    message TEXT
) AS $$
DECLARE
    v_today_jakarta DATE;
    v_current_day INT;
    v_days_in_month INT;
    v_wallet RECORD;
    v_gross_interest NUMERIC(15, 2);
    v_tax_amount NUMERIC(15, 2);
    v_already_processed BOOLEAN;
    v_income_cat_id UUID;
    v_tax_cat_id UUID;
    v_count_wallets INT := 0;
    v_count_tx INT := 0;
BEGIN
    -- Waktu lokal Indonesia (WIB = UTC+7)
    v_today_jakarta := (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE;
    v_current_day := EXTRACT(DAY FROM v_today_jakarta)::INT;
    
    -- Jumlah hari di bulan berjalan (28, 29, 30, atau 31)
    v_days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', v_today_jakarta) + INTERVAL '1 month - 1 day'))::INT;

    -- Iterasi semua dompet simpanan yang memiliki APR > 0, payout date valid, dan saldo > 0
    FOR v_wallet IN
        SELECT 
            w.id,
            w.user_id,
            w.name,
            w.balance,
            w.annual_interest_rate,
            w.interest_payout_date
        FROM public.wallets w
        WHERE w.annual_interest_rate IS NOT NULL
          AND w.annual_interest_rate > 0
          AND w.interest_payout_date IS NOT NULL
          AND w.balance > 0
          AND (
              -- Jatuh tempo tepat hari ini
              w.interest_payout_date = v_current_day
              OR
              -- Handle bulan pendek (misal tanggal pencairan 31, tapi bulan ini hanya ada 30 hari)
              (w.interest_payout_date >= v_days_in_month AND v_current_day = v_days_in_month)
          )
    LOOP
        -- 1. Cek apakah bunga bulan ini sudah pernah dicairkan untuk dompet ini (Idempotent check)
        SELECT EXISTS (
            SELECT 1 
            FROM public.transactions t
            WHERE t.wallet_id = v_wallet.id
              AND t.type = 'income'
              AND DATE_TRUNC('month', t.transaction_date) = DATE_TRUNC('month', v_today_jakarta)
              AND (t.note ILIKE '%Bunga Simpanan%' OR t.note ILIKE '%Savings Interest%')
        ) INTO v_already_processed;

        IF NOT v_already_processed THEN
            -- 2. Hitung Bunga Kotor (Gross Interest) per bulan
            -- Rumus standar: Saldo * (APR / 100) / 12 bulan
            v_gross_interest := ROUND(v_wallet.balance * (v_wallet.annual_interest_rate / 100.0) / 12.0);

            -- Hanya proses jika nilai bunga > 0
            IF v_gross_interest > 0 THEN
                -- 3. Hitung Pajak Bunga 20%
                v_tax_amount := ROUND(v_gross_interest * 0.20);

                -- 4. Cari atau buat Kategori Pemasukan Bunga (Savings Interest) untuk user ini
                SELECT id INTO v_income_cat_id
                FROM public.categories
                WHERE user_id = v_wallet.user_id
                  AND type = 'income'
                  AND (name ILIKE '%Savings Interest%' OR name ILIKE '%Bunga%')
                ORDER BY created_at ASC
                LIMIT 1;

                IF v_income_cat_id IS NULL THEN
                    INSERT INTO public.categories (user_id, name, type, monthly_limit)
                    VALUES (v_wallet.user_id, 'Savings Interest', 'income', 0.00)
                    RETURNING id INTO v_income_cat_id;
                END IF;

                -- 5. Cari atau buat Kategori Pengeluaran Pajak (Pajak Bunga) untuk user ini
                IF v_tax_amount > 0 THEN
                    SELECT id INTO v_tax_cat_id
                    FROM public.categories
                    WHERE user_id = v_wallet.user_id
                      AND type = 'expense'
                      AND (name ILIKE '%Pajak%' OR name ILIKE '%Tax%')
                    ORDER BY created_at ASC
                    LIMIT 1;

                    IF v_tax_cat_id IS NULL THEN
                        INSERT INTO public.categories (user_id, name, type, monthly_limit)
                        VALUES (v_wallet.user_id, 'Pajak Bunga', 'expense', 0.00)
                        RETURNING id INTO v_tax_cat_id;
                    END IF;
                END IF;

                -- 6. Insert Transaksi Pemasukan (Gross Bunga)
                INSERT INTO public.transactions (
                    user_id,
                    wallet_id,
                    category_id,
                    type,
                    amount,
                    transaction_date,
                    note
                ) VALUES (
                    v_wallet.user_id,
                    v_wallet.id,
                    v_income_cat_id,
                    'income',
                    v_gross_interest,
                    v_today_jakarta,
                    'Bunga Simpanan - ' || v_wallet.name
                );
                v_count_tx := v_count_tx + 1;

                -- 7. Insert Transaksi Pengeluaran (Pajak Bunga 20%)
                IF v_tax_amount > 0 THEN
                    INSERT INTO public.transactions (
                        user_id,
                        wallet_id,
                        category_id,
                        type,
                        amount,
                        transaction_date,
                        note
                    ) VALUES (
                        v_wallet.user_id,
                        v_wallet.id,
                        v_tax_cat_id,
                        'expense',
                        v_tax_amount,
                        v_today_jakarta,
                        'Pajak Bunga (20%) - ' || v_wallet.name
                    );
                    v_count_tx := v_count_tx + 1;
                END IF;

                v_count_wallets := v_count_wallets + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN QUERY SELECT 
        v_count_wallets, 
        v_count_tx, 
        'Proses bunga selesai: ' || v_count_wallets || ' dompet diproses, ' || v_count_tx || ' transaksi dicatat.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Hapus cron job lama jika sudah terdaftar
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'cron' AND table_name = 'job'
    ) THEN
        PERFORM cron.unschedule('daily-savings-interest-payout');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 4. Jadwalkan cron berjalan setiap hari jam 00:05 WIB (17:05 UTC)
SELECT cron.schedule(
    'daily-savings-interest-payout',
    '5 17 * * *',
    $$SELECT public.process_monthly_savings_interest();$$
);

-- 5. Jalankan langsung sekarang untuk memproses pencairan tanggal hari ini (28 Oktober)
SELECT * FROM public.process_monthly_savings_interest();

