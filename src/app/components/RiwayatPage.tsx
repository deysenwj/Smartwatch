import { useState, useEffect } from "react";
import {
  Search, ChevronRight, ArrowLeft, Image, Music, FileText,
  Download, Trash2, AlertCircle, Pencil, Send, X, Printer,
  Inbox, Clock, CheckCircle, ShieldAlert, XCircle,
} from "lucide-react";
import {
  getUserReports, deleteReport, updateReport, formatDate,
  STATUS_PILL, type User, type Report,
} from "../lib/storage";
import {
  hasSupabaseConfig, getSupabaseUserReports, deleteSupabaseReport,
  updateSupabaseReport,
} from "../lib/supabase";

interface Props {
  user: User;
  initialDetailId?: string | null;   // report ID string, not array index
  onRefreshNotifs: () => void;
}

const FILTERS = ["Semua", "Menunggu", "Diproses", "Prioritas", "Selesai", "Ditolak"];

const cardCls = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl";

// ── Timeline ───────────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: "submit",    label: "Laporan Dikirim",         note: "Laporan berhasil diterima oleh sistem." },
  { key: "validasi",  label: "Menunggu Validasi Admin",  note: "Admin sedang memeriksa kelengkapan laporan." },
  { key: "proses",    label: "Dalam Proses",            note: "Petugas sedang melakukan penanganan." },
  { key: "selesai",   label: "Penindakan & Penyelesaian",note: "" },
];

function getTimelineState(status: string) {
  switch (status) {
    case "Menunggu":  return { done: 1, active: 1 };
    case "Diproses":  return { done: 2, active: 2 };
    case "Prioritas": return { done: 2, active: 2 };
    case "Selesai":   return { done: 4, active: -1 };
    case "Ditolak":   return { done: 2, active: -1 };
    default:          return { done: 1, active: 1 };
  }
}

function Timeline({ status, notes }: { status: string; notes: Report["catatan"] }) {
  const { done, active } = getTimelineState(status);
  const lastNote = notes?.[notes.length - 1];

  return (
    <div className="space-y-0">
      {TIMELINE_STEPS.map((step, i) => {
        const isDone    = i < done;
        const isActive  = i === active && status !== "Selesai" && status !== "Ditolak";
        const isPending = !isDone && !isActive;
        const isRejectedStop = status === "Ditolak" && i === 2;

        return (
          <div key={step.key} className={`flex gap-3 ${isPending || isRejectedStop ? "opacity-35" : ""}`}>
            <div className="flex flex-col items-center w-5 shrink-0">
              <div className={`w-3 h-3 rounded-full mt-1 shrink-0 border-2 transition-colors
                ${isDone && !isRejectedStop
                  ? "bg-emerald-500 border-emerald-500"
                  : isActive
                    ? "bg-white dark:bg-slate-800 border-amber-400 shadow-[0_0_0_3px] shadow-amber-400/30"
                    : status === "Ditolak" && i === 1
                      ? "bg-red-500 border-red-500"
                      : "bg-transparent border-slate-300 dark:border-slate-600"
                }`}
              >
                {isActive && <div className="w-full h-full rounded-full bg-amber-400 animate-pulse" />}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 transition-colors ${isDone && !isRejectedStop ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"}`}
                  style={{ minHeight: 28 }} />
              )}
            </div>

            <div className="pb-5 flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5">
                <p className={`text-sm font-bold ${isDone && !isRejectedStop ? "text-slate-900 dark:text-white" : isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-500"}`}>
                  {step.label}
                </p>
                {isActive && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold shrink-0">Sedang berlangsung</span>}
                {isDone && !isRejectedStop && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">Selesai</span>}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{step.note}</p>

              {/* Show admin note on the last completed step */}
              {lastNote && i === (done - 1) && status !== "Menunggu" && (
                <div className={`mt-2 px-3 py-2 rounded-lg text-xs border-l-2
                  ${status === "Selesai"
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-400"
                    : status === "Ditolak"
                      ? "bg-red-50 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-700 dark:text-amber-400"
                  }`}>
                  <span className="font-semibold">Catatan admin: </span>{lastNote.text}
                </div>
              )}

              {/* Ditolak marker */}
              {status === "Ditolak" && i === 1 && (
                <div className="mt-2 px-3 py-2 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 border-l-2 border-red-400 text-red-700 dark:text-red-400">
                  <span className="font-semibold">Laporan ditolak. </span>
                  {lastNote ? lastNote.text : "Hubungi admin untuk informasi lebih lanjut."}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Edit modal for Menunggu reports ────────────────────────────────────────
function EditModal({ report, onClose, onSave }: {
  report: Report;
  onClose: () => void;
  onSave: (patch: Partial<Report>) => void;
}) {
  const [judul,     setJudul]     = useState(report.judul);
  const [deskripsi, setDeskripsi] = useState(report.deskripsi);
  const [lokasi,    setLokasi]    = useState(report.lokasi);
  const [tanggal,   setTanggal]   = useState(report.tanggalKejadian);
  const [saving,    setSaving]    = useState(false);
  const [err,       setErr]       = useState("");

  function handleSave() {
    if (!judul.trim())               { setErr("Judul tidak boleh kosong."); return; }
    if (deskripsi.trim().length < 20){ setErr("Deskripsi minimal 20 karakter."); return; }
    setSaving(true);
    setTimeout(() => {
      onSave({ judul: judul.trim(), deskripsi: deskripsi.trim(), lokasi: lokasi.trim(), tanggalKejadian: tanggal });
      setSaving(false);
    }, 300);
  }

  const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Edit Laporan</h3>
            <p className="text-xs text-slate-400 mt-0.5">{report.id}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {err && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{err}</p>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Judul Laporan</label>
            <input type="text" value={judul} onChange={e => { setJudul(e.target.value); setErr(""); }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi</label>
            <textarea rows={4} value={deskripsi} onChange={e => { setDeskripsi(e.target.value); setErr(""); }}
              className={`${inputCls} resize-none`} />
            <p className="text-xs text-slate-400 mt-1">{deskripsi.length} karakter</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Lokasi Kejadian</label>
            <input type="text" value={lokasi} onChange={e => setLokasi(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tanggal Kejadian</label>
            <div className="relative overflow-hidden rounded-lg">
              <input type="date" style={{ minWidth: 0 }} value={tanggal} onChange={e => setTanggal(e.target.value)}
                className={`${inputCls} pr-3`} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            Batal
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60">
            <Send className="w-4 h-4" />
            {saving ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export function RiwayatPage({ user, initialDetailId = null, onRefreshNotifs }: Props) {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialDetailId);
  const [filter,     setFilter]     = useState("Semua");
  const [search,     setSearch]     = useState("");
  const [delConfirm, setDelConfirm] = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);
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

  async function refresh() {
    if (hasSupabaseConfig()) {
      try {
        const reps = await getSupabaseUserReports(user.id || "");
        setReports(reps.sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat)));
      } catch (err) {
        console.error("Gagal mengambil laporan dari Supabase:", err);
      }
    } else {
      setReports(getUserReports(user.email).sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat)));
    }
  }

  useEffect(() => {
    refresh();
  }, [user.id, user.email]);

  // Filter count helper
  const filterCount = (f: string) => {
    if (f === "Semua") return reports.length;
    if (f === "Diproses") return reports.filter(r => r.status === "Diproses" || r.status === "Prioritas").length;
    return reports.filter(r => r.status === f).length;
  };

  const filtered = reports.filter(r => {
    const mf = filter === "Semua" || 
               (filter === "Diproses" ? (r.status === "Diproses" || r.status === "Prioritas") : r.status === filter);
    const ms = !search || r.judul.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  // Look up by string ID — not array index
  const report = selectedId ? reports.find(r => r.id === selectedId) ?? null : null;

  async function handleDelete() {
    if (!report) return;
    if (hasSupabaseConfig()) {
      try {
        await deleteSupabaseReport(report.id);
      } catch (err) {
        console.error("Gagal menghapus laporan dari Supabase:", err);
        return;
      }
    } else {
      deleteReport(report.id);
    }
    setSelectedId(null);
    await refresh();
    onRefreshNotifs();
  }

  function handleDeleteClick() {
    if (!report) return;
    setConfirmConfig({
      title: "Hapus Laporan",
      description: `Apakah Anda yakin ingin menghapus laporan "${report.judul}"? Tindakan ini tidak dapat dibatalkan.`,
      icon: AlertCircle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-950/50",
      confirmText: "Hapus",
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(null);
        await handleDelete();
      }
    });
  }

  async function handleEdit(patch: Partial<Report>) {
    if (!report) return;
    if (hasSupabaseConfig()) {
      try {
        await updateSupabaseReport(report.id, patch);
      } catch (err) {
        console.error("Gagal memperbarui laporan di Supabase:", err);
        return;
      }
    } else {
      updateReport(report.id, patch);
    }
    setShowEdit(false);
    await refresh();
  }

  function handlePrint() {
    window.print();
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (report) {
    const allNotes = report.catatan ?? [];
    return (
      <>
        {showEdit && (
          <EditModal report={report} onClose={() => setShowEdit(false)} onSave={handleEdit} />
        )}

        <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10 custom-scrollbar max-w-4xl mx-auto w-full space-y-6">
          <button
            onClick={() => { setSelectedId(null); setDelConfirm(false); setShowEdit(false); }}
            className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Riwayat
          </button>

          {/* Header card */}
          <div className={`${cardCls} px-4 md:px-6 py-4 md:py-5`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 mb-1">{report.id}</p>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{report.judul}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Diajukan pada {formatDate(report.tanggalDibuat)} · Kategori: {report.kategori}
                </p>
              </div>
              <span className={`self-start px-3 py-1 rounded-md text-xs font-semibold shrink-0 ${STATUS_PILL[report.status] ?? ""}`}>
                {report.status}
              </span>
            </div>
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Kategori",         value: report.kategori },
              { label: "Lokasi",           value: report.lokasi || "—" },
              { label: "Tanggal Kejadian", value: report.tanggalKejadian ? formatDate(report.tanggalKejadian) : "—" },
            ].map(({ label, value }) => (
              <div key={label} className={`${cardCls} px-4 py-3`}>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-1">{label}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className={`${cardCls} px-4 md:px-6 py-4 md:py-5`}>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-3">Deskripsi Laporan</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{report.deskripsi}</p>
          </div>

          {/* All admin notes */}
          {allNotes.length > 0 && (
            <div className={`${cardCls} px-4 md:px-6 py-4 md:py-5`}>
              <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-4">Riwayat Catatan Admin</h2>
              <div className="space-y-3">
                {allNotes.map((n, i) => (
                  <div key={i} className={`px-4 py-3 rounded-lg border-l-2 text-sm
                    ${n.status === "Selesai"
                      ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-400"
                      : n.status === "Ditolak"
                        ? "bg-red-50 dark:bg-red-900/10 border-red-400"
                        : n.status === "Prioritas"
                          ? "bg-red-50 dark:bg-red-900/10 border-red-300"
                          : "bg-amber-50 dark:bg-amber-900/10 border-amber-300"
                    }`}>
                    <p className="text-slate-700 dark:text-slate-300">{n.text}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{n.by} · {formatDate(n.at)} · Status diubah ke <strong>{n.status}</strong></p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          <div className={`${cardCls} px-4 md:px-6 py-4 md:py-5`}>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-4">Lampiran Bukti</h2>
            {report.buktiUrl ? (
              <div className="flex flex-wrap gap-3">
                <a
                  href={report.buktiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center w-28 h-28 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl gap-2 cursor-pointer hover:border-slate-400 dark:hover:border-slate-400 transition"
                >
                  <FileText className="w-5 h-5 text-slate-400" />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center px-2 leading-tight truncate max-w-full">
                    {report.buktiName || "bukti_lampiran"}
                  </p>
                </a>
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500">Tidak ada lampiran bukti.</p>
            )}
          </div>

          {/* Timeline */}
          <div className={`${cardCls} px-4 md:px-6 py-4 md:py-5`}>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white mb-5">Status Perkembangan</h2>
            <Timeline status={report.status} notes={report.catatan} />
          </div>

          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            {/* Left: destructive actions */}
            <button
              onClick={handleDeleteClick}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" /> Hapus Laporan
            </button>

            {/* Right: safe actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {report.status === "Menunggu" && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Pencil className="w-4 h-4" /> Edit Laporan
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <Printer className="w-4 h-4" /> Cetak
              </button>
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Kembali
              </button>
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition">
                <Download className="w-4 h-4" /> Unduh PDF
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10 custom-scrollbar max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Riwayat Laporan</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          {reports.length} laporan · klik baris untuk detail
        </p>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          {FILTERS.map(f => {
            const count = filterCount(f);
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition whitespace-nowrap border
                  ${active
                    ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
              >
                {f}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold
                  ${active ? "bg-white/20 dark:bg-black/10" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari ID atau judul…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className={`hidden md:block ${cardCls} overflow-hidden`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {["ID", "JUDUL", "KATEGORI", "TANGGAL", "STATUS", ""].map((h, i) => (
                <th key={i} className="text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 px-6 py-3 tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
                  <Inbox className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada laporan ditemukan</p>
                </td>
              </tr>
            ) : filtered.map((r, i) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition
                  ${i % 2 !== 0 ? "bg-slate-50/30 dark:bg-slate-800/30" : ""}`}
              >
                <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-400 dark:text-slate-500">{r.id}</td>
                <td className="px-6 py-3.5 text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">{r.judul}</td>
                <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">{r.kategori}</td>
                <td className="px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(r.tanggalDibuat)}</td>
                <td className="px-6 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold ${STATUS_PILL[r.status] ?? ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">Tidak ada laporan ditemukan</p>
          </div>
        ) : filtered.map(r => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className={`w-full flex items-center gap-3 ${cardCls} px-4 py-4 text-left hover:border-slate-400 dark:hover:border-slate-500 transition`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">{r.id}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${STATUS_PILL[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.judul}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.kategori} · {formatDate(r.tanggalDibuat)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* Reusable Confirmation Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 flex flex-col items-center text-center space-y-4">
            <div className={`w-12 h-12 ${confirmConfig.iconBg} ${confirmConfig.iconColor} rounded-full flex items-center justify-center`}>
              <confirmConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{confirmConfig.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{confirmConfig.description}</p>
            </div>
            <div className="flex w-full gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmConfig(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmConfig.onConfirm}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-xs font-semibold transition ${
                  confirmConfig.isDestructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600"
                }`}
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
