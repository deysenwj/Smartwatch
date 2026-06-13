import { useState } from "react";
import {
  Watch,
  CheckCircle,
  ShieldCheck,
  Headphones,
  AlertCircle,
} from "lucide-react";
import { register } from "../lib/storage";
import { hasSupabaseConfig, signUpWithSupabase } from "../lib/supabase";

interface Props {
  onRegister: () => void;
  onGoLogin: () => void;
}

const perks = [
  {
    icon: CheckCircle,
    title: "Gratis & Mudah",
    desc: "Pendaftaran dalam 2 menit",
  },
  {
    icon: ShieldCheck,
    title: "Data Terenkripsi",
    desc: "Privasi Anda terjaga penuh",
  },
  { icon: Headphones, title: "Dukungan 24/7", desc: "Tim siap membantu Anda" },
];

function strengthInfo(pw: string) {
  if (!pw) return { level: 0, label: "", color: "" };
  if (pw.length < 6) return { level: 1, label: "Lemah", color: "bg-red-500" };
  if (pw.length < 10)
    return { level: 2, label: "Sedang", color: "bg-yellow-500" };
  return { level: 3, label: "Kuat", color: "bg-green-500" };
}

export function RegisterPage({ onRegister, onGoLogin }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const str = strengthInfo(form.password);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setError("");
    };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.phone || !form.password) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    if (form.password.length < 6) {
      setError("Kata sandi minimal 6 karakter.");
      return;
    }
    if (!agreed) {
      setError("Anda harus menyetujui syarat & ketentuan.");
      return;
    }

    setLoading(true);

    try {
      if (hasSupabaseConfig()) {
        await signUpWithSupabase(form.email.trim(), form.password, {
          full_name: form.name.trim(),
          phone: form.phone.trim(),
        });

        setSuccess(
          "Akun berhasil dibuat! Silakan cek email Anda untuk verifikasi.",
        );
        setTimeout(onRegister, 1800);
        return;
      }

      const result = register(
        form.name.trim(),
        form.email.trim(),
        form.phone.trim(),
        form.password,
      );
      if (result.ok) {
        setSuccess("Akun berhasil dibuat! Silakan masuk.");
        setTimeout(onRegister, 1500);
      } else {
        setError(result.error ?? "Pendaftaran gagal.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
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
            <h2 className="text-2xl md:text-3xl font-bold">
              Bergabung Sekarang
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Daftarkan diri Anda untuk mulai melaporkan dan memantau
              perkembangan laporan hukum Anda.
            </p>
            <div className="space-y-3 pt-1">
              {perks.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-8 md:mt-0 relative z-10">
            © 2024 Smartwatch Indonesia
          </p>
        </div>

        {/* Right panel */}
        <div className="px-6 py-8 md:px-10 md:py-10 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Buat Akun Baru
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Lengkapi data diri Anda di bawah ini
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2.5 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          {!hasSupabaseConfig() && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 mb-4">
              Supabase belum aktif. Pendaftaran saat ini berjalan di mode lokal.
              Isi file .env dengan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
              agar akun masuk ke Supabase.
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-3 py-2.5 mb-4 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {(
              [
                {
                  key: "name",
                  label: "Nama Lengkap",
                  type: "text",
                  placeholder: "Ahmad Fauzi",
                },
                {
                  key: "email",
                  label: "Email",
                  type: "email",
                  placeholder: "nama@email.com",
                },
                {
                  key: "phone",
                  label: "Nomor Telepon",
                  type: "tel",
                  placeholder: "+62 812-xxxx-xxxx",
                },
              ] as const
            ).map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className={inputCls}
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={set("password")}
                className={inputCls}
              />
              {form.password && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i <= str.level ? str.color : "bg-slate-200 dark:bg-slate-700"}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-12 text-right">
                    {str.label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Konfirmasi Kata Sandi
              </label>
              <input
                type="password"
                placeholder="Ulangi kata sandi"
                value={form.confirm}
                onChange={set("confirm")}
                className={inputCls}
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-slate-300 accent-slate-900 shrink-0"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Saya menyetujui{" "}
                <button
                  type="button"
                  className="text-slate-900 dark:text-white font-bold hover:underline"
                >
                  Syarat & Ketentuan
                </button>{" "}
                serta{" "}
                <button
                  type="button"
                  className="text-slate-900 dark:text-white font-bold hover:underline"
                >
                  Kebijakan Privasi
                </button>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60"
            >
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
            Sudah punya akun?{" "}
            <button
              onClick={onGoLogin}
              className="text-slate-900 dark:text-white font-bold hover:underline"
            >
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
