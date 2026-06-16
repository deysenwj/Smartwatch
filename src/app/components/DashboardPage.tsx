import { useState, useEffect } from "react";
import {
  FileText, Clock, CheckCircle, AlertCircle, Plus, ArrowRight,
  ChevronRight, ShieldAlert, Inbox, X, Send, Phone, Mail
} from "lucide-react";
import { getUserReports, formatDate, type User, type Report } from "../lib/storage";
import { hasSupabaseConfig, getSupabaseUserReports } from "../lib/supabase";
import courtroomBanner from "../../imports/courtroom_banner.png";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  user: User;
  onNavigate: (page: Page) => void;
  onViewReport: (reportId: string) => void;
}

const MOCK_PILLS: Record<string, string> = {
  Menunggu: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
  Diproses: "bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-300",
  Prioritas: "bg-red-50 text-red-650 dark:bg-red-950/50 dark:text-red-300",
  Selesai: "bg-emerald-55 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-350",
  Ditolak: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function DashboardPage({ user, onNavigate, onViewReport }: Props) {
  const [reports, setReports] = useState<Report[]>([]);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState("");
  const [supportSent, setSupportSent] = useState(false);

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

  const handleSupportClick = () => {
    setSupportModalOpen(true);
    setSupportSent(false);
    setSupportMsg("");
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setSupportSent(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar max-w-7xl mx-auto w-full">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Laporan - Hero Card */}
            <div className="sm:col-span-2 lg:col-span-2 bg-[#0f172a] dark:bg-slate-900 p-8 rounded-[24px] relative overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-none border border-transparent dark:border-slate-800">
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <p className="text-white/60 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2">
                    Total Laporan
                  </p>
                  <h3 className="text-[40px] font-bold tracking-tight leading-none text-white mb-6">
                    {total}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-indigo-400 dark:text-indigo-300 font-bold text-sm bg-white/10 dark:bg-white/5 w-fit px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  <span>+12% Bulan ini</span>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Menunggu Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Menunggu
                </p>
              </div>
              <h4 className="text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {menunggu}
              </h4>
            </div>

            {/* Diproses Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/50 text-orange-650 dark:text-orange-400 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Diproses
                </p>
              </div>
              <h4 className="text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {diproses}
              </h4>
            </div>

            {/* Prioritas Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 bg-red-50 dark:bg-red-950/50 text-red-650 dark:text-red-400 rounded-xl flex items-center justify-center mb-4">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Prioritas
                </p>
              </div>
              <h4 className="text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {prioritas}
              </h4>
            </div>

            {/* Selesai Card */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-450 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Selesai
                </p>
              </div>
              <h4 className="text-[40px] font-bold text-slate-900 dark:text-white mt-2">
                {selesai}
              </h4>
            </div>
          </div>

          {/* Menunggu Validation Alert Banner */}
          {menunggu > 0 && (
            <div className="p-6 bg-[#6366f1] dark:bg-indigo-750 rounded-[24px] shadow-xl shadow-indigo-500/10 dark:shadow-none flex flex-col sm:flex-row items-center justify-between text-white gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">{menunggu} laporan sedang menunggu validasi</p>
                  <p className="text-xs text-white/70">Tim admin akan meninjau dokumen Anda segera.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("riwayat")}
                className="bg-white text-[#6366f1] px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Lihat Detail
              </button>
            </div>
          )}

          {/* Rejected Reports Alert Banner */}
          {ditolak > 0 && (
            <div className="p-6 bg-red-655 dark:bg-red-750 rounded-[24px] shadow-xl shadow-red-500/10 dark:shadow-none flex flex-col sm:flex-row items-center justify-between text-white gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shrink-0">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium">{ditolak} laporan Anda ditolak</p>
                  <p className="text-xs text-white/70">Periksa catatan atau kendala laporan di riwayat untuk revisi.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("riwayat")}
                className="bg-white text-red-600 px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap shrink-0"
              >
                Lihat Detail
              </button>
            </div>
          )}

          {/* Recent Reports Section */}
          <section className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm">
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-55/30 dark:bg-slate-900/10">
              <h3 className="font-bold text-slate-900 dark:text-white">Laporan Terbaru</h3>
              <button
                onClick={() => onNavigate("riwayat")}
                className="flex items-center gap-1 text-[#6366f1] dark:text-indigo-400 font-semibold hover:gap-1.5 transition-all text-sm"
              >
                Lihat Semua
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
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
                      <tr className="bg-slate-50/50 dark:bg-slate-855 border-b border-slate-100 dark:border-slate-800">
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
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#6366f1] dark:group-hover:text-indigo-400 transition-colors">
                                {r.judul}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-550 font-mono">
                                {r.id.substring(0, 8)}...
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-650 dark:text-slate-400">
                                {r.kategori}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {formatDate(r.tanggalDibuat)}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
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
                          <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-550">
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
        {/* END: Left Column */}

        {/* BEGIN: Right Column (Banner & Support Area) */}
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
          </section>

          {/* Quick Help Card */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[24px] border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Bantuan Cepat</h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">
              Butuh panduan dalam membuat laporan atau ingin berkonsultasi?
            </p>
            <button
              onClick={handleSupportClick}
              className="w-full border-2 border-slate-100 dark:border-slate-700 hover:border-[#6366f1] dark:hover:border-[#6366f1] hover:text-[#6366f1] dark:hover:text-[#6366f1] dark:text-slate-350 py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              Hubungi Support
            </button>
          </div>
        </aside>
        {/* END: Right Column */}
      </div>

      {/* Support Interactive Modal Dialog */}
      {supportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] border border-slate-200 dark:border-slate-700/80 max-w-md w-full overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setSupportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {!supportSent ? (
              <form onSubmit={handleSendSupport} className="space-y-4">
                <div className="text-center pb-2">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 text-[#6366f1] dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hubungi Layanan Bantuan</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Ajukan pertanyaan atau diskusikan kendala administrasi / laporan hukum Anda langsung dengan tim kami.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none">Email Layanan</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">support@smartwatchhukum.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                    <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase leading-none">Hotline WA</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-1">+62 812-3456-7890</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider block">Pesan atau Kendala</label>
                  <textarea
                    rows={4}
                    value={supportMsg}
                    onChange={(e) => setSupportMsg(e.target.value)}
                    required
                    placeholder="Tulis kendala atau pertanyaan Anda di sini secara detail..."
                    className="w-full text-sm rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#6366f1] hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim Pesan
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Pesan Terkirim</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Terima kasih! Pesan support Anda telah masuk ke sistem kami. Tim hukum akan segera merespons ke alamat email terdaftar dalam waktu maksimal 1 jam.
                  </p>
                </div>
                <button
                  onClick={() => setSupportModalOpen(false)}
                  className="mt-2 px-6 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Tutup
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
