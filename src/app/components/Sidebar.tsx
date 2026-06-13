import { LayoutDashboard, PlusCircle, History, Settings, Watch, X } from "lucide-react";
import { getUserReports, type User } from "../lib/storage";
import { useState, useEffect } from "react";

type Page = "dashboard" | "laporan" | "riwayat" | "settings";

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onClose, user }: Props) {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Count reports still waiting for validation
    const reports = getUserReports(user.email);
    setPendingCount(reports.filter(r => r.status === "Menunggu").length);
  }, [user.email, currentPage]);

  const navItems: { key: Page; label: string; icon: React.ElementType; badge?: number }[] = [
    { key: "dashboard", label: "Dashboard",      icon: LayoutDashboard },
    { key: "laporan",   label: "Buat Laporan",   icon: PlusCircle },
    { key: "riwayat",  label: "Riwayat Laporan", icon: History, badge: pendingCount },
    { key: "settings", label: "Pengaturan",       icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-60
        bg-white dark:bg-slate-900
        border-r border-slate-200 dark:border-slate-700/60
        flex flex-col z-40 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
              <Watch className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight text-slate-900 dark:text-white">Smartwatch</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">User Portal</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ key, label, icon: Icon, badge }) => {
            const active = currentPage === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition text-left
                  ${active
                    ? "bg-slate-900 dark:bg-slate-700 text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && badge > 0 ? (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${active ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"}`}>
                    {badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl shadow-sm">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-750"
              />
            ) : (
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials(user.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none mt-1">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
