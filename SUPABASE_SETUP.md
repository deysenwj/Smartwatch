# Panduan Supabase untuk Smartwatch

## 1. Konfigurasi dasar

1. Buat project di Supabase.
2. Buka **Project Settings > API**, lalu copy:
   - Project URL
   - anon public key
3. Buat file `.env` (atau salin dari `.env.example`) dan isi:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

4. Jalankan: `npm run dev`
5. Aktifkan email auth di **Authentication > Providers > Email**.

## 2. Skema tabel

Jalankan di **SQL Editor** Supabase untuk membuat/memperbarui tabel, fungsi trigger, dan aturan RLS (Row Level Security):

```sql
-- 1. Buat/perbarui tabel profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  avatar_url TEXT,
  push_notif BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pastikan kolom email ada jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Pastikan kolom settings & avatar ada jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notif BOOLEAN DEFAULT false;

-- 2. Buat/perbarui tabel reports (pengaduan)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  location TEXT,
  incident_date DATE,
  status TEXT DEFAULT 'Menunggu',
  catatan JSONB DEFAULT '[]'::jsonb,
  bukti_url TEXT,
  bukti_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pastikan kolom catatan ada jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE reports ADD COLUMN IF NOT EXISTS catatan JSONB DEFAULT '[]'::jsonb;

-- Pastikan kolom bukti ada jika tabel sudah terlanjur dibuat sebelumnya
ALTER TABLE reports ADD COLUMN IF NOT EXISTS bukti_url TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS bukti_name TEXT;

-- Pastikan foreign key mengarah ke profiles(id) untuk kemudahan join query di Supabase
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE reports
  ADD CONSTRAINT reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- 3. Buat/perbarui tabel notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pastikan foreign key notifications mengarah ke profiles(id)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- Backfill data pengguna yang sudah terlanjur mendaftar sebelumnya agar masuk ke profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email), COALESCE(raw_user_meta_data->>'role', 'user')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. Fungsi trigger otomatis saat registrasi user baru di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger (jalankan ini jika trigger belum ada)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4b. Fungsi trigger otomatis saat profil dihapus oleh admin untuk membersihkan auth.users
CREATE OR REPLACE FUNCTION public.handle_delete_profile()
RETURNS trigger AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pasang trigger delete (jalankan ini untuk mengaktifkan sinkronisasi penghapusan)
-- DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
-- CREATE TRIGGER on_profile_deleted
--   AFTER DELETE ON public.profiles
--   FOR EACH ROW EXECUTE FUNCTION public.handle_delete_profile();

-- 5. Konfigurasi Row Level Security (RLS) & Kebijakan (Policies)

-- Definisikan fungsi is_admin() dengan SECURITY DEFINER agar aman dari infinite recursion RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'admin@smartwatch.go.id' OR email LIKE 'admin@%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabel Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (public.is_admin());

-- Tabel Reports RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own reports" ON reports;
CREATE POLICY "Users can manage own reports" ON reports
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all reports" ON reports;
CREATE POLICY "Admins can manage all reports" ON reports
  FOR ALL USING (public.is_admin());

-- Tabel Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (public.is_admin());
```
## 3. Konfigurasi Storage (Bucket Bukti Laporan & Foto Profil)

Jalankan skrip SQL berikut di **SQL Editor** Supabase untuk membuat bucket storage `'bukti-laporan'` dan `'avatars'` serta mengatur kebijakan akses (RLS) agar user terautentikasi dapat mengunggah file dan semua orang dapat membacanya secara publik:

```sql
-- 1. Buat bucket 'bukti-laporan' & 'avatars' di storage Supabase (jika belum ada)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('bukti-laporan', 'bukti-laporan', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Kebijakan akses agar file dapat dibaca/diunduh secara publik
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id IN ('bukti-laporan', 'avatars'));

-- 3. Kebijakan akses agar pengguna terautentikasi dapat mengunggah file
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('bukti-laporan', 'avatars') AND
    auth.role() = 'authenticated'
  );
```

## 4. Daftarkan akun Admin di Supabase

Admin **tidak** didaftarkan lewat halaman register aplikasi. Buat manual di Supabase:

1. Buka **Authentication > Users > Add user**
2. Isi email & password admin
3. Centang **Auto Confirm User**
4. Di **User Metadata**, tambahkan:

```json
{
  "full_name": "Admin Smartwatch",
  "phone": "+62 811-0000-0001",
  "role": "admin"
}
```

5. Simpan.

Jika trigger sudah dibuat, profil otomatis masuk ke tabel `profiles` dengan `role = admin`.

## 5. Login

Gunakan **halaman login yang sama** seperti pengguna biasa:

- Login dengan email & password admin → otomatis masuk ke **halaman Admin**
- Login dengan akun user → masuk ke **dashboard pengguna**

Role ditentukan dari `user_metadata.role` or `profiles.role` di Supabase.

## 6. Mode lokal (tanpa Supabase)

Jika `.env` kosong, demo admin lokal tetap berfungsi:

- Email: `admin@smartwatch.go.id`
- Password: `admin123`
