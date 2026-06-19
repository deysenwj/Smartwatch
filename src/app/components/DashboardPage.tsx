import { useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle, AlertCircle,
  ChevronRight, Inbox
} from "lucide-react";
import { getUserReports, formatDate, type User, type Report } from "../lib/storage";
import {
  hasSupabaseConfig, getSupabaseUserReports,
} from "../lib/supabase";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip,
  AreaChart, Area
} from "recharts";
import courtroomBanner from "../../imports/courtroom_banner.png";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
  onViewReport: (reportId: string) => void;
  isDark?: boolean;
}

const MOCK_PILLS: Record<string, string> = {
  Menunggu: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  Diproses: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300",
  Selesai: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300",
  Ditolak: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function DashboardPage({ user, onNavigate, onViewReport, isDark = false }: Props) {
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
  const selesai   = reports.filter(r => r.status === "Selesai").length;
  const ditolak   = reports.filter(r => r.status === "Ditolak").length;

  // Hitung pertumbuhan laporan bulan ini vs bulan lalu
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const thisMonthCount = reports.filter(r => {
    const d = new Date(r.tanggalDibuat);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;
  const lastMonthCount = reports.filter(r => {
    const d = new Date(r.tanggalDibuat);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  }).length;
  const growthPct = lastMonthCount === 0
    ? (thisMonthCount > 0 ? 100 : 0)
    : Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
  const growthLabel = growthPct === 0
    ? "Sama dengan bulan lalu"
    : growthPct > 0
      ? `+${growthPct}% dari bulan lalu`
      : `${growthPct}% dari bulan lalu`;

  const recent = [...reports]
    .sort((a, b) => b.tanggalDibuat.localeCompare(a.tanggalDibuat))
    .slice(0, 5);

  const getMonthlyData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      if (!r.tanggalDibuat) return;
      const d = new Date(r.tanggalDibuat);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.keys(counts)
      .sort()
      .map(key => {
        const [year, month] = key.split("-");
        const monthIndex = parseInt(month) - 1;
        const monthName = months[monthIndex] || "N/A";
        return {
          month: `${monthName} ${year.slice(-2)}`,
          "Jumlah Laporan": counts[key]
        };
      });
  };

  const getCategoryData = () => {
    const counts: Record<string, number> = {
      "Siber": 0,
      "Penipuan": 0,
      "Pencurian": 0,
      "Kekerasan": 0,
      "Ketertiban": 0,
      "Lainnya": 0
    };
    reports.forEach(r => {
      if (r.kategori) {
        if (r.kategori in counts) {
          counts[r.kategori]++;
        } else {
          counts["Lainnya"]++;
        }
      }
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      "Jumlah": counts[cat]
    })).sort((a, b) => b.Jumlah - a.Jumlah);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-28 md:pb-10 custom-scrollbar max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <div className="mb-10">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
          Selamat Datang, {user.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
          Pantau perkembangan laporan hukum Anda secara real-time di bawah ini.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* BEGIN: Left Column (Dynamic Stats & Reports List) */}
        <section className="col-span-12 lg:col-span-8 space-y-8" data-purpose="statistics-grid">
          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Total Laporan - Hero Card */}
            <div className="col-span-1 lg:col-span-2 bg-slate-800 dark:bg-slate-800 p-5 sm:p-6 lg:p-8 rounded-[24px] relative overflow-hidden shadow-xl border border-slate-700/50 dark:border-slate-700/60">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                    Total Laporan
                  </p>
                  <h3 className="text-2xl sm:text-[40px] font-bold tracking-tight leading-none text-white mb-4 sm:mb-6">
                    {total}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 dark:text-emerald-300 font-bold text-xs sm:text-sm bg-emerald-500/10 w-fit px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg border border-emerald-500/20">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <span>{growthLabel}</span>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-slate-700/10 rounded-full blur-3xl"></div>
              <div className="absolute -left-6 -top-6 w-32 h-32 bg-slate-700/10 rounded-full blur-2xl"></div>
            </div>

            {/* Menunggu Card */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Menunggu
                </p>
              </div>
              <h4 className="text-2xl sm:text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {menunggu}
              </h4>
            </div>

            {/* Diproses Card */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-amber-50 dark:bg-amber-950/50 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <FileText className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Diproses
                </p>
              </div>
              <h4 className="text-2xl sm:text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {diproses}
              </h4>
            </div>

            {/* Selesai Card */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Selesai
                </p>
              </div>
              <h4 className="text-2xl sm:text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {selesai}
              </h4>
            </div>
          </div>

          {/* Menunggu Validation Alert Banner */}
          {menunggu > 0 && (
            <div className="p-6 bg-slate-800 dark:bg-slate-800 rounded-[24px] shadow-xl flex flex-col sm:flex-row items-center justify-between text-white gap-4 border border-slate-700/50 dark:border-slate-700/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{menunggu} laporan sedang menunggu validasi</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">Tim admin akan meninjau dokumen Anda segera.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("riwayat")}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Lihat Detail
              </button>
            </div>
          )}

          {/* Rejected Reports Alert Banner */}
          {ditolak > 0 && (
            <div className="p-6 bg-rose-800 rounded-[24px] shadow-xl shadow-rose-900/30 flex flex-col sm:flex-row items-center justify-between text-white gap-4 border border-rose-700/40">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{ditolak} laporan Anda ditolak</p>
                  <p className="text-xs text-rose-300">Periksa catatan atau kendala laporan di riwayat untuk revisi.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("riwayat")}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-6 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Lihat Detail
              </button>
            </div>
          )}

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
            
            {/* Monthly Trend Area Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Laporan Bulanan</h3>
                </div>
                <div className="w-full h-64 text-xs">
                  {getMonthlyData().length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">Tidak ada data bulanan.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getMonthlyData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorReportsUser" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isDark ? "#ffffff" : "#030213"} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={isDark ? "#ffffff" : "#030213"} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="month"
                          stroke={isDark ? "#64748b" : "#94a3b8"}
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: isDark ? "#334155" : "#e2e8f0", strokeWidth: 1 }}
                          tickFormatter={(tick) => tick.split(" ")[0]}
                        />
                        <YAxis hide={true} />
                        <RechartsTooltip
                          contentStyle={{
                            background: isDark ? "#0f172a" : "#ffffff",
                            borderColor: isDark ? "#1e293b" : "#e2e8f0",
                            borderRadius: "12px",
                            color: isDark ? "#f8fafc" : "#030213",
                            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.08)",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Jumlah Laporan"
                          stroke={isDark ? "#ffffff" : "#030213"}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorReportsUser)"
                          activeDot={{ r: 5, strokeWidth: 2, stroke: isDark ? "#ffffff" : "#030213", fill: isDark ? "#0f172a" : "#ffffff" }}
                          dot={{ r: 3.5, strokeWidth: 2, stroke: isDark ? "#ffffff" : "#030213", fill: isDark ? "#0f172a" : "#ffffff" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Category Distribution Progress Bars */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
              <div>
                <div className="pb-3 mb-6 border-b border-slate-100 dark:border-slate-700/50">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Kategori Terbanyak</h3>
                </div>
                <div className="space-y-4">
                  {getCategoryData().length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400 py-12">Tidak ada data kategori.</div>
                  ) : (
                    getCategoryData().map((item) => {
                      const maxVal = Math.max(...getCategoryData().map(d => d.Jumlah), 1);
                      const percentage = maxVal > 0 && item.Jumlah > 0 ? (item.Jumlah / maxVal) * 100 : 0;
                      return (
                        <div key={item.name} className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">
                              {item.name === "Siber" ? "Cybercrime" : item.name}
                            </span>
                            <span className="text-slate-900 dark:text-white">{item.Jumlah}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#030213] dark:bg-slate-100 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Recent Reports Section */}
          <section className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/10">
              <h3 className="font-bold text-slate-900 dark:text-white">Laporan Terbaru</h3>
            </div>

            {recent.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Belum ada laporan yang dibuat</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Buat laporan pertama Anda untuk memulai tracking.</p>
                <button
                  onClick={() => onNavigate("laporan")}
                  className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition shadow-sm"
                >
                  Buat Laporan
                </button>
              </div>
            ) : (
              <>
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-5 font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[11px]">Detail Laporan</th>
                        <th className="px-8 py-5 font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[11px]">Kategori</th>
                        <th className="px-8 py-5 font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[11px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recent.map(r => (
                        <tr
                          key={r.id}
                          onClick={() => onViewReport(r.id)}
                          className="hover:bg-slate-50/30 dark:hover:bg-slate-900/10 cursor-pointer transition-colors group"
                        >
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors">
                                {r.judul}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-550 font-mono">
                                {r.id.substring(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-650 dark:text-slate-400">
                                {r.kategori}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {formatDate(r.tanggalDibuat)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight ${MOCK_PILLS[r.status] ?? ""}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {recent.map(r => (
                    <button
                      key={r.id}
                      onClick={() => onViewReport(r.id)}
                      className="w-full flex items-center justify-between gap-3 px-6 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-left transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            {r.id.substring(0, 8)}...
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${MOCK_PILLS[r.status] ?? ""}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.judul}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
                          {r.kategori} · {formatDate(r.tanggalDibuat)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
        </section>
        {/* END: Left Column */}        {/* BEGIN: Right Column (Banner & Support Area) */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          {/* Courtroom Vertical Card */}
          <section className="relative rounded-[24px] overflow-hidden min-h-[420px] lg:h-[420px] flex flex-col group border border-slate-100 dark:border-slate-800 shadow-sm">
            <img
              alt="Courtroom Background"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={courtroomBanner}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/75 to-transparent dark:from-[#090e1a]/90 dark:via-[#090e1a]/70 dark:to-transparent flex flex-col justify-end p-8">
              <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
                Penyelesaian Laporan Terpadu
              </h2>
              <p className="text-slate-200 dark:text-slate-300 text-sm leading-relaxed mb-8 opacity-90">
                Sistem kami memastikan setiap laporan hukum diproses dengan standar profesionalisme tertinggi untuk transparansi dan keadilan.
              </p>
              <div className="flex items-center gap-4 border-t border-white/20 pt-6">
                <div className="flex -space-x-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] dark:border-[#090e1a] bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white">JD</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] dark:border-[#090e1a] bg-orange-500 flex items-center justify-center text-[9px] font-bold text-white">RH</div>
                  <div className="w-8 h-8 rounded-full border-2 border-[#0f172a] dark:border-[#090e1a] bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white">MK</div>
                </div>
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                  Didukung oleh Tim Ahli
                </p>
              </div>
            </div>
          </section>        </aside>
        {/* END: Right Column */}
      </div>
    </div>
  );
}
