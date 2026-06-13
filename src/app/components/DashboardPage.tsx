import { useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronRight, ShieldAlert, Inbox,
} from "lucide-react";
import { getUserReports, formatDate, STATUS_PILL, type User, type Report } from "../lib/storage";
import { hasSupabaseConfig, getSupabaseUserReports } from "../lib/supabase";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
  onViewReport: (reportId: string) => void;  // now uses string report ID
}

export function DashboardPage({ user, onNavigate, onViewReport }: Props) {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    async function refresh() {
      if (hasSupabaseConfig()) {
        try {
          const reps = await getSupabaseUserReports(user.id || "");
          setReports(reps);
        } catch (err) {
          console.error("Gagal mengambil data dari Supabase:", err);
        }
      } else {
        setReports(getUserReports(user.email));
      }
    }
    refresh();
  }, [user.id, user.email]);

  const total     = reports.length;
  const menunggu  = reports.filter(r => r.status === "Menunggu").length;
  const diproses  = reports.filter(r => r.status === "Diproses").length;
  const prioritas = reports.filter(r => r.status === "Prioritas").length;
  const selesai   = reports.filter(r => r.status === "Selesai").length;
  const ditolak   = reports.filter(r => r.status === "Ditolak").length;

  const recent = [...reports]
    .sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat))
    .slice(0, 5);

  const stats = [
    {
      icon: FileText, value: total, label: "Total Laporan",
      bg: "bg-slate-50 dark:bg-slate-700/50", color: "text-slate-600 dark:text-slate-400",
      ring: "ring-1 ring-slate-200 dark:ring-slate-700",
    },
    {
      icon: Clock, value: menunggu, label: "Menunggu Validasi",
      bg: "bg-indigo-50 dark:bg-indigo-900/30", color: "text-indigo-600 dark:text-indigo-400",
      ring: "ring-1 ring-indigo-100 dark:ring-indigo-900/50",
    },
    {
      icon: AlertCircle, value: diproses + prioritas, label: "Sedang Diproses",
      bg: "bg-amber-50 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-400",
      ring: "ring-1 ring-amber-100 dark:ring-amber-900/50",
    },
    {
      icon: ShieldAlert, value: prioritas, label: "Prioritas",
      bg: "bg-red-50 dark:bg-red-900/30", color: "text-red-600 dark:text-red-400",
      ring: "ring-1 ring-red-100 dark:ring-red-900/50",
    },
    {
      icon: CheckCircle, value: selesai, label: "Selesai",
      bg: "bg-emerald-50 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400",
      ring: "ring-1 ring-emerald-100 dark:ring-emerald-900/50",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Selamat Datang, {user.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Pantau perkembangan laporan hukum Anda di sini
          </p>
        </div>
        <button
          onClick={() => onNavigate("laporan")}
          className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          Buat Laporan Baru
        </button>
      </div>

      {/* Stats — 2 col mobile → 5 col desktop */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map(({ icon: Icon, value, label, bg, color, ring }) => (
          <div key={label} className={`bg-white dark:bg-slate-800 ${ring} rounded-xl p-4`}>
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Alert banner for Menunggu */}
      {menunggu > 0 && (
        <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-3">
          <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 animate-pulse" />
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            <span className="font-bold">{menunggu} laporan</span> sedang menunggu validasi dari admin.
          </p>
          <button
            onClick={() => onNavigate("riwayat")}
            className="ml-auto text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline shrink-0"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Juga banner untuk ditolak */}
      {ditolak > 0 && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 -mt-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">
            <span className="font-bold">{ditolak} laporan</span> telah ditolak. Periksa catatan admin.
          </p>
          <button
            onClick={() => onNavigate("riwayat")}
            className="ml-auto text-xs font-semibold text-red-700 dark:text-red-300 hover:underline shrink-0"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Recent reports */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">Laporan Terbaru</h2>
          <button
            onClick={() => onNavigate("riwayat")}
            className="flex items-center gap-1 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Belum ada laporan</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Buat laporan pertama Anda sekarang</p>
            <button
              onClick={() => onNavigate("laporan")}
              className="mt-4 px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition"
            >
              Buat Laporan
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {["ID LAPORAN", "JUDUL", "KATEGORI", "TANGGAL", "STATUS"].map(h => (
                      <th key={h} className="text-left text-[11px] font-bold text-slate-400 dark:text-slate-500 px-6 py-3 tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {recent.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => onViewReport(r.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition"
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
              {recent.map(r => (
                <button
                  key={r.id}
                  onClick={() => onViewReport(r.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 text-left transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">{r.id}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${STATUS_PILL[r.status] ?? ""}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{r.judul}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.kategori} · {formatDate(r.tanggalDibuat)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
