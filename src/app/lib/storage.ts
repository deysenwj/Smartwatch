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
  status: "Menunggu" | "Diproses" | "Selesai" | "Ditolak" | "Prioritas";
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
  { id: "LW-2024-001", judul: "Ketidaksesuaian Data Lahan",    kategori: "Agraria",  deskripsi: "Ditemukan perbedaan antara sertifikat digital dan koordinat fisik tanah yang signifikan.",                                              lokasi: "Kecamatan X, Jakarta",       tanggalKejadian: "2024-10-10", tanggalDibuat: "2024-10-12T09:00:00Z", status: "Selesai",  userId: "ahmad@mail.com", userName: "Ahmad Fauzi",  catatan: [{ text: "Laporan telah diverifikasi dan diselesaikan oleh tim agraria.", status: "Selesai", by: "Admin", at: "2024-10-14T10:00:00Z" }] },
  { id: "LW-2024-002", judul: "Prosedur Pengadaan Barang",     kategori: "Korupsi",  deskripsi: "Diduga ada penyimpangan prosedur tender di instansi pemerintah daerah tanpa transparansi.",                                              lokasi: "Balai Kota Jakarta",         tanggalKejadian: "2024-10-14", tanggalDibuat: "2024-10-15T14:00:00Z", status: "Diproses", userId: "ahmad@mail.com", userName: "Ahmad Fauzi",  catatan: [{ text: "Laporan sedang dalam proses investigasi.", status: "Diproses", by: "Admin", at: "2024-10-16T08:00:00Z" }] },
  { id: "LW-2024-003", judul: "Tindakan Pungutan Liar",        kategori: "Pungli",   deskripsi: "Saya diminta membayar Rp 250.000 oleh petugas loket A untuk pengurusan surat keterangan domisili tanpa kuitansi resmi.",                 lokasi: "Kecamatan X, Jakarta",       tanggalKejadian: "2024-10-15", tanggalDibuat: "2024-10-18T10:00:00Z", status: "Prioritas",userId: "ahmad@mail.com", userName: "Ahmad Fauzi",  catatan: [{ text: "Laporan ditandai prioritas. Tim investigasi segera diterjunkan.", status: "Prioritas", by: "Admin", at: "2024-10-19T09:00:00Z" }] },
  { id: "LW-2024-004", judul: "Pelayanan Administrasi Lambat", kategori: "Hukum",    deskripsi: "Proses administrasi penerbitan KTP memakan waktu lebih dari 3 bulan tanpa penjelasan yang memadai.",                                      lokasi: "Dinas Kependudukan Jakarta", tanggalKejadian: "2024-10-18", tanggalDibuat: "2024-10-20T08:00:00Z", status: "Selesai",  userId: "ahmad@mail.com", userName: "Ahmad Fauzi",  catatan: [{ text: "Masalah telah diselesaikan dengan koordinasi dinas terkait.", status: "Selesai", by: "Admin", at: "2024-10-25T09:00:00Z" }] },
  { id: "LW-2024-005", judul: "Laporan Tidak Valid",           kategori: "Lainnya",  deskripsi: "Laporan uji coba tanpa bukti yang cukup.",                                                                                               lokasi: "Online",                     tanggalKejadian: "2024-10-20", tanggalDibuat: "2024-10-22T11:00:00Z", status: "Ditolak",  userId: "ahmad@mail.com", userName: "Ahmad Fauzi",  catatan: [{ text: "Laporan tidak memenuhi syarat kelengkapan bukti yang diperlukan.", status: "Ditolak", by: "Admin", at: "2024-10-23T08:00:00Z" }] },
  { id: "LW-2024-006", judul: "Penyalahgunaan Wewenang",       kategori: "Hukum",    deskripsi: "Petugas kelurahan menyalahgunakan wewenang untuk kepentingan pribadi.",                                                                  lokasi: "Kelurahan Y, Bandung",       tanggalKejadian: "2024-11-01", tanggalDibuat: "2024-11-03T13:00:00Z", status: "Menunggu", userId: "siti@mail.com",  userName: "Siti Rahayu",  catatan: [] },
];

// ── Init ───────────────────────────────────────────────────────────────────

const STORAGE_VERSION = "v2";

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
  Prioritas:"bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400",
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
    });
  }

  return threads.sort((a, b) => b.lastTime.localeCompare(a.lastTime));
}
