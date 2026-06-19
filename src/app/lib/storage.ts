// ── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
  avatarUrl?: string;
  pushNotif?: boolean;
}

export interface ReportNote {
  text: string;
  status: string;
  by: string;
  at: string;
  buktiUrl?: string;
  buktiName?: string;
}

export interface Report {
  id: string;
  judul: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  tanggalKejadian: string;
  tanggalDibuat: string;
  tanggalUpdate?: string;
  status: "Menunggu" | "Diproses" | "Selesai" | "Ditolak";
  userId: string;   // email
  userUUID?: string; // Supabase user ID UUID
  userName: string;
  buktiUrl?: string; // URL bukti lampiran
  buktiName?: string; // Nama file bukti lampiran
  catatan: ReportNote[];
}

export interface Notification {
  id: string;
  text: string;
  time: string;
  read: boolean;
  type: "success" | "info" | "warning" | "error";
}

export interface UserSettings {
  pushNotif: boolean;
}

// ── Keys ───────────────────────────────────────────────────────────────────

const USERS_KEY    = "users";
const REPORTS_KEY  = "reports";
const CUR_USER_KEY = "currentUser";
const notifKey     = (email: string) => `notifications_${email}`;
const settingsKey  = (email: string) => `settings_${email}`;

// ── Seed data ──────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  { name: "Admin Smartwatch", email: "admin@smartwatch.go.id", phone: "+62 811-0000-0001", password: "admin123", role: "admin",  createdAt: "2024-01-01T00:00:00Z" },
  { name: "Ahmad Fauzi",      email: "ahmad@mail.com",         phone: "+62 812-1234-5678", password: "user123",  role: "user",   createdAt: "2024-01-15T00:00:00Z" },
  { name: "Siti Rahayu",      email: "siti@mail.com",          phone: "+62 813-9876-5432", password: "user123",  role: "user",   createdAt: "2024-02-01T00:00:00Z" },
];

const SEED_REPORTS: Report[] = [
  // JANUARI 2026 (2 reports)
  {
    id: "LW-2026-001",
    judul: "Percobaan Phishing Email Instansi",
    kategori: "Siber",
    deskripsi: "Ditemukan sebaran email palsu mengatasnamakan instansi pelayanan publik untuk mencuri credential data kependudukan.",
    lokasi: "Kecamatan Menteng, Jakarta Pusat",
    tanggalKejadian: "2026-01-08",
    tanggalDibuat: "2026-01-10T09:00:00Z",
    status: "Selesai",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Laporan diteruskan ke unit siber. Domain phising telah diblokir.", status: "Selesai", by: "Admin", at: "2026-01-12T14:30:00Z" }]
  },
  {
    id: "LW-2026-002",
    judul: "Penipuan Toko Online Palsu",
    kategori: "Penipuan",
    deskripsi: "Toko online fiktif di media sosial menjanjikan barang murah namun menghilang setelah transfer dana dilakukan.",
    lokasi: "Kelurahan Kebon Sirih, Jakarta Pusat",
    tanggalKejadian: "2026-01-15",
    tanggalDibuat: "2026-01-18T10:15:00Z",
    status: "Selesai",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Bukti transfer telah diverifikasi. Rekening pelaku dilaporkan untuk dibekukan.", status: "Selesai", by: "Admin", at: "2026-01-20T11:00:00Z" }]
  },

  // FEBRUARI 2026 (4 reports)
  {
    id: "LW-2026-003",
    judul: "Pencurian Helm di Area Parkir Kantor",
    kategori: "Pencurian",
    deskripsi: "Hilang helm bermerek di parkiran basemen kantor balai kota pada siang hari.",
    lokasi: "Gedung Balai Kota, Jakarta",
    tanggalKejadian: "2026-02-05",
    tanggalDibuat: "2026-02-06T14:20:00Z",
    status: "Selesai",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "CCTV telah diperiksa dan diserahkan kepada pihak keamanan setempat.", status: "Selesai", by: "Admin", at: "2026-02-08T09:00:00Z" }]
  },
  {
    id: "LW-2026-004",
    judul: "Investasi Emas Bodong Telegram",
    kategori: "Penipuan",
    deskripsi: "Grup Telegram menjanjikan investasi emas dengan keuntungan 50% per minggu yang berujung penipuan berantai.",
    lokasi: "Online / Media Sosial",
    tanggalKejadian: "2026-02-12",
    tanggalDibuat: "2026-02-14T08:30:00Z",
    status: "Diproses",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Sedang dilakukan investigasi awal terhadap grup Telegram terkait.", status: "Diproses", by: "Admin", at: "2026-02-15T10:00:00Z" }]
  },
  {
    id: "LW-2026-005",
    judul: "Peretasan Akun WhatsApp Publik",
    kategori: "Siber",
    deskripsi: "Akun WhatsApp pengurus lingkungan diretas dan digunakan untuk meminta pinjaman uang kepada warga sekitar.",
    lokasi: "Kecamatan Gambir, Jakarta Pusat",
    tanggalKejadian: "2026-02-20",
    tanggalDibuat: "2026-02-22T11:45:00Z",
    status: "Diproses",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Proses pemulihan akun sedang dibantu berkoordinasi dengan penyedia layanan komunikasi.", status: "Diproses", by: "Admin", at: "2026-02-23T15:00:00Z" }]
  },
  {
    id: "LW-2026-006",
    judul: "Kekerasan Verbal di Tempat Umum",
    kategori: "Kekerasan",
    deskripsi: "Kejadian intimidasi dan ancaman kekerasan verbal oleh sekelompok orang di area taman kota.",
    lokasi: "Taman Lapangan Banteng, Jakarta",
    tanggalKejadian: "2026-02-25",
    tanggalDibuat: "2026-02-26T16:00:00Z",
    status: "Diproses",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Laporan diteruskan ke Satpol PP pos terdekat untuk patroli rutin tambahan.", status: "Diproses", by: "Admin", at: "2026-02-27T08:30:00Z" }]
  },

  // MARET 2026 (3 reports)
  {
    id: "LW-2026-007",
    judul: "Parkir Liar Menutupi Jalur Pedestrian",
    kategori: "Ketertiban",
    deskripsi: "Banyak mobil parkir di atas trotoar depan pertokoan yang mengganggu akses pejalan kaki.",
    lokasi: "Jl. Gajah Mada, Jakarta Pusat",
    tanggalKejadian: "2026-03-04",
    tanggalDibuat: "2026-03-05T09:15:00Z",
    status: "Selesai",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Petugas Dishub telah diterjunkan untuk melakukan penertiban dan penggembokan roda.", status: "Selesai", by: "Admin", at: "2026-03-06T11:00:00Z" }]
  },
  {
    id: "LW-2026-008",
    judul: "Modus Penipuan Menang Undian SMS",
    kategori: "Penipuan",
    deskripsi: "Menerima pesan SMS penipuan yang menyatakan menang hadiah ratusan juta rupiah dengan melampirkan link palsu.",
    lokasi: "Online / SMS",
    tanggalKejadian: "2026-03-10",
    tanggalDibuat: "2026-03-12T07:20:00Z",
    status: "Selesai",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Laporan nomor pengirim dan link palsu telah diserahkan ke aduankonten.id.", status: "Selesai", by: "Admin", at: "2026-03-13T16:00:00Z" }]
  },
  {
    id: "LW-2026-009",
    judul: "Pencurian Sepeda Lipat",
    kategori: "Pencurian",
    deskripsi: "Pencurian sepeda lipat di halaman teras rumah terekam kamera CCTV tetangga.",
    lokasi: "Kelurahan Cideng, Jakarta Pusat",
    tanggalKejadian: "2026-03-20",
    tanggalDibuat: "2026-03-22T13:40:00Z",
    status: "Diproses",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Rekaman CCTV pelaku telah diserahkan ke pihak kepolisian setempat.", status: "Diproses", by: "Admin", at: "2026-03-24T10:00:00Z" }]
  },

  // APRIL 2026 (6 reports)
  {
    id: "LW-2026-010",
    judul: "Penyebaran Malware Ransomware",
    kategori: "Siber",
    deskripsi: "Sistem komputer sekolah terkena ransomware yang mengunci data-data rapor siswa.",
    lokasi: "SMA Negeri 10, Jakarta Pusat",
    tanggalKejadian: "2026-04-03",
    tanggalDibuat: "2026-04-05T09:00:00Z",
    status: "Diproses",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Laporan sedang diproses bersama ahli IT BSSN daerah untuk pemulihan.", status: "Diproses", by: "Admin", at: "2026-04-06T14:00:00Z" }]
  },
  {
    id: "LW-2026-011",
    judul: "Penipuan Arisan Online Fiktif",
    kategori: "Penipuan",
    deskripsi: "Owner arisan online kabur membawa uang tarikan para anggota sebesar puluhan juta rupiah.",
    lokasi: "Kelurahan Petojo Utara, Jakarta Pusat",
    tanggalKejadian: "2026-04-08",
    tanggalDibuat: "2026-04-10T11:30:00Z",
    status: "Diproses",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Sedang dilakukan verifikasi dokumen keanggotaan arisan.", status: "Diproses", by: "Admin", at: "2026-04-12T09:00:00Z" }]
  },
  {
    id: "LW-2026-012",
    judul: "Pencurian Dompet di KRL",
    kategori: "Pencurian",
    deskripsi: "Pencopetan dompet di gerbong KRL rute Bogor - Jakarta Kota pada saat jam padat pulang kerja.",
    lokasi: "Stasiun Sudirman, Jakarta",
    tanggalKejadian: "2026-04-15",
    tanggalDibuat: "2026-04-16T19:30:00Z",
    status: "Selesai",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Laporan diteruskan ke PKD stasiun. Kartu identitas korban berhasil ditemukan kembali.", status: "Selesai", by: "Admin", at: "2026-04-18T10:00:00Z" }]
  },
  {
    id: "LW-2026-013",
    judul: "Kekerasan Fisik / Tawuran Pelajar",
    kategori: "Kekerasan",
    deskripsi: "Aksi bentrokan antar pelajar sekolah di persimpangan jalan menggunakan benda tumpul.",
    lokasi: "Jl. Kramat Raya, Jakarta Pusat",
    tanggalKejadian: "2026-04-20",
    tanggalDibuat: "2026-04-22T15:45:00Z",
    status: "Selesai",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Polsek setempat merespons cepat untuk membubarkan massa dan mengamankan pelaku.", status: "Selesai", by: "Admin", at: "2026-04-22T17:00:00Z" }]
  },
  {
    id: "LW-2026-014",
    judul: "Pelanggaran Pembuangan Sampah Liar",
    kategori: "Ketertiban",
    deskripsi: "Oknum warga membuang sampah rumah tangga dalam jumlah besar ke bantaran sungai pada malam hari.",
    lokasi: "Kali Ciliwung, Jakarta Pusat",
    tanggalKejadian: "2026-04-24",
    tanggalDibuat: "2026-04-25T10:00:00Z",
    status: "Diproses",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: [{ text: "Petugas kebersihan setempat telah dikerahkan dan dipasang spanduk larangan.", status: "Diproses", by: "Admin", at: "2026-04-27T08:00:00Z" }]
  },
  {
    id: "LW-2026-015",
    judul: "Lampu Penerangan Jalan Umum Padam",
    kategori: "Lainnya",
    deskripsi: "Tiga tiang lampu PJU mati total di jalur alternatif yang rawan kejahatan jalanan.",
    lokasi: "Jl. Cideng Timur, Jakarta Pusat",
    tanggalKejadian: "2026-04-28",
    tanggalDibuat: "2026-04-29T21:00:00Z",
    status: "Selesai",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: [{ text: "Suku dinas perindustrian dan energi telah memperbaiki sambungan lampu.", status: "Selesai", by: "Admin", at: "2026-05-01T10:00:00Z" }]
  },

  // MEI 2026 (8 reports)
  {
    id: "LW-2026-016",
    judul: "Penipuan Mengatasnamakan Bank",
    kategori: "Penipuan",
    deskripsi: "Mendapat telepon dari oknum yang mengaku petugas bank meminta kode OTP kartu kredit.",
    lokasi: "Telepon / Seluler",
    tanggalKejadian: "2026-05-03",
    tanggalDibuat: "2026-05-05T08:30:00Z",
    status: "Menunggu",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: []
  },
  {
    id: "LW-2026-017",
    judul: "Deface Website Instansi Sekolah",
    kategori: "Siber",
    deskripsi: "Halaman utama situs web resmi sekolah diubah tampilannya oleh peretas luar negeri.",
    lokasi: "Online / Website",
    tanggalKejadian: "2026-05-06",
    tanggalDibuat: "2026-05-08T10:00:00Z",
    status: "Menunggu",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: []
  },
  {
    id: "LW-2026-018",
    judul: "Pencurian Komponen Listrik Gardu",
    kategori: "Pencurian",
    deskripsi: "Kabel tembaga dan komponen gardu listrik raib dicuri di kawasan industri kecil.",
    lokasi: "Kecamatan Kemayoran, Jakarta Pusat",
    tanggalKejadian: "2026-05-10",
    tanggalDibuat: "2026-05-12T07:15:00Z",
    status: "Menunggu",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: []
  },
  {
    id: "LW-2026-019",
    judul: "Kekerasan / Penganiayaan Ringan",
    kategori: "Kekerasan",
    deskripsi: "Pertengkaran tetangga berujung tindakan pemukulan fisik yang menyebabkan lebam.",
    lokasi: "Kelurahan Serdang, Jakarta Pusat",
    tanggalKejadian: "2026-05-14",
    tanggalDibuat: "2026-05-15T14:40:00Z",
    status: "Menunggu",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: []
  },
  {
    id: "LW-2026-020",
    judul: "Pelanggaran Jam Operasional Truk",
    kategori: "Ketertiban",
    deskripsi: "Truk besar melintas di jalan lingkungan di luar jam operasional yang ditentukan dinas.",
    lokasi: "Jl. Kebon Kosong, Jakarta Pusat",
    tanggalKejadian: "2026-05-18",
    tanggalDibuat: "2026-05-19T11:20:00Z",
    status: "Menunggu",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: []
  },
  {
    id: "LW-2026-021",
    judul: "Kebocoran Pipa Air PDAM",
    kategori: "Lainnya",
    deskripsi: "Saluran pipa air bersih pecah di pinggir jalan raya menyebabkan semburan air dan genangan tinggi.",
    lokasi: "Jl. Gunung Sahari, Jakarta Pusat",
    tanggalKejadian: "2026-05-22",
    tanggalDibuat: "2026-05-24T09:00:00Z",
    status: "Menunggu",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: []
  },
  {
    id: "LW-2026-022",
    judul: "Penipuan Berkedok Paket COD",
    kategori: "Penipuan",
    deskripsi: "Menerima kiriman paket COD yang tidak pernah dipesan dengan harga tagihan yang tidak wajar.",
    lokasi: "Kelurahan Johar Baru, Jakarta Pusat",
    tanggalKejadian: "2026-05-25",
    tanggalDibuat: "2026-05-26T15:00:00Z",
    status: "Menunggu",
    userId: "siti@mail.com",
    userName: "Siti Rahayu",
    catatan: []
  },
  {
    id: "LW-2026-023",
    judul: "Penyebaran Berita Bohong (Hoaks)",
    kategori: "Siber",
    deskripsi: "Penyebaran pesan berantai hoaks yang memicu kepanikan warga mengenai bencana alam fiktif.",
    lokasi: "Online / WhatsApp Group",
    tanggalKejadian: "2026-05-28",
    tanggalDibuat: "2026-05-29T10:30:00Z",
    status: "Menunggu",
    userId: "ahmad@mail.com",
    userName: "Ahmad Fauzi",
    catatan: []
  }
];

// ── Init ───────────────────────────────────────────────────────────────────

const STORAGE_VERSION = "v6";

export function initStorage() {
  // Re-seed when version changes so status "Menunggu" is applied
  if (localStorage.getItem("sw_version") !== STORAGE_VERSION) {
    localStorage.setItem(USERS_KEY,   JSON.stringify(SEED_USERS));
    localStorage.setItem(REPORTS_KEY, JSON.stringify(SEED_REPORTS));
    localStorage.setItem("sw_version", STORAGE_VERSION);
  }
}

// ── Users ──────────────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  const raw = localStorage.getItem(CUR_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setCurrentUser(user: User | null) {
  if (user) localStorage.setItem(CUR_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(CUR_USER_KEY);
}

export function login(email: string, password: string): User | null {
  return getUsers().find(u => u.email === email && u.password === password) ?? null;
}

export function register(name: string, email: string, phone: string, password: string): { ok: boolean; error?: string } {
  if (getUsers().find(u => u.email === email)) return { ok: false, error: "Email sudah terdaftar." };
  const newUser: User = { name, email, phone, password, role: "user", createdAt: new Date().toISOString() };
  saveUsers([...getUsers(), newUser]);
  return { ok: true };
}

export function deleteUser(email: string) {
  saveUsers(getUsers().filter(u => u.email !== email));
  saveReports(getReports().filter(r => r.userId !== email));
}

// ── Reports ────────────────────────────────────────────────────────────────

export function getReports(): Report[] {
  return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]");
}

export function saveReports(reports: Report[]) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

export function getUserReports(email: string): Report[] {
  return getReports().filter(r => r.userId === email);
}

export function addReport(data: Omit<Report, "id" | "tanggalDibuat" | "catatan">): Report {
  const all = getReports();
  const year = new Date().getFullYear();
  const seq  = String(all.length + 1).padStart(3, "0");
  const report: Report = { ...data, id: `LW-${year}-${seq}`, tanggalDibuat: new Date().toISOString(), catatan: [] };
  saveReports([...all, report]);
  return report;
}

export function updateReport(id: string, patch: Partial<Report>): Report | null {
  const all = getReports();
  const i   = all.findIndex(r => r.id === id);
  if (i < 0) return null;
  all[i] = { ...all[i], ...patch, tanggalUpdate: new Date().toISOString() };
  saveReports(all);
  return all[i];
}

export function deleteReport(id: string) {
  saveReports(getReports().filter(r => r.id !== id));
}

// ── Notifications ──────────────────────────────────────────────────────────

export function getNotifications(email: string): Notification[] {
  return JSON.parse(localStorage.getItem(notifKey(email)) || "[]");
}

export function addNotification(email: string, text: string, type: Notification["type"] = "info") {
  const list = getNotifications(email);
  const n: Notification = { id: Date.now().toString(), text, time: new Date().toISOString(), read: false, type };
  localStorage.setItem(notifKey(email), JSON.stringify([n, ...list].slice(0, 20)));
}

export function markAllRead(email: string) {
  const list = getNotifications(email).map(n => ({ ...n, read: true }));
  localStorage.setItem(notifKey(email), JSON.stringify(list));
}

export function markNotificationRead(email: string, id: string) {
  const list = getNotifications(email).map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(notifKey(email), JSON.stringify(list));
}

export function clearNotifications(email: string) {
  localStorage.setItem(notifKey(email), JSON.stringify([]));
}

// ── Settings ───────────────────────────────────────────────────────────────

export function getSettings(email: string): UserSettings {
  const raw = localStorage.getItem(settingsKey(email));
  return raw ? JSON.parse(raw) : { pushNotif: false };
}

export function saveSettings(email: string, s: UserSettings) {
  localStorage.setItem(settingsKey(email), JSON.stringify(s));
}

export function updateUserProfile(email: string, patch: Partial<User>) {
  const users = getUsers();
  const i = users.findIndex(u => u.email === email);
  if (i >= 0) {
    users[i] = { ...users[i], ...patch };
    saveUsers(users);
  }
  // update currentUser too
  const cur = getCurrentUser();
  if (cur?.email === email) setCurrentUser({ ...cur, ...patch });
}

export function updateLocalPassword(email: string, password: string) {
  const users = getUsers();
  const i = users.findIndex(u => u.email === email);
  if (i >= 0) {
    users[i] = { ...users[i], password };
    saveUsers(users);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export const STATUS_PILL: Record<string, string> = {
  Menunggu: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  Diproses: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  Selesai:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  Ditolak:  "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400",
};

// ── Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  from: "user" | "admin";
  senderName: string;
  text: string;
  time: string;
  read: boolean;
}

const chatKey = (userEmail: string) => `chat_${userEmail}`;

export function getChatMessages(userEmail: string): ChatMessage[] {
  return JSON.parse(localStorage.getItem(chatKey(userEmail)) || "[]");
}

export function addChatMessage(userEmail: string, msg: Omit<ChatMessage, "id" | "time" | "read">): ChatMessage {
  const msgs = getChatMessages(userEmail);
  const newMsg: ChatMessage = {
    ...msg,
    id: Date.now().toString(),
    time: new Date().toISOString(),
    read: msg.from === "admin" ? false : true,
  };
  localStorage.setItem(chatKey(userEmail), JSON.stringify([...msgs, newMsg]));
  return newMsg;
}

export function markChatRead(userEmail: string, readBy: "user" | "admin" = "user") {
  // readBy="user" → mark pesan dari admin sebagai terbaca (user sudah baca balasan admin)
  // readBy="admin" → mark pesan dari user sebagai terbaca (admin sudah baca pesan user)
  const senderToMark = readBy === "user" ? "admin" : "user";
  const msgs = getChatMessages(userEmail).map(m =>
    m.from === senderToMark ? { ...m, read: true } : m
  );
  localStorage.setItem(chatKey(userEmail), JSON.stringify(msgs));
}

export interface ChatThread {
  userEmail: string;
  userName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  avatarUrl?: string;
}

export function getChatThreads(): ChatThread[] {
  const threads: ChatThread[] = [];
  const localUsers = getUsers(); // sebagai fallback untuk nama

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("chat_")) continue;
    const userEmail = key.replace("chat_", "");
    const msgs = getChatMessages(userEmail);
    if (msgs.length === 0) continue;
    const last = msgs[msgs.length - 1];
    const unread = msgs.filter(m => m.from === "user" && !m.read).length;
    const localUser = localUsers.find(u => u.email === userEmail);
    threads.push({
      userEmail,
      userName: localUser?.name || userEmail,
      lastMessage: last.text,
      lastTime: last.time,
      unread,
      avatarUrl: localUser?.avatarUrl || "",
    });
  }

  return threads.sort((a, b) => b.lastTime.localeCompare(a.lastTime));
}
