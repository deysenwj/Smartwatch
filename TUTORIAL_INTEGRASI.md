# Panduan Lengkap Integrasi Resend.com, Supabase, dan Vercel (Domain: smartwatchindonesia.my.id)

Panduan ini berisi langkah-langkah urut dari awal untuk menghubungkan **GitHub**, **Resend.com** (menggunakan domain `smartwatchindonesia.my.id`), **Supabase**, dan **Vercel** agar fitur lupa password dengan OTP 8-digit dapat berjalan dengan sukses untuk seluruh pengguna umum.

---

## 📦 TAHAP 1: Konfigurasi di Resend.com & DNS Hosting

Langkah pertama adalah mendaftarkan domain baru Anda ke Resend dan memasukkan DNS record-nya di provider domain Anda agar email pengiriman Anda disetujui.

### 1. Daftarkan Domain Anda di Resend
1. Masuk ke dashboard **[Resend.com](https://resend.com)**.
2. Di menu sebelah kiri, klik **Domains**.
3. Klik tombol **Add Domain**.
4. Ketik domain Anda: `smartwatchindonesia.my.id`
5. Klik **Add**.
6. Resend akan menampilkan tabel berisi **3 baris DNS Records** (2 tipe TXT untuk DKIM, dan 1 tipe MX). *Biarkan halaman ini tetap terbuka.*

### 2. Tambahkan DNS Records ke DNS Manager Domain Anda
1. Buka tab baru di browser Anda, lalu login ke **Member Area** penyedia tempat Anda membeli domain (misal: Domainesia / Niagahoster).
2. Pergi ke bagian **Layanan Saya** -> klik **Domain** -> cari menu **Manage DNS** (atau **DNS Management** / **Zone Editor**).
3. Tambahkan 3 baris record dari Resend tadi satu per satu:
   * **Record 1 (Tipe TXT)**:
     * **Type**: `TXT`
     * **Host/Name**: *Salin kolom Name/Host dari Resend* (biasanya diawali `resend._domainkey...`)
     * **Value/TXT Data**: *Salin kolom Value dari Resend*
     * Klik **Save/Add**.
   * **Record 2 (Tipe TXT)**:
     * **Type**: `TXT`
     * **Host/Name**: `@` (atau biarkan kosong/isi dengan nama domain Anda jika tidak bisa diisi `@`)
     * **Value/TXT Data**: *Salin kolom Value dari Resend*
     * Klik **Save/Add**.
   * **Record 3 (Tipe MX)**:
     * **Type**: `MX`
     * **Host/Name**: `@` (atau biarkan kosong jika tidak bisa diisi `@`)
     * **Value/Points To**: *Salin kolom Value dari Resend* (biasanya `feedback.resend.com`)
     * **Priority** (jika diminta): `10`
     * Klik **Save/Add**.
4. Setelah ketiga record tersimpan, kembali ke halaman **Resend Domains** dan klik **Verify** di bagian kanan atas hingga statusnya berubah menjadi hijau **"Verified"**.

### 3. Buat API Key di Resend
1. Klik menu **API Keys** di sebelah kiri dashboard Resend.
2. Klik **Create API Key**.
3. Isi pop-up pengisian dengan:
   * **Name**: `Smartwatch Prod Key`
   * **Permission**: Pilih **`Full Access`**
   * **Domain**: Pilih **`All Domains`** (atau pilih `smartwatchindonesia.my.id`)
4. Klik **Add**, lalu langsung **Copy (Salin)** API Key yang muncul (berformat `re_xxxxxxxxxxxx`).

---

## ⚡ TAHAP 2: Konfigurasi Custom SMTP di Supabase

Langkah ini menyambungkan Supabase Anda ke server email Resend.

1. Masuk ke **[Supabase Dashboard](https://supabase.com)** dan pilih proyek Anda.
2. Di sidebar kiri paling bawah, klik **Project Settings** (ikon roda gigi ⚙️) -> pilih menu **Auth**.
3. Gulir ke bawah hingga bagian **SMTP Settings** (Custom SMTP Provider).
4. Aktifkan (toggle) **Enable Custom SMTP**.
5. Isi kolom-kolomnya dengan data berikut secara presisi:
   * **Sender Email**: `otp@smartwatchindonesia.my.id`
   * **Sender Name**: `Smartwatch Indonesia`
   * **SMTP Host**: `smtp.resend.com`
   * **SMTP Port**: `587`
   * **SMTP Username**: `resend` *(Ketik tulisan 'resend' biasa)*
   * **SMTP Password**: *(Tempel API Key `re_xxxxxxxxxxxx` yang Anda salin pada Tahap 1.3)*
6. Klik **Save** di bagian paling bawah.

---

## 📝 TAHAP 3: Ubah Template Reset Password di Supabase

Langkah ini membuat isi email pemulihan berisi kode OTP 8-digit.

1. Masih di halaman **Auth** Supabase, gulir ke atas ke bagian **Email Templates**.
2. Pilih tab **Reset Password**.
3. Ubah kolom **Message** (isi email) menjadi HTML berikut:
   ```html
   <h2>Atur Ulang Kata Sandi Smartwatch</h2>
   <p>Halo,</p>
   <p>Gunakan kode OTP 8-digit berikut untuk mengatur ulang kata sandi akun Anda:</p>
   <div style="font-size: 24px; font-weight: bold; background: #f3f4f6; padding: 12px 24px; display: inline-block; letter-spacing: 4px; border-radius: 6px; color: #1f2937;">
     {{ .Token }}
   </div>
   <p>Kode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.</p>
   ```
4. Klik **Save**.

---

## 🌐 TAHAP 4: Konfigurasi Environment Variables di Vercel

Daftarkan variabel lingkungan agar web Anda di Vercel bisa berkomunikasi dengan Supabase dan Resend secara langsung.

1. Masuk ke **[Vercel.com](https://vercel.com)** dan pilih proyek **Smartwatch** Anda.
2. Klik tab **Settings** di menu atas -> klik menu **Environment Variables** di kiri.
3. Gunakan form **Add Environment Variable** untuk menambahkan 4 variabel berikut satu per satu:

| Key (Kunci) | Value (Nilai) | Cara Mendapatkan Nilai |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | *URL Supabase Anda* | Salin dari Supabase -> Settings -> API -> Project URL |
| `VITE_SUPABASE_ANON_KEY` | *Anon Key Supabase Anda* | Salin dari Supabase -> Settings -> API -> `anon` `public` |
| `VITE_RESEND_API_KEY` | `re_xxxxxxxxxxxx` | API Key Resend yang disalin dari **Tahap 1.3** |
| `VITE_RESEND_FROM_EMAIL` | `Smartwatch OTP <otp@smartwatchindonesia.my.id>` | Tulis persis seperti ini agar terkirim dari domain baru Anda |

4. Klik **Add** untuk menyimpan masing-masing variabel.
5. Setelah semuanya tersimpan di daftar bawah, masuk ke tab **Deployments** -> klik tombol **tiga titik (...)** di kanan deployment terbaru -> pilih **Redeploy**.

---

## 🔄 TAHAP 5: Git Push untuk Memperbarui Kode Versi Terbaru

Kirim pembaruan kode visual (fitur penglihatan mata password & paksa re-login) ke GitHub agar Vercel mendeteksi perubahan.

1. Jalankan perintah ini di terminal proyek Anda:
   ```powershell
   git add .
   git commit -m "feat: implementasi final reset password otp dengan domain smartwatchindonesia.my.id"
   git push origin main
   ```
2. Vercel akan memproses pembangunan otomatis secara instan.

---

## 🧪 TAHAP 6: Pengujian Fitur Lupa Password

1. Kunjungi link produksi website Anda yang dihasilkan oleh Vercel.
2. Di halaman login, klik **Lupa?**.
3. Masukkan email terdaftar Anda (bisa email umum seperti Gmail teman Anda/email pribadi Anda), lalu klik **Kirim Kode OTP**.
4. Periksa kotak masuk email tersebut. Anda akan menerima email OTP 8-digit resmi dari pengirim `otp@smartwatchindonesia.my.id`.
5. Masukkan kode 8-digit tersebut di website, lalu klik **Verifikasi**.
6. Ketikkan kata sandi baru Anda (Gunakan tombol **Ikon Mata** untuk mengecek kata sandi Anda), lalu klik **Simpan Kata Sandi Baru**.
7. Sistem akan menyimpan kata sandi baru, mengeluarkan sesi Anda, menutup modal, dan meminta Anda untuk **Login Ulang secara manual** demi keamanan akun Anda!
