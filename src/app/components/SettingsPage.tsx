import { useState, useEffect } from "react";
import { User, Lock, Bell, Smartphone, ChevronRight, AlertTriangle, LogOut, CheckCircle, Eye, EyeOff, Camera } from "lucide-react";
import { getSettings, saveSettings, updateUserProfile, type User as UserType } from "../lib/storage";
import { hasSupabaseConfig, updateSupabaseProfile, updateSupabasePassword, uploadSupabaseAvatar } from "../lib/supabase";

interface Props {
  user: UserType;
  onLogout: () => void;
  onSaved: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500/20
        ${checked ? "bg-indigo-650" : "bg-slate-300 dark:bg-slate-600"}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">{label}</h2>
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

const inputCls = "w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 transition disabled:opacity-50 disabled:cursor-not-allowed";
const cardCls  = "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-6";

export function SettingsPage({ user, onLogout, onSaved }: Props) {
  const isAdmin = user.role === "admin";
  const [name,       setName]      = useState(user.name);
  const [phone,      setPhone]     = useState(user.phone);
  const [pwOld,      setPwOld]     = useState("");
  const [pwNew,      setPwNew]     = useState("");
  const [pwConfirm,  setPwConfirm] = useState("");
  const [showPwOld,  setShowPwOld] = useState(false);
  const [showPwNew,  setShowPwNew] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl,  setAvatarUrl]  = useState(user.avatarUrl || "");

  const [settings,   setSettings]  = useState(() => {
    const local = getSettings(user.email);
    return {
      pushNotif: user.pushNotif !== undefined ? user.pushNotif : local.pushNotif,
    };
  });
  const [toast,      setToast]     = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [savingPro,  setSavingPro] = useState(false);
  const [savingPw,   setSavingPw]  = useState(false);

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
    setAvatarUrl(user.avatarUrl || "");
    setSettings({
      pushNotif: user.pushNotif ?? false,
    });
  }, [user]);

  function showMsg(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { showMsg("Nama tidak boleh kosong.", "error"); return; }
    setSavingPro(true);
    
    try {
      let finalAvatarUrl = avatarUrl;

      // 1. Upload avatar if selected
      if (avatarFile) {
        if (hasSupabaseConfig()) {
          finalAvatarUrl = await uploadSupabaseAvatar(avatarFile);
        } else {
          // Convert to Base64 for local mode
          finalAvatarUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Gagal membaca file gambar"));
            reader.readAsDataURL(avatarFile);
          });
        }
      }

      // 2. Save to Supabase if active
      if (hasSupabaseConfig()) {
        await updateSupabaseProfile(user.id || "", {
          name: name.trim(),
          phone: phone.trim(),
          avatarUrl: finalAvatarUrl,
          pushNotif: settings.pushNotif,
        });
      }

      // 3. Save locally for compatibility
      updateUserProfile(user.email, {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: finalAvatarUrl,
        pushNotif: settings.pushNotif,
      });

      // Update local settings helper
      saveSettings(user.email, settings);

      onSaved();
      setAvatarFile(null);
      showMsg("Profil dan preferensi berhasil disimpan.");
    } catch (err: any) {
      console.error(err);
      showMsg(err.message || "Gagal menyimpan profil.", "error");
    } finally {
      setSavingPro(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwOld)                      { showMsg("Kata sandi lama wajib diisi.", "error"); return; }
    
    // Bypass local password verification if Supabase is active
    if (!hasSupabaseConfig() && pwOld !== user.password) {
      showMsg("Kata sandi lama salah.", "error");
      return;
    }

    if (!pwNew)                      { showMsg("Kata sandi baru wajib diisi.", "error"); return; }
    if (pwNew.length < 6)            { showMsg("Kata sandi baru minimal 6 karakter.", "error"); return; }
    if (pwNew !== pwConfirm)         { showMsg("Konfirmasi kata sandi tidak cocok.", "error"); return; }
    
    setSavingPw(true);
    try {
      if (hasSupabaseConfig()) {
        await updateSupabasePassword(pwNew);
      }
      
      updateUserProfile(user.email, { password: pwNew });
      setPwOld("");
      setPwNew("");
      setPwConfirm("");
      showMsg("Kata sandi berhasil diubah.");
    } catch (err: any) {
      console.error(err);
      showMsg(err.message || "Gagal mengubah kata sandi.", "error");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl space-y-4 md:space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Akun</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Kelola informasi profil dan preferensi Anda</p>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold border transition
          ${toast.type === "success"
            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
            : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
          }`}>
          {toast.type === "success"
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertTriangle className="w-4 h-4 shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* ── Profile ── */}
      <form onSubmit={handleSaveProfile} className={cardCls}>
        <SectionHeader icon={User} label="Profil" />

        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-slate-700">
          <div className="relative group w-16 h-16 shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-16 h-16 bg-slate-900 dark:bg-slate-700 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-slate-200 dark:border-slate-700">
                {initials(user.name)}
              </div>
            )}
            <input
              type="file"
              id="avatarInput"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const selected = e.target.files[0];
                  if (selected.size > 5 * 1024 * 1024) {
                    showMsg("Ukuran file maksimal 5 MB.", "error");
                    return;
                  }
                  setAvatarFile(selected);
                  setAvatarUrl(URL.createObjectURL(selected));
                }
              }}
            />
            <button
              type="button"
              onClick={() => document.getElementById("avatarInput")?.click()}
              className="absolute inset-0 bg-black/60 backdrop-blur-[2px] text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <Camera className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] font-semibold">Ubah</span>
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold rounded">
              {user.role === "admin" ? "Administrator" : "Pengguna"}
            </span>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} disabled={isAdmin} />
            {isAdmin && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Akun admin dikunci (didaftarkan dari Supabase)</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nomor Telepon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+62 812-xxxx-xxxx" className={inputCls} disabled={isAdmin} />
            {isAdmin && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Akun admin dikunci (didaftarkan dari Supabase)</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input type="email" value={user.email} disabled className={inputCls} />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Email tidak dapat diubah</p>
          </div>
        </div>

        {/* Notification toggles */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-5 mt-5">
          <SectionHeader icon={Bell} label="Notifikasi" />
          <div className="space-y-2">
            <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="min-w-0 mr-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Push Notification</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Notifikasi langsung di browser</p>
              </div>
              <Toggle
                checked={settings.pushNotif}
                onChange={() => setSettings(s => ({ ...s, pushNotif: !s.pushNotif }))}
                label="Push Notification"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-5">
          <button type="submit" disabled={savingPro}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60">
            {savingPro ? "Menyimpan…" : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {/* ── Security ── */}
      {!isAdmin && (
        <div className={cardCls}>
          <SectionHeader icon={Lock} label="Keamanan" />

          <form onSubmit={handleChangePassword} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 -mt-1">Ubah kata sandi akun Anda. Minimal 6 karakter.</p>

            {/* Old password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Lama</label>
              <div className="relative">
                <input
                  type={showPwOld ? "text" : "password"}
                  placeholder="Masukkan kata sandi lama"
                  value={pwOld}
                  onChange={e => setPwOld(e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPwOld(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  {showPwOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Kata Sandi Baru</label>
              <div className="relative">
                <input
                  type={showPwNew ? "text" : "password"}
                  placeholder="Minimal 6 karakter"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  className={`${inputCls} pr-10`}
                />
                <button type="button" onClick={() => setShowPwNew(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300">
                  {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Konfirmasi Kata Sandi Baru</label>
              <input
                type="password"
                placeholder="Ulangi kata sandi baru"
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
                className={`${inputCls} ${pwConfirm && pwNew && pwConfirm !== pwNew ? "border-red-400 dark:border-red-600 focus:ring-red-400" : ""}`}
              />
              {pwConfirm && pwNew && pwConfirm !== pwNew && (
                <p className="text-xs text-red-500 mt-1">Konfirmasi tidak cocok</p>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={savingPw}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-600 transition disabled:opacity-60">
                <ChevronRight className="w-4 h-4" />
                {savingPw ? "Mengubah…" : "Ubah Kata Sandi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Danger zone ── */}
      <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/60 rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h2 className="text-sm md:text-base font-bold text-red-700 dark:text-red-400">Zona Berbahaya</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Keluar dari sesi aktif saat ini. Anda harus masuk kembali untuk mengakses akun.
        </p>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition"
        >
          <LogOut className="w-4 h-4" /> Keluar dari Akun
        </button>
      </div>
    </div>
  );
}
