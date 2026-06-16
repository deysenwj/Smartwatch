-- ============================================================
-- FIX PASSWORD RESET — SmartWatch App
-- Jalankan SQL ini di Supabase → SQL Editor
-- Jalankan SATU PER SATU, mulai dari Step 1
-- ============================================================


-- ============================================================
-- STEP 1: Lihat status semua user di auth.users
-- Jalankan ini dulu untuk melihat kondisi saat ini
-- ============================================================
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ BELUM DIKONFIRMASI'
    ELSE '✅ Sudah dikonfirmasi'
  END AS status_konfirmasi
FROM auth.users
ORDER BY created_at DESC;


-- ============================================================
-- STEP 2: Konfirmasi SEMUA email yang belum dikonfirmasi
-- Jalankan ini jika ada yang status_konfirmasi = BELUM DIKONFIRMASI
-- ============================================================
UPDATE auth.users
SET
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  updated_at         = NOW()
WHERE email_confirmed_at IS NULL;


-- ============================================================
-- STEP 3: Verifikasi — jalankan lagi untuk memastikan sudah berubah
-- ============================================================
SELECT
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ MASIH BELUM DIKONFIRMASI'
    ELSE '✅ Sudah dikonfirmasi - bisa reset password'
  END AS status
FROM auth.users
ORDER BY created_at DESC;


-- ============================================================
-- STEP 4 (OPSIONAL): Konfirmasi email tertentu saja
-- Ganti 'email_anda@gmail.com' dengan email yang ingin di-fix
-- ============================================================
-- UPDATE auth.users
-- SET
--   email_confirmed_at = NOW(),
--   updated_at         = NOW()
-- WHERE email = 'email_anda@gmail.com';


-- ============================================================
-- STEP 5 (OPSIONAL): Lihat log error terbaru dari auth
-- ============================================================
SELECT
  created_at,
  payload->>'action' AS action,
  payload->>'error'  AS error,
  payload->>'email'  AS email
FROM auth.audit_log_entries
WHERE payload->>'action' IN (
  'user_recovery_requested',
  'user_recovery_failed',
  'token_refreshed'
)
ORDER BY created_at DESC
LIMIT 20;
