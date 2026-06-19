import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  X,
} from "lucide-react";
import { login, initStorage, getUsers, updateUserProfile, updateLocalPassword, type User } from "../lib/storage";
import { hasSupabaseConfig, signInWithSupabase, sendSupabasePasswordReset, supabase } from "../lib/supabase";
import { sendOtpViaResend } from "../lib/resend";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import systemLogo from "../../imports/system_logo_black.png";

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
  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotEmail("");
    setForgotError("");
    setForgotSuccess("");
    setNewPassword("");
    setGeneratedOtp("");
    setOtpCode("");
    setShowNewPw(false);
    setStep(1);
  };

  // Load remembered email on mount
  useEffect(() => {
    const saved = localStorage.getItem("remembered_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Format email tidak valid.");
      return;
    }

    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem("remembered_email", email.trim());
      } else {
        localStorage.removeItem("remembered_email");
      }

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

  const inputCls =
    "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-200";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient background flares */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Card Wrapper with absolute logo */}
      <div className="relative w-full max-w-4xl mt-8 z-10">
        
        {/* Floating Logo: top center, circular, half-inside/half-outside */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-xl border-4 border-slate-50 dark:border-slate-950">
          <img src={systemLogo} alt="Logo" className="w-full h-full object-cover" />
        </div>

        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col md:flex-row relative z-10">
          {/* Left panel */}
          <div className="flex flex-col justify-between p-8 md:p-10 pt-16 md:pt-10 md:w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-955 text-white relative overflow-hidden">
            {/* Ambient light flare overlays */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="text-2xl font-bold tracking-tight">
                Smartwatch
              </span>
              <p className="text-slate-400 text-sm mt-1.5">
                Sistem Pelaporan Hukum Masyarakat
              </p>
            </div>

            <div className="space-y-6 mt-8 md:mt-0 relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold leading-snug">
                Laporkan,
                <br className="hidden md:block" /> Pantau, Selesaikan.
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Platform transparan untuk menyampaikan pengaduan hukum Anda secara
                aman dan terstruktur.
              </p>
              <div className="flex gap-8 pt-1">
                {[
                  ["100%", "Rahasia"],
                  ["24/7", "Akses"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-xl font-bold text-white">{v}</p>
                    <p className="text-xs text-white/80 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-8 md:mt-0 relative z-10">
              © 2026 Smartwatch Indonesia
            </p>
          </div>

          {/* Right panel */}
          <div className="flex flex-col justify-center px-6 py-8 md:px-10 md:py-12 md:w-1/2 bg-white dark:bg-slate-900 pt-16 md:pt-12">
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
                    onClick={() => {
                      setForgotEmail("");
                      setForgotError("");
                      setForgotSuccess("");
                      setNewPassword("");
                      setStep(1);
                      setShowForgotModal(true);
                    }}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
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
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 accent-indigo-600 text-indigo-600 focus:ring-indigo-500/20"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Ingat saya
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#131b2e] dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1c2742] dark:hover:bg-slate-600 transition duration-200 shadow-sm hover:shadow active:scale-98 disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              Belum punya akun?{" "}
              <button
                onClick={onGoRegister}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-500 transition-colors"
              >
                Daftar di sini
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-800/80 p-6 relative transition-all duration-300">
            <button
              type="button"
              onClick={handleCloseForgotModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-350 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Lupa Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {step === 1 && "Langkah 1 dari 3: Masukkan Email Anda"}
                {step === 2 && "Langkah 2 dari 3: Verifikasi Kode OTP"}
                {step === 3 && "Langkah 3 dari 3: Atur Kata Sandi Baru"}
              </p>
            </div>

            {forgotError && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-3 py-2.5 mb-4 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-3 py-2.5 mb-4 text-xs font-medium">
                {forgotSuccess}
              </div>
            )}

            {step === 1 && (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Masukkan email terdaftar Anda untuk menerima kode verifikasi OTP 6 digit.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-355 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="nama@email.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError("");
                      }}
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={forgotLoading}
                    onClick={async () => {
                      if (!forgotEmail) {
                        setForgotError("Email wajib diisi.");
                        return;
                      }
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(forgotEmail.trim())) {
                        setForgotError("Format email tidak valid.");
                        return;
                      }

                      setForgotLoading(true);
                      setForgotError("");
                      setForgotSuccess("");

                      try {
                        if (hasSupabaseConfig()) {
                          // Untuk Supabase, kirim token reset password via Supabase Auth
                          // (Yang terhubung dengan Resend SMTP)
                          await sendSupabasePasswordReset(forgotEmail.trim());
                          setForgotSuccess("Kode OTP/Link reset berhasil dikirim ke email Supabase Anda.");
                          setStep(2);
                        } else {
                          // Mode Lokal - menggunakan Resend API secara langsung
                          const users = getUsers();
                          const found = users.find(u => u.email === forgotEmail.trim());
                          if (!found) {
                            setForgotError("Email tidak ditemukan dalam sistem lokal.");
                            return;
                          }

                          // Generate 8-digit OTP
                          const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
                          setGeneratedOtp(otp);

                          const res = await sendOtpViaResend(forgotEmail.trim(), otp);
                          if (res.isSimulated) {
                            setForgotSuccess("Kode OTP berhasil dikirim (Simulasi). Silakan cek Console browser Anda!");
                          } else {
                            setForgotSuccess("Kode OTP 8-digit berhasil dikirim ke email Anda via Resend.");
                          }
                          setStep(2);
                        }
                      } catch (err) {
                        setForgotError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim OTP.");
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full bg-[#131b2e] dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1c2742] dark:hover:bg-slate-600 transition duration-200 shadow-sm active:scale-98 disabled:opacity-60"
                  >
                    {forgotLoading ? "Memproses..." : "Kirim Kode OTP"}
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Masukkan kode verifikasi OTP 8 digit yang telah dikirim ke <span className="font-semibold text-slate-800 dark:text-slate-200">{forgotEmail}</span>.
                </p>

                <div className="space-y-4 flex flex-col items-center">
                  <div className="flex flex-col items-center justify-center w-full py-2">
                    <InputOTP
                      maxLength={8}
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val);
                        setForgotError("");
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                        <InputOTPSlot index={6} />
                        <InputOTPSlot index={7} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <button
                    type="button"
                    disabled={(otpCode.length !== 6 && otpCode.length !== 8) || forgotLoading}
                    onClick={async () => {
                      setForgotLoading(true);
                      setForgotError("");
                      setForgotSuccess("");

                      try {
                        if (hasSupabaseConfig() && supabase) {
                          // Verifikasi OTP di Supabase
                          const { error: verifyErr } = await supabase.auth.verifyOtp({
                            email: forgotEmail.trim(),
                            token: otpCode,
                            type: "recovery",
                          });
                          if (verifyErr) throw verifyErr;
                          
                          setForgotSuccess("OTP berhasil diverifikasi! Masukkan kata sandi baru Anda.");
                          setStep(3);
                        } else {
                          // Verifikasi OTP Lokal
                          if (otpCode === generatedOtp) {
                            setForgotSuccess("OTP cocok! Silakan buat kata sandi baru.");
                            setStep(3);
                          } else {
                            setForgotError("Kode OTP salah atau tidak cocok. Cek kembali kode Anda.");
                          }
                        }
                      } catch (err) {
                        setForgotError(err instanceof Error ? err.message : "Terjadi kesalahan saat memverifikasi OTP.");
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full bg-[#131b2e] dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1c2742] dark:hover:bg-slate-600 transition duration-200 shadow-sm active:scale-98 disabled:opacity-60"
                  >
                    {forgotLoading ? "Memproses..." : "Verifikasi OTP"}
                  </button>

                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline mt-2"
                    onClick={() => {
                      setStep(1);
                      setOtpCode("");
                      setForgotError("");
                      setForgotSuccess("");
                    }}
                  >
                    Kembali ke Input Email
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Silakan masukkan kata sandi baru Anda. Gunakan minimal 6 karakter.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPw ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setForgotError("");
                        }}
                        className={`${inputCls} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPw((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      >
                        {showNewPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={newPassword.length < 6 || forgotLoading}
                    onClick={async () => {
                      setForgotLoading(true);
                      setForgotError("");
                      setForgotSuccess("");

                      try {
                        if (hasSupabaseConfig() && supabase) {
                          // Ubah password di Supabase (setelah berhasil login lewat verifyOtp)
                          const { error: updateErr } = await supabase.auth.updateUser({
                            password: newPassword,
                          });
                          if (updateErr) throw updateErr;

                          // Keluar dari Supabase agar pengguna wajib login ulang
                          await supabase.auth.signOut();

                          setForgotSuccess("Kata sandi berhasil diperbarui! Silakan masuk kembali dengan kata sandi baru.");
                          
                          setTimeout(() => {
                            handleCloseForgotModal();
                          }, 3000);
                        } else {
                          // Ubah password Lokal
                          updateLocalPassword(forgotEmail.trim(), newPassword);
                          setForgotSuccess("Kata sandi berhasil diubah! Silakan masuk kembali dengan kata sandi baru.");
                          setTimeout(() => {
                            handleCloseForgotModal();
                          }, 2500);
                        }
                      } catch (err) {
                        setForgotError(err instanceof Error ? err.message : "Gagal memperbarui kata sandi.");
                      } finally {
                        setForgotLoading(false);
                      }
                    }}
                    className="w-full bg-[#131b2e] dark:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[#1c2742] dark:hover:bg-slate-600 transition duration-200 shadow-sm active:scale-98 disabled:opacity-60"
                  >
                    {forgotLoading ? "Memproses..." : "Simpan Kata Sandi Baru"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
