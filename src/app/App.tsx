import { useState, useEffect, useCallback, useRef } from "react";
import {
  initStorage, getCurrentUser, setCurrentUser,
  getNotifications, markAllRead, markNotificationRead, clearNotifications,
  getChatMessages, addChatMessage, markChatRead, timeAgo,
  addNotification,
  type User, type Notification, type ChatMessage,
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
  markAllSupabaseNotificationsRead, markSupabaseNotificationRead, clearSupabaseNotifications,
  getSupabaseChatMessages, addSupabaseChatMessage, markSupabaseChatRead,
  supabase, type SupabaseChatMessage, notifyAdmins,
} from "./lib/supabase";

import { MessageSquare, Send, X, Headphones } from "lucide-react";

type AuthPage = "login" | "register";
type AppPage  = "dashboard" | "laporan" | "riwayat" | "settings";

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: "Dashboard Overview",
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

  // Chat state
  const [isChatOpen,    setIsChatOpen]    = useState(false);
  const [chatMessages,  setChatMessages]  = useState<(ChatMessage | SupabaseChatMessage)[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userRef = useRef<User | null>(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadChat = useCallback(async () => {
    const currUser = userRef.current;
    if (!currUser || currUser.role === "admin") return;
    if (hasSupabaseConfig() && currUser.id) {
      try {
        const msgs = await getSupabaseChatMessages(currUser.id);
        setChatMessages(msgs);
      } catch (err) {
        console.error("Gagal memuat chat dari Supabase:", err);
      }
    } else {
      setChatMessages(getChatMessages(currUser.email));
    }
  }, []);

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

  // Poll chat messages & notifications for user
  useEffect(() => {
    if (!user || user.role === "admin") {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
        chatPollRef.current = null;
      }
      return;
    }

    loadChat();
    refreshNotifs();
    chatPollRef.current = setInterval(() => {
      loadChat();
      refreshNotifs();
    }, 3000);

    return () => {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
        chatPollRef.current = null;
      }
    };
  }, [user, loadChat, refreshNotifs]);

  // Scroll to bottom
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [isChatOpen, chatMessages.length]);

  // Mark read when open or new messages arrive
  useEffect(() => {
    if (isChatOpen && user && user.role !== "admin") {
      if (hasSupabaseConfig() && user.id) {
        markSupabaseChatRead(user.id, "user");
      } else {
        markChatRead(user.email, "user");
      }
    }
  }, [isChatOpen, chatMessages.length, user]);

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !user) return;

    setChatInput("");
    if (hasSupabaseConfig() && user.id) {
      await addSupabaseChatMessage(user.id, {
        from_role: "user",
        sender_name: user.name,
        text,
      });
      try {
        await notifyAdmins(`Pesan chat baru dari ${user.name}: "${text.substring(0, 30)}..."`, "info");
      } catch (adminNotifErr) {
        console.error("Gagal mengirim notifikasi chat ke admin di Supabase:", adminNotifErr);
      }
    } else {
      addChatMessage(user.email, {
        from: "user",
        senderName: user.name,
        text,
      });
      addNotification("admin@smartwatch.go.id", `Pesan chat baru dari ${user.name}: "${text.substring(0, 30)}..."`, "info");
    }
    loadChat();
  }

  // Count unread messages from admin
  const unreadCount = chatMessages.filter(m => {
    const role = (m as any).from_role ?? (m as any).from;
    return role === "admin" && !m.read;
  }).length;

  useEffect(() => { localStorage.setItem("theme", isDark ? "dark" : "light"); }, [isDark]);



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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
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
          onMarkRead={async (id: string) => {
            if (hasSupabaseConfig()) {
              await markSupabaseNotificationRead(id);
            } else {
              markNotificationRead(user.email, id);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
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
            userRole={user.role}
            avatarUrl={user.avatarUrl}
            onMarkAllRead={async () => {
              if (hasSupabaseConfig()) {
                await markAllSupabaseNotificationsRead(user.id || "");
              } else {
                markAllRead(user.email);
              }
              refreshNotifs();
            }}
            onMarkRead={async (id: string) => {
              if (hasSupabaseConfig()) {
                await markSupabaseNotificationRead(id);
              } else {
                markNotificationRead(user.email, id);
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
              <DashboardPage user={user} onNavigate={navigate} onViewReport={viewReport} isDark={isDark} />
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

        {/* Floating Customer Service Chat Widget */}
        <button
          onClick={() => setIsChatOpen(v => !v)}
          className="fixed sm:bottom-6 sm:right-6 right-4 bottom-6 z-40 w-14 h-14 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-slate-750/60 transition-all duration-300 hover:scale-105"
          title="Customer Service"
        >
          <Headphones className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {isChatOpen && (
          <div className="chat-popup-container fixed sm:bottom-24 sm:right-6 right-4 bottom-24 left-4 sm:left-auto w-auto sm:w-96 z-40 h-[480px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-[24px] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-slate-350" />
                </div>
                <div>
                  <p className="text-sm font-bold">Layanan Pelanggan</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-medium">Tim Admin Siap Membantu</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/20 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-655 mb-3" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-450">Belum ada pesan</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Hubungi tim administrasi kami jika Anda memiliki kendala seputar laporan hukum Anda.
                  </p>
                </div>
              ) : (
                chatMessages.map(msg => {
                  const role = (msg as any).from_role ?? (msg as any).from;
                  const senderName = (msg as any).sender_name ?? (msg as any).senderName;
                  const timestamp = (msg as any).created_at ?? (msg as any).time;

                  return (
                    <div key={msg.id} className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
                      {role === "admin" && (
                        <div className="w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 mr-2 mt-0.5">
                          CS
                        </div>
                      )}
                      <div className={`max-w-[75%] ${
                        role === "user"
                          ? "bg-slate-800 text-white dark:bg-slate-700 rounded-2xl rounded-br-sm border border-slate-700/50"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-bl-sm"
                      } px-3.5 py-2 shadow-sm`}>
                        <p className="text-xs leading-relaxed">{msg.text}</p>
                        <p className={`text-[9px] mt-1 text-right ${role === "user" ? "text-slate-400" : "text-slate-500"}`}>
                          {timeAgo(timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 p-3 border-t border-slate-100 dark:border-slate-750/70 bg-white dark:bg-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-500 transition"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-9 h-9 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition shrink-0 border border-slate-750/60"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
