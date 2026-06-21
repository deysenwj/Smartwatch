# 🐳 Tutorial Docker — Prototype SmartWatch

Panduan lengkap Docker **dari nol** untuk pemula. Ikuti langkah demi langkah!

---

## 📚 Bagian 1: Apa itu Docker?

### Docker = "Mesin Virtual Ringan"

Bayangkan Docker seperti **kotak ajaib** yang berisi semua yang dibutuhkan aplikasi Anda:
- ✅ Node.js (runtime JavaScript)
- ✅ Semua library (node_modules)
- ✅ Kode aplikasi Anda
- ✅ Server web (nginx)

**Keuntungan:**
- 🔄 **Konsisten**: Aplikasi berjalan sama di laptop, server, atau cloud
- 📦 **Portable**: Tinggal kirim 1 file, langsung jalan di mana saja
- 🧹 **Bersih**: Tidak perlu install Node.js/npm di komputer production
- 🚀 **Cepat**: Build sekali, deploy berkali-kali

### Istilah Penting

| Istilah | Arti |
|---------|------|
| **Dockerfile** | Resep memasak (instruksi membuat image) |
| **Image** | Makanan yang sudah jadi (template aplikasi) |
| **Container** | Makanan di piring (aplikasi yang sedang berjalan) |
| **docker-compose** | Menu restoran (menjalankan beberapa container sekaligus) |

---

## 🔧 Bagian 2: Instalasi Docker Desktop

### Langkah 1: Download Docker Desktop

1. Buka https://www.docker.com/products/docker-desktop/
2. Klik **"Download for Windows"**
3. Buka file installer `.exe` yang sudah di-download

### Langkah 2: Install Docker Desktop

1. Jalankan installer → klik **"Ok"**
2. Centang **"Use WSL 2 instead of Hyper-V"** (recommended)
3. Klik **"Next"** → **"Install"**
4. Tunggu proses instalasi selesai (±5 menit)
5. Klik **"Close and restart"** (komputer akan restart)

### Langkah 3: Verifikasi Instalasi

Setelah restart, buka **PowerShell** dan ketik:

```powershell
docker --version
docker compose version
```

**Output yang diharapkan:**
```
Docker version 24.x.x, build xxxxx
Docker Compose version v2.x.x
```

✅ Jika muncul angka versi, Docker sudah berhasil diinstall!

### Langkah 4: Aktifkan Docker Desktop

1. Buka aplikasi **Docker Desktop** dari Start Menu
2. Terima terms & conditions
3. Tunggu sampai icon Docker di system tray berubah jadi **hijau** 🟢
4. Docker siap digunakan!

> ⏱️ Proses pertama kali bisa memakan waktu 2-3 menit.

---

## 📁 Bagian 3: Struktur File Docker

Proyek Anda sekarang punya 4 file Docker penting:

```
Prototype SmartWacth/
├── Dockerfile            ← Resep membuat image
├── docker-compose.yml    ← Konfigurasi menjalankan container
├── .dockerignore         ← File yang diabaikan Docker
└── nginx.conf            ← Konfigurasi web server nginx
```

### Penjelasan Setiap File

#### 📄 Dockerfile
> "Resep memasak" — instruksi langkah demi langkah untuk membuat image.

#### 📄 docker-compose.yml
> "Menu restoran" — menjalankan container dengan konfigurasi mudah.

#### 📄 .dockerignore
> "Daftar yang tidak dimasak" — file yang tidak perlu dimasukkan ke image (node_modules, .git, dll).

#### 📄 nginx.conf
> "Aturan pelayan restoran" — web server yang menyajikan file HTML ke browser.

---

## 🚀 Bagian 4: Menjalankan dengan Docker

### Cara 1: Menggunakan docker-compose (RECOMMENDED ⭐)

**Ini cara paling mudah!** Cukup 1 perintah.

#### Langkah 1: Buka Terminal

1. Buka **PowerShell** atau **Command Prompt**
2. Pindah ke folder proyek:

```powershell
cd "d:\Lectures\Semester 8\RPL\Prototype SmartWacth"
```

#### Langkah 2: Build dan Jalankan

```powershell
docker compose up --build
```

**Apa yang terjadi?**
1. Docker membaca `docker-compose.yml`
2. Build image dari `Dockerfile` (install dependencies, build Vite)
3. Jalankan container dengan nginx
4. Aplikasi bisa diakses di **http://localhost:8080**

> ⏱️ **Build pertama**: ±2-5 menit (download base image + install dependencies)
> 
> 🔁 **Build selanjutnya**: ±30 detik (cache sudah tersedia)

#### Langkah 3: Akses Aplikasi

Buka browser dan ketik:
```
http://localhost:8080
```

🎉 Aplikasi SmartWatch sudah berjalan di Docker!

#### Langkah 4: Stop Aplikasi

Di terminal yang menjalankan `docker compose up`, tekan:
```
Ctrl + C
```

Atau buka terminal baru dan jalankan:
```powershell
docker compose down
```

---

### Cara 2: Menggunakan Perintah Docker Manual

Untuk yang ingin memahami proses di balik layar.

#### Step 1: Build Image

```powershell
cd "d:\Lectures\Semester 8\RPL\Prototype SmartWacth"
docker build -t smartwatch-app .
```

> `-t smartwatch-app` = memberi nama image "smartwatch-app"
> 
> `.` = build dari folder saat ini

#### Step 2: Jalankan Container

```powershell
docker run -d -p 8080:80 --name smartwatch smartwatch-app
```

> `-d` = jalankan di background (detached)
> 
> `-p 8080:80` = mapping port 8080 (laptop) ke port 80 (container)
> 
> `--name smartwatch` = nama container

#### Step 3: Lihat Container Berjalan

```powershell
docker ps
```

#### Step 4: Stop Container

```powershell
docker stop smartwatch
docker rm smartwatch
```

---

## 🔍 Bagian 5: Perintah Docker yang Sering Dipakai

| Perintah | Fungsi |
|----------|--------|
| `docker compose up --build` | Build & jalankan semua service |
| `docker compose up -d` | Jalankan di background |
| `docker compose down` | Hentikan semua container |
| `docker compose logs` | Lihat log output |
| `docker compose logs -f` | Lihat log secara real-time |
| `docker ps` | Lihat container yang berjalan |
| `docker ps -a` | Lihat semua container (termasuk yang mati) |
| `docker images` | Lihat semua image yang ada |
| `docker image rm <nama>` | Hapus image |
| `docker system prune -a` | Bersihkan semua yang tidak terpakai |
| `docker compose restart` | Restart semua container |

---

## 🎯 Bagian 6: Workflow Development vs Production

### Development (Saat Coding) 🛠️

Tetap gunakan cara biasa (tanpa Docker):
```powershell
npm run dev
```

Akses di: `http://localhost:5174`

**Kenapa?**
- Hot reload otomatis (perubahan langsung terlihat)
- Build lebih cepat
- Lebih mudah debugging

### Production (Deploy) 🚀

Gunakan Docker:
```powershell
docker compose up --build -d
```

Akses di: `http://localhost:8080`

**Kenapa?**
- Image siap dikirim ke server manapun
- Performa optimal dengan nginx
- Tidak perlu install Node.js di server

---

## 🌐 Bagian 7: Deployment ke Server

### Skenario: Anda punya server VPS (DigitalOcean, AWS, dll)

#### Langkah 1: Install Docker di Server

```bash
# Untuk Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### Langkah 2: Upload Proyek ke Server

**Cara A: Menggunakan Git**
```bash
git clone https://github.com/username/smartwatch.git
cd smartwatch
```

**Cara B: Menggunakan SCP**
```bash
# Dari laptop Anda
scp -r "d:\Lectures\Semester 8\RPL\Prototype SmartWacth" user@server-ip:/home/user/
```

#### Langkah 3: Setup Environment Variables

```bash
cd smartwatch
nano .env
```

Isi dengan konfigurasi Supabase Anda:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

#### Langkah 4: Build & Jalankan

```bash
docker compose up --build -d
```

#### Langkah 5: Akses dari Internet

Buka browser dan ketik:
```
http://ip-server-anda:8080
```

---

## 🐛 Bagian 8: Troubleshooting

### ❌ "docker: command not found"

**Solusi:** Docker Desktop belum terinstall atau belum berjalan.
1. Buka Docker Desktop dari Start Menu
2. Tunggu icon jadi hijau 🟢

### ❌ "Error: port 8080 already in use"

**Solusi:** Port 8080 sudah dipakai aplikasi lain.

**Opsi 1:** Ubah port di `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Ubah 8080 jadi 3000
```

**Opsi 2:** Hentikan container yang menggunakan port 8080:
```powershell
docker ps
docker stop <container-id>
```

### ❌ "Build gagal: Cannot find module"

**Solusi:** Hapus cache dan build ulang:
```powershell
docker compose down
docker system prune -f
docker compose up --build
```

### ❌ "Aplikasi blank/kosong di browser"

**Solusi:** 
1. Cek apakah `.env` sudah ada:
   ```powershell
   cat .env
   ```
2. Pastikan Supabase URL & key benar
3. Cek log container:
   ```powershell
   docker compose logs
   ```

### ❌ "Changes tidak muncul setelah edit kode"

**Solusi:** Build image Docker tidak otomatis update saat kode berubah.
```powershell
# Build ulang
docker compose up --build
```

> 💡 Untuk development, tetap pakai `npm run dev` agar perubahan langsung terlihat!

---

## 📊 Bagian 9: Tips & Best Practices

### ✅ DO (Lakukan)
- Gunakan `.dockerignore` agar image kecil
- Gunakan multi-stage build (sudah di-setup!)
- Simpan `.env` di luar Git (sudah di `.gitignore`)
- Gunakan `docker compose` untuk kemudahan

### ❌ DON'T (Jangan)
- Jangan commit `.env` ke Git
- Jangan masukkan `node_modules` ke image
- Jangan pakai Docker untuk development daily
- Jangan lupa stop container setelah selesai

---

## 🎓 Ringkasan Cepat

```powershell
# 1. Install Docker Desktop → https://docker.com/products/docker-desktop/

# 2. Buka terminal di folder proyek
cd "d:\Lectures\Semester 8\RPL\Prototype SmartWacth"

# 3. Pastikan .env sudah ada
notepad .env

# 4. Build dan jalankan
docker compose up --build

# 5. Akses di browser
# http://localhost:8080

# 6. Stop saat selesai
Ctrl + C
# atau
docker compose down
```

---

> **🎉 Selamat! Anda sekarang bisa menjalankan aplikasi SmartWatch dengan Docker!**
> 
> Docker memastikan aplikasi berjalan **sama persis** di semua komputer — tidak ada lagi *"di laptop saya jalan, di server tidak"*.
