import { useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Watch,
  Shield,
  AlertCircle,
} from "lucide-react";
import { login, initStorage, type User } from "../lib/storage";
import { hasSupabaseConfig, signInWithSupabase } from "../lib/supabase";

interface Props {
  onLogin: (user: User) => void;
  onGoRegister: () => void;
}

export function LoginPage({ onLogin, onGoRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      if (hasSupabaseConfig()) {
        const user = await signInWithSupabase(email.trim(), password);
        onLogin(user);
        return;
      }

      initStorage();
      const user = login(email.trim(), password);
      if (user) {
        onLogin(user);
      } else {
        setError("Email atau kata sandi salah.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal masuk ke akun Supabase.",
      );
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: "admin" | "user") {
    if (role === "admin") {
      setEmail("admin@smartwatch.go.id");
      setPassword("admin123");
    } else {
      setEmail("ahmad@mail.com");
      setPassword("user123");
    }
    setError("");
  }

  const inputCls =
    "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left panel */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white flex flex-col justify-between p-8 md:p-10 md:w-[400px] md:shrink-0 relative overflow-hidden">
          {/* Ambient light flare overlays */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                <Watch className="w-5 h-5 text-blue-300" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                Smartwatch
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Sistem Pelaporan Hukum Masyarakat
            </p>
          </div>

          <div className="space-y-5 mt-8 md:mt-0 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-300" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-snug">
                Laporkan,
                <br className="hidden md:block" /> Pantau, Selesaikan.
              </h2>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Platform transparan untuk menyampaikan pengaduan hukum Anda secara
              aman dan terstruktur.
            </p>
            <div className="flex gap-6 pt-1">
              {[
                ["1.2K+", "Pengguna"],
                ["100%", "Rahasia"],
                ["24/7", "Akses"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="text-xl font-bold">{v}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{l}</p>
                </div>
              ))}
            </div>

            {/* Demo credentials */}
            <div className="bg-white/5 rounded-xl p-4 space-y-2 mt-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                Demo Akun
              </p>
              <button
                type="button"
                onClick={() => fillDemo("admin")}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-xs"
              >
                <span className="font-bold text-blue-300">Admin</span>
                <span className="text-slate-400 ml-2">
                  admin@smartwatch.go.id / admin123
                </span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("user")}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-xs"
              >
                <span className="font-bold text-green-300">User</span>
                <span className="text-slate-400 ml-2">
                  ahmad@mail.com / user123
                </span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-8 md:mt-0 relative z-10">
            © 2024 Smartwatch Indonesia
          </p>
        </div>

        {/* Right panel */}
        <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-12 flex-1 bg-white dark:bg-slate-900">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Selamat Datang Kembali
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-7">
            Masuk untuk melanjutkan ke akun Anda
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2.5 mb-5 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {!hasSupabaseConfig() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 mb-5">
              Supabase belum aktif. Login saat ini memakai mode lokal. Isi file
              .env dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY agar
              memakai backend Supabase.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className={`${inputCls} pl-10 pr-4`}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:underline"
                >
                  Lupa?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className={`${inputCls} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 accent-slate-900"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Ingat saya
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Belum punya akun?{" "}
            <button
              onClick={onGoRegister}
              className="text-slate-900 dark:text-white font-bold hover:underline"
            >
              Daftar di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
