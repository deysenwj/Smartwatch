import { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck, Users, LogOut, X, Bell, Sun, Moon,
  Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Menu, Search, Info, User, Calendar, MapPin,
  TrendingUp, ShieldAlert, CheckCheck, Settings, MessageSquare, Send, Headphones,
} from "lucide-react";
import systemLogo from "../../imports/system_logo_black.png";
import {
  getReports, updateReport, getUsers, deleteUser as removeUser,
  addNotification, formatDate, STATUS_PILL, timeAgo,
  getChatMessages, addChatMessage, getChatThreads, markChatRead,
  type User as UserType, type Report, type Notification, type ChatMessage, type ChatThread,
} from "../lib/storage";
import {
  hasSupabaseConfig, getSupabaseReports, getSupabaseUsers,
  updateSupabaseReport, deleteSupabaseUser, addSupabaseNotification,
  getSupabaseChatMessages, addSupabaseChatMessage, markSupabaseChatRead, getSupabaseChatThreads,
  type SupabaseChatMessage, type SupabaseChatThread,
} from "../lib/supabase";
import { SettingsPage } from "./SettingsPage";

type AdminTab = "validasi" | "users" | "chat" | "settings";
type StatusFilter = "all" | Report["status"];

interface Props {
  user: UserType;
  notifs: Notification[];
  onRefreshNotifs: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onMarkAllRead: () => void;
  onClearNotifs: () => void;
  onLogout: () => void;
  onSaved?: () => void;
  onMarkRead?: (id: string) => void;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

// ── Notification Dropdown ──────────────────────────────────────────────────
function NotifDropdown({ notifs, onMarkAllRead, onClearNotifs, onMarkRead }: {
  notifs: Notification[]; onMarkAllRead: () => void; onClearNotifs: () => void; onMarkRead?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const TYPE_ICON: Record<string, React.ElementType> = { success: CheckCircle, warning: AlertCircle, info: Info, error: XCircle };
  const TYPE_COLOR: Record<string, string> = { success: "text-emerald-500", warning: "text-amber-500", info: "text-blue-500", error: "text-red-500" };

  return (
    <div className="md:relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition">
        <Bell className="w-4 h-4 text-slate-300" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-auto right-4 top-16 md:top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-[380px] sm:max-w-none bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
          <div className="flex items-center justify-between pl-5 pr-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white">Notifikasi</h3>
              {unread > 0 && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[11px] font-bold rounded-full">{unread} baru</span>}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={onMarkAllRead} title="Tandai semua dibaca"
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400">
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}
              {notifs.length > 0 && (
                <button onClick={onClearNotifs} title="Hapus semua"
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada notifikasi</p>
              </div>
            ) : notifs.map(n => {
              const Icon  = TYPE_ICON[n.type] ?? Info;
              const color = TYPE_COLOR[n.type] ?? "text-blue-500";
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && onMarkRead?.(n.id)}
                  className={`flex items-start gap-4 pl-5 pr-4 py-3.5 transition cursor-pointer ${n.read ? "hover:bg-slate-50 dark:hover:bg-slate-800/20" : "bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50/80 dark:hover:bg-blue-900/20"}`}
                >
                  <Icon className={`w-[18px] h-[18px] mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] sm:text-[15px] text-slate-700 dark:text-slate-300 leading-normal">{n.text}</p>
                    <p className="text-xs sm:text-[12.5px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.time)}</p>
                  </div>
                  {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${STATUS_PILL[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ── Validation Modal ───────────────────────────────────────────────────────
function ValidasiModal({ report, onClose, onUpdate }: {
  report: Report;
  onClose: () => void;
  onUpdate: (id: string, status: Report["status"], note: string) => void;
}) {
  const [note, setNote]   = useState("");
  const [error, setError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    onConfirm: () => void;
    confirmText: string;
    isDestructive?: boolean;
  } | null>(null);

  function submit(status: Report["status"]) {
    if (!note.trim()) { setError("Catatan wajib diisi sebelum mengambil tindakan."); return; }
    
    let title = "";
    let description = "";
    let icon = Clock;
    let iconColor = "text-slate-500 dark:text-slate-400";
    let iconBg = "bg-slate-50 dark:bg-slate-800/60";
    let confirmText = "Proses";
    let isDestructive = false;

    if (status === "Selesai") {
      title = "Setujui Laporan";
      description = `Apakah Anda yakin ingin menyetujui laporan "${report.judul}" dan mengubah statusnya menjadi Selesai?`;
      icon = CheckCircle;
      confirmText = "Setujui";
    } else if (status === "Ditolak") {
      title = "Tolak Laporan";
      description = `Apakah Anda yakin ingin menolak laporan "${report.judul}"?`;
      icon = XCircle;
      confirmText = "Tolak";
      isDestructive = true;
    } else {
      title = "Proses Laporan";
      description = `Apakah Anda yakin ingin memproses laporan "${report.judul}"? Status laporan akan diubah menjadi Diproses.`;
      icon = Clock;
      confirmText = "Proses";
    }

    setConfirmConfig({
      title,
      description,
      icon,
      iconColor,
      iconBg,
      confirmText,
      isDestructive,
      onConfirm: () => {
        setConfirmConfig(null);
        onUpdate(report.id, status, note.trim());
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500">{report.id}</p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">Validasi Laporan</h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto">
          {/* Report detail */}
          <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{report.judul}</h4>
              <StatusBadge status={report.status} />
            </div>

            {/* Pelapor */}
            <div className="flex items-center gap-2.5 py-2.5 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 text-xs font-bold shrink-0">
                {initials(report.userName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{report.userName}</p>
                <p className="text-xs text-slate-400">{report.userId} · {formatDate(report.tanggalDibuat)}</p>
              </div>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200">{report.kategori}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{report.tanggalKejadian ? formatDate(report.tanggalKejadian) : "-"}</span>
              </div>
              {report.lokasi && (
                <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{report.lokasi}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Deskripsi</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                {report.deskripsi}
              </p>
            </div>

            {/* Attachment */}
            {report.buktiUrl && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Lampiran Bukti</p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={report.buktiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center w-28 h-28 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl gap-2 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition"
                  >
                    <FileText className="w-5 h-5 text-slate-400" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center px-2 leading-tight truncate max-w-full">
                      {report.buktiName || "bukti_lampiran"}
                    </p>
                  </a>
                </div>
              </div>
            )}

            {/* Previous notes */}
            {report.catatan?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Riwayat Catatan</p>
                <div className="space-y-2">
                  {report.catatan.map((c, i) => (
                    <div key={i} className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2.5 border-l-2 border-slate-300 dark:border-slate-600">
                      <p className="text-slate-700 dark:text-slate-300">{c.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{c.by} · {formatDate(c.at)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action area */}
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Catatan Tindakan <span className="text-red-500">*</span>
              </label>
              <textarea rows={3} value={note} onChange={e => { setNote(e.target.value); setError(""); }}
                placeholder="Tuliskan catatan, alasan, atau tindak lanjut untuk pelapor..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition resize-none" />
              {error && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button onClick={() => submit("Selesai")}
                className="flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
                <CheckCircle className="w-4 h-4" /> Setujui
              </button>
              <button onClick={() => submit("Ditolak")}
                className="flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition">
                <XCircle className="w-4 h-4" /> Tolak
              </button>
              <button onClick={() => submit("Diproses")}
                className="flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition">
                <Clock className="w-4 h-4" /> Proses
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Reusable Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-start text-left space-y-4">
            
            {/* Top row: Icon and Close button */}
            <div className="flex items-center justify-between w-full">
              <div className={`w-12 h-12 ${confirmConfig.iconBg} ${confirmConfig.iconColor} border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center`}>
                <confirmConfig.icon className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title and Description */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{confirmConfig.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmConfig.description}</p>
            </div>

            {/* Bottom Action buttons */}
            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="flex-1 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AdminPage ─────────────────────────────────────────────────────────
export function AdminPage({ user, notifs, onRefreshNotifs, isDark, onToggleDark, onMarkAllRead, onClearNotifs, onLogout, onSaved, onMarkRead }: Props) {
  const [tab,         setTab]        = useState<AdminTab>("validasi");
  const [reports,     setReports]    = useState<Report[]>([]);
  const [users,       setUsers]      = useState<UserType[]>([]);
  const [filter,      setFilter]     = useState<StatusFilter>("all");
  const [search,      setSearch]     = useState("");
  const [modal,       setModal]      = useState<Report | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    description: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    onConfirm: () => void;
    confirmText: string;
    isDestructive?: boolean;
  } | null>(null);
  const [sidebarOpen, setSidebar]    = useState(false);
  const [toast,       setToast]      = useState<{ msg: string; type: "success" | "error" } | null>(null);
  // Chat admin state — support both localStorage and Supabase
  const [chatThreads,      setChatThreads]      = useState<(ChatThread | SupabaseChatThread)[]>([]);
  const [activeChatEmail,  setActiveChatEmail]  = useState<string | null>(null);
  const [activeChatUUID,   setActiveChatUUID]   = useState<string | null>(null);
  const [activeChatMsgs,   setActiveChatMsgs]   = useState<(ChatMessage | SupabaseChatMessage)[]>([]);
  const [adminChatInput,   setAdminChatInput]   = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Ref untuk menghindari stale closure di dalam setInterval
  const activeChatEmailRef = useRef<string | null>(null);
  const activeChatUUIDRef  = useRef<string | null>(null);

  async function refresh() {
    if (hasSupabaseConfig()) {
      try {
        const reps = await getSupabaseReports();
        setReports(reps.sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat)));
        const usrs = await getSupabaseUsers();
        setUsers(usrs.filter(u => u.role === "user"));
      } catch (err) {
        showToast("Gagal mengambil data dari Supabase.", "error");
      }
    } else {
      setReports(getReports().sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat)));
      setUsers(getUsers().filter(u => u.role === "user"));
    }
    // Refresh chat threads
    if (hasSupabaseConfig()) {
      try {
        const threads = await getSupabaseChatThreads();
        setChatThreads(threads);
      } catch (e) { console.error("chat threads error:", e); }
    } else {
      setChatThreads(getChatThreads());
    }
  }

  useEffect(() => {
    refresh();
    // Poll chat threads setiap 3 detik — gunakan ref untuk hindari stale closure
    chatPollRef.current = setInterval(async () => {
      if (hasSupabaseConfig()) {
        const threads = await getSupabaseChatThreads();
        setChatThreads(threads);
        if (activeChatUUIDRef.current) {
          const msgs = await getSupabaseChatMessages(activeChatUUIDRef.current);
          setActiveChatMsgs(msgs);
        }
      } else {
        setChatThreads(getChatThreads());
        if (activeChatEmailRef.current) {
          setActiveChatMsgs(getChatMessages(activeChatEmailRef.current));
        }
      }
    }, 3000);
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, []);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleUpdate(id: string, status: Report["status"], note: string) {
    const prev    = reports.find(r => r.id === id);
    const newCatatan = [...(prev?.catatan ?? []), { text: note, status, by: user.name, at: new Date().toISOString() }];

    if (hasSupabaseConfig()) {
      try {
        const updated = await updateSupabaseReport(id, {
          status,
          catatan: newCatatan,
        });
        if (updated) {
          try {
            const verb = status === "Selesai" ? "disetujui" : status === "Ditolak" ? "ditolak" : "sedang diproses";
            await addSupabaseNotification(
              (updated as any).userUUID || updated.userId,
              `Laporan "${updated.judul}" telah ${verb}. Catatan: ${note}`,
              status === "Selesai" ? "success" : status === "Ditolak" ? "error" : "warning"
            );
          } catch (notifErr) {
            console.error("Gagal mengirim notifikasi ke Supabase:", notifErr);
          }
        }
      } catch (err) {
        showToast("Gagal memperbarui laporan di Supabase.", "error");
        return;
      }
    } else {
      const updated = updateReport(id, {
        status,
        catatan: newCatatan,
      });
      if (updated) {
        const verb = status === "Selesai" ? "disetujui" : status === "Ditolak" ? "ditolak" : "sedang diproses";
        addNotification(updated.userId, `Laporan "${updated.judul}" telah ${verb}. Catatan: ${note}`, status === "Selesai" ? "success" : status === "Ditolak" ? "error" : "warning");
      }
    }
    await refresh();
    setModal(null);
    onRefreshNotifs();
    showToast(`Status laporan berhasil diubah menjadi "${status}".`);
  }

  async function handleDeleteUser(email: string) {
    setConfirmConfig({
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin menghapus pengguna "${email}"? Semua data laporan terkait juga akan dihapus secara permanen.`,
      icon: Trash2,
      iconColor: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-50 dark:bg-slate-800/60",
      confirmText: "Hapus",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        await executeDeleteUser(email);
      }
    });
  }

  async function executeDeleteUser(email: string) {
    if (hasSupabaseConfig()) {
      try {
        const targetUser = users.find(u => u.email === email);
        if (targetUser && targetUser.id) {
          await deleteSupabaseUser(targetUser.id);
        } else {
          showToast("Gagal menghapus: UUID pengguna tidak ditemukan.", "error");
          return;
        }
      } catch (err) {
        showToast("Gagal menghapus pengguna di Supabase.", "error");
        return;
      }
    } else {
      removeUser(email);
    }
    await refresh();
    showToast("Pengguna berhasil dihapus.");
  }

  // Stats
  const total    = reports.length;
  const menunggu = reports.filter(r => r.status === "Menunggu").length;
  const diproses = reports.filter(r => r.status === "Diproses").length;
  const selesai  = reports.filter(r => r.status === "Selesai").length;
  const ditolak  = reports.filter(r => r.status === "Ditolak").length;

  const filteredReports = reports.filter(r => {
    const mf = filter === "all" || r.status === filter;
    const ms = !search || r.judul.toLowerCase().includes(search.toLowerCase())
      || r.id.toLowerCase().includes(search.toLowerCase())
      || r.userName.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const filterTabs: { key: StatusFilter; label: string; count?: number }[] = [
    { key: "all",       label: "Semua",     count: total },
    { key: "Menunggu",  label: "Menunggu",  count: menunggu },
    { key: "Diproses",  label: "Diproses",  count: diproses },
    { key: "Selesai",   label: "Selesai",   count: selesai },
    { key: "Ditolak",   label: "Ditolak",   count: ditolak },
  ];

  const navItems: { key: AdminTab; label: string; icon: React.ElementType }[] = [
    { key: "validasi", label: "Validasi Laporan", icon: ClipboardCheck },
    { key: "users",    label: "Kelola Pengguna",  icon: Users },
    { key: "chat",     label: "Chat Support",     icon: MessageSquare },
    { key: "settings", label: "Pengaturan",       icon: Settings },
  ];

  const totalUnreadChat = chatThreads.reduce((s, t) => s + t.unread, 0);

  function openChatThread(thread: ChatThread | SupabaseChatThread) {
    const email = (thread as SupabaseChatThread).userEmail ?? (thread as ChatThread).userEmail;
    const uuid  = (thread as SupabaseChatThread).userUUID  ?? null;
    setActiveChatEmail(email);
    setActiveChatUUID(uuid);
    activeChatEmailRef.current = email;
    activeChatUUIDRef.current  = uuid;

    if (hasSupabaseConfig() && uuid) {
      getSupabaseChatMessages(uuid).then(msgs => {
        setActiveChatMsgs(msgs);
        markSupabaseChatRead(uuid, "admin");
        getSupabaseChatThreads().then(setChatThreads);
      });
    } else {
      setActiveChatMsgs(getChatMessages(email));
      markChatRead(email, "admin");
      setChatThreads(getChatThreads());
    }
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  async function handleAdminSendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = adminChatInput.trim();
    if (!text) return;

    if (hasSupabaseConfig() && activeChatUUID) {
      setAdminChatInput("");
      await addSupabaseChatMessage(activeChatUUID, {
        from_role: "admin",
        sender_name: user.name,
        text,
      });
      const msgs = await getSupabaseChatMessages(activeChatUUID);
      setActiveChatMsgs(msgs);
      const threads = await getSupabaseChatThreads();
      setChatThreads(threads);
    } else if (activeChatEmail) {
      setAdminChatInput("");
      addChatMessage(activeChatEmail, { from: "admin", senderName: user.name, text });
      setActiveChatMsgs(getChatMessages(activeChatEmail));
      setChatThreads(getChatThreads());
    }
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border
          ${toast.type === "success"
            ? "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
            : "bg-white dark:bg-slate-800 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}>
          {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {modal && <ValidasiModal report={modal} onClose={() => setModal(null)} onUpdate={handleUpdate} />}

      {/* Mobile backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebar(false)} />}

      {/* ── Sidebar (dark) ── */}
      <aside className={`fixed top-0 left-0 h-screen w-60 bg-slate-900 flex flex-col z-40 transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
              <img src={systemLogo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">Smartwatch</p>
              <p className="text-[11px] text-slate-500 leading-tight">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebar(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Menunggu badge */}
        {menunggu > 0 && (
          <div className="mx-4 mt-4 px-3 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2.5">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse shrink-0" />
            <p className="text-xs text-indigo-300 font-semibold flex-1">{menunggu} laporan menunggu validasi</p>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setTab(key); setSidebar(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition text-left
                ${tab === key
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {key === "chat" && totalUnreadChat > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {totalUnreadChat}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-slate-850 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 bg-slate-800/40 border border-slate-800/80 rounded-xl shadow-sm">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials(user.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500 truncate leading-none mt-1">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="md:pl-60 min-h-screen flex flex-col">

        {/* TopBar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebar(true)}
              className="group md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-600 transition-all duration-300">
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12 group-hover:text-white dark:group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                {tab === "validasi" ? "Validasi Laporan" : tab === "users" ? "Kelola Pengguna" : tab === "chat" ? "Chat Support" : "Pengaturan"}
              </h2>
            </div>
          </div>
          <div className="flex items-center">
            {/* dark mode toggle — uses slate bg so icon matches admin sidebar */}
            <button onClick={onToggleDark}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>
            <NotifDropdown notifs={notifs} onMarkAllRead={onMarkAllRead} onClearNotifs={onClearNotifs} onMarkRead={onMarkRead} />
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover ml-2 shrink-0 border border-slate-200 dark:border-slate-800"
              />
            ) : (
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold ml-2 shrink-0">
                {initials(user.name)}
              </div>
            )}
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl w-full">

          {/* ════════ VALIDASI TAB ════════ */}
          {tab === "validasi" && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Total",    val: total,    icon: FileText,    border: "border border-slate-200 dark:border-slate-800",       num: "text-slate-900 dark:text-white",         icon_bg: "bg-slate-50 dark:bg-slate-700/50",     icon_c: "text-slate-500 dark:text-slate-400" },
                  { label: "Menunggu", val: menunggu,  icon: Clock,       border: "border border-indigo-100 dark:border-indigo-950/45",  num: "text-indigo-700 dark:text-indigo-300",    icon_bg: "bg-indigo-50 dark:bg-indigo-900/40",    icon_c: "text-indigo-500 dark:text-indigo-400" },
                  { label: "Diproses", val: diproses,  icon: TrendingUp,  border: "border border-amber-100 dark:border-amber-950/45",   num: "text-amber-700 dark:text-amber-300",      icon_bg: "bg-amber-50 dark:bg-amber-900/40",      icon_c: "text-amber-500 dark:text-amber-400" },
                  { label: "Selesai",  val: selesai,   icon: CheckCircle, border: "border border-emerald-100 dark:border-emerald-950/45",num:"text-emerald-700 dark:text-emerald-300", icon_bg: "bg-emerald-50 dark:bg-emerald-900/40",  icon_c: "text-emerald-500 dark:text-emerald-400" },
                  { label: "Ditolak",  val: ditolak,   icon: XCircle,     border: "border border-red-100 dark:border-red-950/45",        num: "text-red-700 dark:text-red-300",          icon_bg: "bg-red-50 dark:bg-red-900/40",          icon_c: "text-red-500 dark:text-red-400" },
                ].map(({ label, val, icon: Icon, border, num, icon_bg, icon_c }) => (
                  <div key={label} className={`bg-white dark:bg-slate-800 rounded-xl p-4 ${border} hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-350`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
                      <div className={`w-7 h-7 ${icon_bg} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-3.5 h-3.5 ${icon_c}`} />
                      </div>
                    </div>
                    <p className={`text-2xl font-bold ${num}`}>{val}</p>
                  </div>
                ))}
              </div>

              {/* Filter + Search bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
                  {filterTabs.map(({ key, label, count }) => (
                    <button key={key} onClick={() => setFilter(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition whitespace-nowrap
                        ${filter === key
                          ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:border-slate-350 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                        }`}>
                      {label}
                      {count !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                          ${filter === key ? "bg-white/20 dark:bg-black/20" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="relative sm:ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Cari ID, judul, atau pelapor…" value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition" />
                </div>
              </div>

              {/* Table (desktop) */}
              <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
                <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {filteredReports.length} laporan
                  </p>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      {["ID","JUDUL","PELAPOR","KATEGORI","TANGGAL","STATUS",""].map(h => (
                        <th key={h} className="text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 px-5 py-3 tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <FileText className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Tidak ada laporan ditemukan</p>
                        </td>
                      </tr>
                    ) : filteredReports.map((r, i) => (
                      <tr key={r.id}
                        className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition ${i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-700/10"}`}>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500">{r.id}</span>
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px]">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{r.judul}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {initials(r.userName)}
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{r.userName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-slate-500 dark:text-slate-400">{r.kategori}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(r.tanggalDibuat)}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => setModal(r)}
                            className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                            Validasi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards (mobile) */}
              <div className="md:hidden space-y-2">
                {filteredReports.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Tidak ada laporan ditemukan</p>
                  </div>
                ) : filteredReports.map(r => (
                  <div key={r.id} className="bg-white dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1">{r.id}</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.judul}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.userName} · {r.kategori} · {formatDate(r.tanggalDibuat)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <button onClick={() => setModal(r)}
                      className="w-full py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition">
                      Validasi Laporan
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ════════ USERS TAB ════════ */}
          {tab === "users" && (
            <div className="bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Daftar Pengguna</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{users.length} pengguna terdaftar</p>
                </div>
                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      {["PENGGUNA","EMAIL","TELEPON","LAPORAN","BERGABUNG","AKSI"].map(h => (
                        <th key={h} className="text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 px-5 py-3 tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center">
                          <Users className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">Belum ada pengguna terdaftar</p>
                        </td>
                      </tr>
                    ) : users.map((u, i) => {
                      const userReports = reports.filter(r => r.userId === u.email);
                      return (
                        <tr key={u.email}
                          className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition ${i % 2 === 0 ? "" : "bg-slate-50/30 dark:bg-slate-700/10"}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {initials(u.name)}
                              </div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{u.email}</td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{u.phone || "—"}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-md">
                              <FileText className="w-3 h-3" /> {userReports.length}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <button onClick={() => handleDeleteUser(u.email)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ════════ CHAT TAB ════════ */}
          {tab === "chat" && (
            <div className="flex gap-4 h-[calc(100vh-10rem)] min-h-[500px]">
              {/* Thread list */}
              <div className="w-64 shrink-0 bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden flex flex-col">
                <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pesan Masuk</h3>
                    {totalUnreadChat > 0 && (
                      <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalUnreadChat}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                  {chatThreads.length === 0 ? (
                    <div className="py-10 text-center">
                      <MessageSquare className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">Belum ada pesan</p>
                    </div>
                  ) : chatThreads.map(t => (
                    <button
                      key={t.userEmail}
                      onClick={() => openChatThread(t)}
                      className={`w-full text-left px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                        activeChatEmail === t.userEmail ? "bg-indigo-50 dark:bg-indigo-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-900 dark:bg-slate-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                          {initials(t.userName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.userName}</p>
                            {t.unread > 0 && (
                              <span className="w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shrink-0 ml-1">{t.unread}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat panel */}
              <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden flex flex-col">
                {!activeChatEmail ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Pilih percakapan</p>
                    <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Klik nama pengguna di sebelah kiri untuk mulai membalas</p>
                  </div>
                ) : (
                  <>
                    {/* Chat header */}
                    <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-indigo-500">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                        {initials(chatThreads.find(t => t.userEmail === activeChatEmail)?.userName || "U")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{chatThreads.find(t => t.userEmail === activeChatEmail)?.userName}</p>
                        <p className="text-[10px] text-indigo-200">{activeChatEmail}</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
                      {activeChatMsgs.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-xs text-slate-400">Belum ada pesan dalam percakapan ini</p>
                        </div>
                      ) : activeChatMsgs.map(msg => {
                        const role = (msg as any).from_role ?? (msg as any).from;
                        const timestamp = (msg as any).created_at ?? (msg as any).time;
                        const senderName = (msg as any).sender_name ?? (msg as any).senderName;

                        return (
                          <div key={msg.id} className={`flex ${role === "admin" ? "justify-end" : "justify-start"}`}>
                            {role === "user" && (
                              <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 text-[9px] font-bold shrink-0 mr-2 mt-0.5">
                                {initials(senderName || "")}
                              </div>
                            )}
                            <div className={`max-w-[70%] ${
                              role === "admin"
                                ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                                : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm"
                            } px-3 py-2 shadow-sm`}>
                              <p className="text-xs leading-relaxed">{msg.text}</p>
                              <p className={`text-[9px] mt-1 ${role === "admin" ? "text-indigo-200" : "text-slate-400"}`}>
                                {timeAgo(timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleAdminSendChat} className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <input
                        type="text"
                        value={adminChatInput}
                        onChange={e => setAdminChatInput(e.target.value)}
                        placeholder="Balas pesan..."
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                      <button
                        type="submit"
                        disabled={!adminChatInput.trim()}
                        className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ════════ SETTINGS TAB ════════ */}
          {tab === "settings" && (
            <SettingsPage
              user={user}
              onLogout={onLogout}
              onSaved={() => {
                refresh();
                if (onSaved) onSaved();
              }}
            />
          )}
        </main>
      </div>

      {/* Reusable Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-start text-left space-y-4">
            
            {/* Top row: Icon and Close button */}
            <div className="flex items-center justify-between w-full">
              <div className={`w-12 h-12 ${confirmConfig.iconBg} ${confirmConfig.iconColor} border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center`}>
                <confirmConfig.icon className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title and Description */}
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{confirmConfig.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{confirmConfig.description}</p>
            </div>

            {/* Bottom Action buttons */}
            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-855 text-slate-700 dark:text-slate-350 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className="flex-1 px-4 py-2.5 bg-slate-950 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-950 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
