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
  avatarUrl?: string;
  onMarkAllRead: () => void;
  onClearNotifs: () => void;
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

export function TopBar({ title, onMenuOpen, isDark, onToggleDark, notifs, userInitials, userName, avatarUrl, onMarkAllRead, onClearNotifs }: Props) {
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
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuOpen}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Buka menu"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        {/* Dark mode */}
        <button
          onClick={onToggleDark}
          title={isDark ? "Aktifkan Mode Terang" : "Aktifkan Mode Gelap"}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {isDark
            ? <Sun  className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4 text-slate-500" />
          }
        </button>

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(v => !v)}
            title="Notifikasi"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-full">
                      {unread} baru
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {unread > 0 && (
                    <button onClick={onMarkAllRead} title="Tandai semua dibaca"
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {notifs.length > 0 && (
                    <button onClick={onClearNotifs} title="Hapus semua notifikasi"
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-400 hover:text-red-500 dark:hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/50">
                {notifs.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada notifikasi</p>
                  </div>
                ) : notifs.map(n => {
                  const Icon  = TYPE_ICON[n.type]  ?? Info;
                  const color = TYPE_COLOR[n.type] ?? "text-blue-500";
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 transition ${n.read ? "" : "bg-blue-50/60 dark:bg-blue-900/10"}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{n.text}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{timeAgo(n.time)}</p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={userName}
            title={userName}
            className="w-8 h-8 rounded-full object-cover ml-1 shrink-0 cursor-default select-none border border-slate-200 dark:border-slate-700"
          />
        ) : (
          <div
            title={userName}
            className="w-8 h-8 bg-slate-900 dark:bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold ml-1 shrink-0 cursor-default select-none"
          >
            {userInitials}
          </div>
        )}
      </div>
    </header>
  );
}
