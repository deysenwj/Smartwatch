import { useState, useEffect, useCallback } from "react";
import {
  initStorage, getCurrentUser, setCurrentUser,
  getNotifications, markAllRead, clearNotifications,
  type User, type Notification,
} from "./lib/storage";

import { LoginPage }    from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { Sidebar }      from "./components/Sidebar";
import { TopBar }       from "./components/TopBar";
import { DashboardPage }from "./components/DashboardPage";
import { LaporanPage }  from "./components/LaporanPage";
import { RiwayatPage }  from "./components/RiwayatPage";
import { SettingsPage } from "./components/SettingsPage";
import { AdminPage }    from "./components/AdminPage";

import {
  signOutWithSupabase, hasSupabaseConfig, getSupabaseNotifications,
  markAllSupabaseNotificationsRead, clearSupabaseNotifications,
  supabase,
} from "./lib/supabase";

type AuthPage = "login" | "register";
type AppPage  = "dashboard" | "laporan" | "riwayat" | "settings";

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: "Dashboard",
  laporan:   "Buat Laporan",
  riwayat:   "Riwayat Laporan",
  settings:  "Pengaturan",
};

export function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export default function App() {
  useEffect(() => { initStorage(); }, []);

  const [user,        setUser]        = useState<User | null>(() => getCurrentUser());
  const [authPage,    setAuthPage]    = useState<AuthPage>("login");
  const [page,        setPage]        = useState<AppPage>("dashboard");
  const [detailId,    setDetailId]    = useState<string | null>(null);  // report ID string
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark,      setIsDark]      = useState(() => localStorage.getItem("theme") === "dark");
  const [notifs,      setNotifs]      = useState<Notification[]>([]);

  useEffect(() => { localStorage.setItem("theme", isDark ? "dark" : "light"); }, [isDark]);

  const refreshNotifs = useCallback(async () => {
    if (!user) return;
    if (hasSupabaseConfig()) {
      try {
        const list = await getSupabaseNotifications(user.id || "");
        setNotifs(list);
      } catch (err) {
        console.error("Gagal memuat notifikasi dari Supabase:", err);
      }
    } else {
      setNotifs(getNotifications(user.email));
    }
  }, [user]);

  useEffect(() => {
    refreshNotifs();
  }, [refreshNotifs, page]);

  function handleLogin(u: User) {
    setCurrentUser(u);
    setUser(u);
    setPage("dashboard");
  }

  function logout() {
    signOutWithSupabase();
    setCurrentUser(null);
    setUser(null);
    setAuthPage("login");
    setSidebarOpen(false);
  }

  useEffect(() => {
    async function checkUserStatus() {
      if (user && hasSupabaseConfig() && supabase) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id || "")
            .maybeSingle();
          if (error || !data) {
            logout();
          } else {
            const role = data.role as any;
            const updatedUser = {
              ...user,
              name: data.full_name || "",
              phone: data.phone || "",
              role,
              avatarUrl: data.avatar_url || "",
              pushNotif: data.push_notif ?? false,
            };
            if (
              user.name !== updatedUser.name ||
              user.phone !== updatedUser.phone ||
              user.role !== updatedUser.role ||
              user.avatarUrl !== updatedUser.avatarUrl ||
              user.pushNotif !== updatedUser.pushNotif
            ) {
              setCurrentUser(updatedUser);
              setUser(updatedUser);
            }
          }
        } catch (err) {
          console.error("Gagal memverifikasi status user:", err);
        }
      }
    }
    checkUserStatus();
  }, [user?.id]);

  function navigate(p: AppPage) {
    setPage(p);
    setDetailId(null);
    setSidebarOpen(false);
  }

  // Pass the string report ID — not an array index
  function viewReport(reportId: string) {
    setPage("riwayat");
    setDetailId(reportId);
    setSidebarOpen(false);
  }

  /* ── Auth ─────────────────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className={isDark ? "dark" : ""}>
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
          {authPage === "register"
            ? <RegisterPage onRegister={() => setAuthPage("login")} onGoLogin={() => setAuthPage("login")} />
            : <LoginPage onLogin={handleLogin} onGoRegister={() => setAuthPage("register")} />
          }
        </div>
      </div>
    );
  }

  /* ── Admin ────────────────────────────────────────────────────────── */
  if (user.role === "admin") {
    return (
      <div className={isDark ? "dark" : ""}>
        <AdminPage
          user={user}
          notifs={notifs}
          onRefreshNotifs={refreshNotifs}
          isDark={isDark}
          onToggleDark={() => setIsDark(v => !v)}
          onMarkAllRead={async () => {
            if (hasSupabaseConfig()) {
              await markAllSupabaseNotificationsRead(user.id || "");
            } else {
              markAllRead(user.email);
            }
            refreshNotifs();
          }}
          onClearNotifs={async () => {
            if (hasSupabaseConfig()) {
              await clearSupabaseNotifications(user.id || "");
            } else {
              clearNotifications(user.email);
            }
            refreshNotifs();
          }}
          onLogout={logout}
          onSaved={() => setUser(getCurrentUser())}
        />
      </div>
    );
  }

  /* ── User ─────────────────────────────────────────────────────────── */
  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Sidebar
          currentPage={page}
          onNavigate={navigate}
          onLogout={logout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
        />
        <div className="md:pl-60 min-h-screen flex flex-col">
          <TopBar
            title={PAGE_TITLES[page]}
            onMenuOpen={() => setSidebarOpen(true)}
            isDark={isDark}
            onToggleDark={() => setIsDark(v => !v)}
            notifs={notifs}
            userInitials={initials(user.name)}
            userName={user.name}
            avatarUrl={user.avatarUrl}
            onMarkAllRead={async () => {
              if (hasSupabaseConfig()) {
                await markAllSupabaseNotificationsRead(user.id || "");
              } else {
                markAllRead(user.email);
              }
              refreshNotifs();
            }}
            onClearNotifs={async () => {
              if (hasSupabaseConfig()) {
                await clearSupabaseNotifications(user.id || "");
              } else {
                clearNotifications(user.email);
              }
              refreshNotifs();
            }}
          />
          <main className="flex-1">
            {page === "dashboard" && (
              <DashboardPage user={user} onNavigate={navigate} onViewReport={viewReport} />
            )}
            {page === "laporan" && (
              <LaporanPage
                user={user}
                onNavigate={navigate}
                onSubmitted={() => { refreshNotifs(); navigate("riwayat"); }}
              />
            )}
            {page === "riwayat" && (
              <RiwayatPage user={user} initialDetailId={detailId} onRefreshNotifs={refreshNotifs} />
            )}
            {page === "settings" && (
              <SettingsPage user={user} onLogout={logout} onSaved={() => setUser(getCurrentUser())} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
