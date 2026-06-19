import { useState, useRef, useEffect } from "react";
import { Bell, Menu, Sun, Moon, CheckCheck, Trash2, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import { timeAgo, type Notification } from "../lib/storage";

interface Props {
  title: string;
  onMenuOpen: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  notifs: Notification[];
  userInitials: string;
  userName: string;
  userRole?: string;
  avatarUrl?: string;
  onMarkAllRead: () => void;
  onClearNotifs: () => void;
  onMarkRead?: (id: string) => void;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  success: CheckCircle,
  warning: AlertCircle,
  info:    Info,
  error:   XCircle,
};
const TYPE_COLOR: Record<string, string> = {
  success: "text-emerald-500",
  warning: "text-amber-500",
  info:    "text-blue-500",
  error:   "text-red-500",
};

export function TopBar({ title, onMenuOpen, isDark, onToggleDark, notifs, userInitials, userName, userRole, avatarUrl, onMarkAllRead, onClearNotifs, onMarkRead }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10 sticky top-0 z-20 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="group md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-600 transition-all duration-300"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400 transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-12 group-hover:text-white dark:group-hover:text-white" />
        </button>
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-5">
          {/* Dark mode */}
          <button
            onClick={onToggleDark}
            title={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
          >
            {isDark
              ? <Sun className="w-5 h-5 text-amber-400" />
              : <Moon className="w-5 h-5" />
            }
          </button>

          {/* Notifications */}
          <div className="md:relative" ref={ref}>
            <button
              onClick={() => setOpen(v => !v)}
              title="Notifikasi"
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all relative"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ring-2 ring-red-500/20">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute left-auto right-4 top-20 md:top-12 w-[calc(100vw-2rem)] sm:w-96 max-w-[380px] sm:max-w-none bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                {/* Dropdown header */}
                <div className="flex items-center justify-between pl-5 pr-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                    {unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-full">
                        {unread} baru
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {unread > 0 && (
                      <button onClick={onMarkAllRead} title="Tandai semua dibaca"
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notifs.length > 0 && (
                      <button onClick={onClearNotifs} title="Hapus semua notifikasi"
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                  {notifs.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada notifikasi</p>
                    </div>
                  ) : notifs.map(n => {
                    const Icon  = TYPE_ICON[n.type]  ?? Info;
                    const color = TYPE_COLOR[n.type] ?? "text-blue-500";
                    return (
                      <div
                        key={n.id}
                        onClick={() => !n.read && onMarkRead?.(n.id)}
                        className={`flex items-start gap-4 pl-5 pr-4 py-3.5 transition cursor-pointer ${n.read ? "hover:bg-slate-50/40 dark:hover:bg-slate-800/20" : "bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50/80 dark:hover:bg-blue-900/20"}`}
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
        </div>

        {/* User profile */}
        <div className="flex items-center gap-3 pl-8 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 dark:text-white">{userName}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">{userRole || "User"}</p>
          </div>
          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0">
            {avatarUrl ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={avatarUrl} />
            ) : (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{userInitials}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
