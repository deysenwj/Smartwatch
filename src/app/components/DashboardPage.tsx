import { useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronRight, ShieldAlert, Inbox,
} from "lucide-react";
import { getUserReports, formatDate, type User, type Report } from "../lib/storage";
import { hasSupabaseConfig, getSupabaseUserReports } from "../lib/supabase";
import courtroomBanner from "../../imports/courtroom_banner.png";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
  onViewReport: (reportId: string) => void;  // now uses string report ID
}

const MOCK_PILLS: Record<string, string> = {
  Menunggu: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-350",
  Diproses: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-350",
  Prioritas: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-350",
  Selesai: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-350",
  Ditolak: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

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
      icon: FileText,
      value: total,
      label: "Total Laporan",
      valueColor: "text-slate-900 dark:text-white",
      iconColor: "text-slate-500 dark:text-slate-450",
      accentColor: "bg-indigo-600",
    },
    {
      icon: Clock,
      value: menunggu,
      label: "Menunggu",
      valueColor: "text-indigo-900 dark:text-indigo-200",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      accentColor: "bg-indigo-600",
    },
    {
      icon: AlertCircle,
      value: diproses + prioritas,
      label: "Diproses",
      valueColor: "text-orange-900 dark:text-orange-200",
      iconColor: "text-orange-650 dark:text-orange-400",
      accentColor: "bg-orange-600",
    },
    {
      icon: ShieldAlert,
      value: prioritas,
      label: "Prioritas",
      valueColor: "text-red-900 dark:text-red-200",
      iconColor: "text-red-650 dark:text-red-400",
      accentColor: "bg-red-600",
    },
    {
      icon: CheckCircle,
      value: selesai,
      label: "Selesai",
      valueColor: "text-emerald-900 dark:text-emerald-200",
      iconColor: "text-emerald-650 dark:text-emerald-400",
      accentColor: "bg-emerald-600",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl">

      {/* Greeting & CTA Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Selamat Datang, {user.name}
          </h1>
          <p className="text-slate-550 dark:text-slate-400 text-sm mt-0.5">
            Pantau perkembangan laporan hukum Anda di sini
          </p>
        </div>
        <button
          onClick={() => onNavigate("laporan")}
          className="bg-[#131b2e] dark:bg-slate-700 hover:bg-[#1a2540] dark:hover:bg-slate-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold hover:shadow-lg transition-all active:scale-95 duration-200 w-full sm:w-auto shrink-0"
        >
          <Plus className="w-5 h-5" />
          Buat Laporan Baru
        </button>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ icon: Icon, value, label, valueColor, iconColor, accentColor }) => (
          <div key={label} className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col justify-between h-full relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 group">
            <div className="flex flex-col gap-1">
              <span className={`text-[40px] font-bold tracking-tight leading-none ${valueColor}`}>{value}</span>
              <div className="flex items-center gap-2 mt-4">
                <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{label}</span>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accentColor}`}></div>
          </div>
        ))}
      </div>

      {/* Alert banner for Menunggu */}
      {menunggu > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full shrink-0 animate-pulse" />
            <p className="text-sm text-indigo-900 dark:text-indigo-250 font-medium">
              {menunggu} laporan sedang menunggu validasi dari admin.
            </p>
          </div>
          <button
            onClick={() => onNavigate("riwayat")}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Juga banner untuk ditolak */}
      {ditolak > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/60 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-900 dark:text-red-200 font-medium">
              {ditolak} laporan telah ditolak. Periksa catatan admin.
            </p>
          </div>
          <button
            onClick={() => onNavigate("riwayat")}
            className="text-xs font-bold text-red-750 dark:text-red-400 hover:underline shrink-0"
          >
            Lihat
          </button>
        </div>
      )}

      {/* Recent reports */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 dark:text-white">Laporan Terbaru</h3>
          <button
            onClick={() => onNavigate("riwayat")}
            className="flex items-center gap-1 text-indigo-650 dark:text-indigo-400 font-semibold hover:gap-1.5 transition-all text-sm"
          >
            Lihat Semua <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-550 dark:text-slate-400 text-sm font-medium">Belum ada laporan</p>
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
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/30 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                    {["ID LAPORAN", "JUDUL", "KATEGORI", "TANGGAL", "STATUS"].map(h => (
                      <th key={h} className="px-6 py-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[11px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                  {recent.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => onViewReport(r.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-[12px] text-slate-500 dark:text-slate-400">{r.id}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">{r.judul}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{r.kategori}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(r.tanggalDibuat)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${MOCK_PILLS[r.status] ?? ""}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-850">
              {recent.map(r => (
                <button
                  key={r.id}
                  onClick={() => onViewReport(r.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 text-left transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-450 dark:text-slate-500">{r.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${MOCK_PILLS[r.status] ?? ""}`}>
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
          </>
        )}
      </div>

      {/* Courtroom Backdrop Banner */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden mt-8 shadow-sm border border-slate-100 dark:border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-br from-[#131b2e] to-[#2170e4] opacity-90"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-35 z-10"
          alt="A professional high-angle shot of a grand legal courtroom"
          src={courtroomBanner}
        />
        <div className="absolute inset-0 flex items-center justify-center p-8 z-20">
          <div className="text-center text-white max-w-lg">
            <h4 className="text-2xl font-bold mb-2">Penyelesaian Laporan Terpadu</h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              Sistem kami memastikan setiap laporan hukum diproses dengan standar profesionalisme tertinggi untuk transparansi dan keadilan.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
