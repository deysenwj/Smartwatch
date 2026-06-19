import { useState } from "react";
import { ArrowLeft, Calendar, CloudUpload, Send, Wifi, BadgeDollarSign, PackageOpen, Swords, ShieldAlert, MoreHorizontal, X } from "lucide-react";
import { addReport, addNotification, type User, getUsers } from "../lib/storage";
import { hasSupabaseConfig, addSupabaseReport, addSupabaseNotification, uploadSupabaseFile, notifyAdmins, getSupabaseUsers } from "../lib/supabase";
import { MapPicker } from "./MapComponent";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
  onSubmitted: () => void;
}

const CATEGORIES = [
  { key: "Siber",        icon: Wifi },
  { key: "Penipuan",     icon: BadgeDollarSign },
  { key: "Pencurian",    icon: PackageOpen },
  { key: "Kekerasan",    icon: Swords },
  { key: "Ketertiban",   icon: ShieldAlert },
  { key: "Lainnya",      icon: MoreHorizontal },
];

const inputCls = "w-full min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition";

export function LaporanPage({ user, onNavigate, onSubmitted }: Props) {
  const [category,  setCategory]  = useState("Siber");
  const [judul,     setJudul]     = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [lokasi,    setLokasi]    = useState("");
  const [tanggal,   setTanggal]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [file,      setFile]      = useState<File | null>(null);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!judul.trim())             { setError("Judul laporan wajib diisi."); return; }
    if (deskripsi.trim().length < 20) { setError("Deskripsi minimal 20 karakter."); return; }
    if (!lokasi.trim())            { setError("Lokasi kejadian wajib diisi."); return; }
    if (!tanggal)                  { setError("Tanggal kejadian wajib diisi."); return; }

    setConfirmConfig({
      title: "Kirim Laporan Baru",
      description: `Apakah Anda yakin ingin mengirim laporan "${judul.trim()}"? Laporan Anda akan ditinjau oleh tim admin segera.`,
      icon: Send,
      iconColor: "text-slate-500 dark:text-slate-400",
      iconBg: "bg-slate-50 dark:bg-slate-800/60",
      confirmText: "Kirim",
      onConfirm: () => {
        setConfirmConfig(null);
        executeSubmit();
      }
    });
  }

  async function executeSubmit() {
    setLoading(true);

    if (hasSupabaseConfig()) {
      try {
        let uploaded = null;
        if (file) {
          uploaded = await uploadSupabaseFile(file);
        }

        const report = await addSupabaseReport({
          title: judul.trim(),
          category,
          description: deskripsi.trim(),
          location: lokasi.trim(),
          incident_date: tanggal,
          status: "Menunggu",
          user_id: user.id || "",
          bukti_url: uploaded?.url || undefined,
          bukti_name: uploaded?.name || undefined,
        });
        await addSupabaseNotification(user.id || "", `Laporan "${report.judul}" (${report.id}) berhasil dikirim dan menunggu validasi admin.`, "success");
        try {
          await notifyAdmins(`Laporan baru masuk: "${report.judul}" (${report.id}) dari ${user.name}.`, "info");
        } catch (adminNotifErr) {
          console.error("Gagal mengirim notifikasi baru ke admin di Supabase:", adminNotifErr);
        }
        setLoading(false);
        onSubmitted();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan laporan ke Supabase.");
        setLoading(false);
      }
      return;
    }

    setTimeout(() => {
      const report = addReport({
        judul:           judul.trim(),
        kategori:        category,
        deskripsi:       deskripsi.trim(),
        lokasi:          lokasi.trim(),
        tanggalKejadian: tanggal,
        status:          "Menunggu",
        userId:          user.email,
        userName:        user.name,
        buktiUrl:        file ? URL.createObjectURL(file) : undefined,
        buktiName:       file ? file.name : undefined,
      });
      addNotification(user.email, `Laporan "${report.judul}" (${report.id}) berhasil dikirim dan menunggu validasi admin.`, "success");
      // Notify all admins dynamically in local mode
      (async () => {
        try {
          // Try Supabase first
          if (hasSupabaseConfig()) {
            const admins = await getSupabaseUsers();
            const adminIds = admins.filter(a => a.role === 'admin' && a.id).map(a => a.id!);
            await Promise.all(adminIds.map(id => addSupabaseNotification(id, `Laporan baru masuk: "${report.judul}" (${report.id}) dari ${user.name}.`, "info")));
          } else {
            // Fallback to local storage profiles
            const users = getUsers();
            const adminEmails = users.filter(u => u.role === 'admin').map(u => u.email);
            adminEmails.forEach(email => addNotification(email, `Laporan baru masuk: "${report.judul}" (${report.id}) dari ${user.name}.`, "info"));
          }
        } catch (e) {
          console.error('Failed to send admin notifications:', e);
        }
        setLoading(false);
        onSubmitted();
      })();
    }, 500);
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10 custom-scrollbar max-w-3xl mx-auto w-full space-y-6">
      <button onClick={() => onNavigate("dashboard")}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white mb-5 transition">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
      </button>

      <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-1">Buat Laporan Baru</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sampaikan pengaduan Anda dengan jelas dan lengkap</p>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

        {/* Category */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Kategori Laporan</label>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {CATEGORIES.map(({ key, icon: Icon }) => (
              <button key={key} type="button" onClick={() => setCategory(key)}
                className={`flex flex-col items-center gap-2 py-3 md:py-4 px-2 rounded-xl border text-center transition-all duration-200
                  ${category === key
                    ? "border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-700/50 shadow-sm font-semibold"
                    : "border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  }`}>
                <Icon className={`w-5 h-5 ${category === key ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300">{key}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Title */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Judul Laporan</label>
          <input type="text" placeholder="Cth: Ketidaksesuaian data sertifikat lahan"
            value={judul} onChange={e => setJudul(e.target.value)} className={inputCls} />
        </section>

        {/* Description */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Deskripsi Lengkap</label>
          <textarea rows={5} placeholder="Jelaskan kronologi kejadian, pihak yang terlibat, dan waktu kejadian secara rinci..."
            value={deskripsi} onChange={e => setDeskripsi(e.target.value)}
            className={`${inputCls} resize-none`} />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            {deskripsi.length} karakter {deskripsi.length < 20 && <span className="text-red-400">(minimal 20)</span>}
          </p>
        </section>

        {/* Location & Date */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Tanggal Kejadian <span className="text-red-500">*</span></label>
              <div className="relative overflow-hidden rounded-lg">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                <input type="date" style={{ minWidth: 0 }}
                  value={tanggal} onChange={e => setTanggal(e.target.value)}
                  className={`${inputCls} pl-10 pr-3`} />
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700/60 pt-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Lokasi Kejadian <span className="text-red-500">*</span></label>
            <MapPicker value={lokasi} onChange={(newVal) => setLokasi(newVal)} />
          </div>
        </section>

        {/* Upload */}
        <section className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Lampirkan Bukti <span className="font-normal text-slate-400 dark:text-slate-500">(Opsional)</span>
          </label>
          <input
            type="file"
            id="fileInput"
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.mp4"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const selected = e.target.files[0];
                if (selected.size > 20 * 1024 * 1024) {
                  setError("Ukuran file maksimal 20 MB.");
                  return;
                }
                setFile(selected);
                setError("");
              }
            }}
          />
          <div
            onClick={() => document.getElementById("fileInput")?.click()}
            className="border border-dashed border-slate-300 dark:border-slate-600 rounded-xl py-8 md:py-10 text-center hover:border-slate-400 dark:hover:border-slate-400 hover:bg-slate-50/40 dark:hover:bg-slate-700/10 transition duration-200 cursor-pointer group"
          >
            <CloudUpload className="w-7 h-7 md:w-8 md:h-8 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 mx-auto transition-transform duration-200 group-hover:scale-105" />
            {file ? (
              <>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-3 truncate px-4">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB — Klik untuk mengganti
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-3">
                  Klik untuk memilih file
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  JPG, JPEG, PNG, PDF, MP4 — Maks. 20 MB
                </p>
              </>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
          <button type="button" onClick={() => onNavigate("dashboard")}
            className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Batal
          </button>
          <button type="submit" disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60">
            <Send className="w-4 h-4" />
            {loading ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </div>
      </form>

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
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
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
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
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
