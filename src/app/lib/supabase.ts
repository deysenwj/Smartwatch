import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";
import type { User, Report, Notification } from "./storage";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type AppRole = "admin" | "user";

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function resolveUserRole(
  userId: string,
  metadataRole?: string,
): Promise<AppRole> {
  if (metadataRole === "admin") return "admin";

  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (data?.role === "admin") return "admin";
  }

  return "user";
}

export function toAppUser(
  user: SupabaseUser,
  password: string,
  role: AppRole,
  profileData?: any,
): User {
  return {
    id: user.id,
    name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "",
    email: user.email || "",
    phone: profileData?.phone || user.user_metadata?.phone || "",
    password,
    role,
    createdAt: user.created_at || new Date().toISOString(),
    avatarUrl: profileData?.avatar_url || user.user_metadata?.avatar_url || "",
    pushNotif: profileData?.push_notif !== undefined ? profileData.push_notif : false,
  };
}

async function signInRawWithSupabase(email: string, password: string) {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.",
    );

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithSupabase(email: string, password: string): Promise<User> {
  const data = await signInRawWithSupabase(email, password);
  const user = data.user;
  if (!user) throw new Error("Login gagal. Periksa email dan kata sandi Anda.");

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) {
      await signOutWithSupabase();
      throw new Error("Akun Anda telah dinonaktifkan atau dihapus oleh Administrator.");
    }
    const role = profile.role as AppRole;
    return toAppUser(user, password, role, profile);
  }

  const role = await resolveUserRole(user.id, user.user_metadata?.role);
  return toAppUser(user, password, role);
}

export async function signInUserWithSupabase(email: string, password: string) {
  const data = await signInRawWithSupabase(email, password);
  const user = data.user;
  if (!user) throw new Error("Login gagal. Periksa email dan kata sandi Anda.");

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) {
      await signOutWithSupabase();
      throw new Error("Akun Anda telah dinonaktifkan atau dihapus oleh Administrator.");
    }
    const role = profile.role as AppRole;
    if (role === "admin") {
      await signOutWithSupabase();
      throw new Error("Akun admin harus masuk melalui halaman Masuk Admin.");
    }
    return toAppUser(user, password, role, profile);
  }

  const role = await resolveUserRole(user.id, user.user_metadata?.role);
  if (role === "admin") {
    await signOutWithSupabase();
    throw new Error("Akun admin harus masuk melalui halaman Masuk Admin.");
  }

  return toAppUser(user, password, "user");
}

export async function signInAdminWithSupabase(email: string, password: string) {
  const data = await signInRawWithSupabase(email, password);
  const user = data.user;
  if (!user) throw new Error("Login gagal. Periksa email dan kata sandi Anda.");

  if (supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) {
      await signOutWithSupabase();
      throw new Error("Akun Anda telah dinonaktifkan atau dihapus oleh Administrator.");
    }
    const role = profile.role as AppRole;
    if (role !== "admin") {
      await signOutWithSupabase();
      throw new Error(
        "Akun ini tidak memiliki akses admin. Daftarkan admin di Supabase atau gunakan halaman masuk pengguna.",
      );
    }
    return toAppUser(user, password, role, profile);
  }

  const role = await resolveUserRole(user.id, user.user_metadata?.role);
  if (role !== "admin") {
    await signOutWithSupabase();
    throw new Error(
      "Akun ini tidak memiliki akses admin. Daftarkan admin di Supabase atau gunakan halaman masuk pengguna.",
    );
  }

  return toAppUser(user, password, "admin");
}

export async function signUpWithSupabase(
  email: string,
  password: string,
  options?: { full_name?: string; phone?: string },
) {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.",
    );

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options?.full_name ?? "",
          phone: options?.phone ?? "",
          role: "user",
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    const errMsg = err?.message || "";
    if (
      errMsg.toLowerCase().includes("already registered") ||
      errMsg.toLowerCase().includes("already exists") ||
      errMsg.toLowerCase().includes("registered")
    ) {
      try {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError || !signInData.user) {
          throw err;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", signInData.user.id)
          .maybeSingle();

        if (!profile) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: signInData.user.id,
                email,
                full_name: options?.full_name ?? "",
                phone: options?.phone ?? "",
                role: "user",
              },
            ]);
          if (insertError) throw insertError;

          await supabase.auth.signOut();
          return { user: signInData.user };
        } else {
          await supabase.auth.signOut();
          throw err;
        }
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
}

export async function signUpAdminWithSupabase(
  email: string,
  password: string,
  options?: { full_name?: string; phone?: string },
) {
  if (!supabase)
    throw new Error(
      "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.",
    );

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options?.full_name ?? "Admin Smartwatch",
          phone: options?.phone ?? "",
          role: "admin",
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    const errMsg = err?.message || "";
    if (
      errMsg.toLowerCase().includes("already registered") ||
      errMsg.toLowerCase().includes("already exists") ||
      errMsg.toLowerCase().includes("registered")
    ) {
      try {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });
        if (signInError || !signInData.user) {
          throw err;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", signInData.user.id)
          .maybeSingle();

        if (!profile) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert([
              {
                id: signInData.user.id,
                email,
                full_name: options?.full_name ?? "Admin Smartwatch",
                phone: options?.phone ?? "",
                role: "admin",
              },
            ]);
          if (insertError) throw insertError;

          await supabase.auth.signOut();
          return { user: signInData.user };
        } else {
          await supabase.auth.signOut();
          throw err;
        }
      } catch (innerErr) {
        throw err;
      }
    }
    throw err;
  }
}

export async function signOutWithSupabase() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

// ── Supabase Database Operations ───────────────────────────────────────────

export async function getSupabaseUsers(): Promise<User[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.full_name || "",
    email: p.email || "",
    phone: p.phone || "",
    password: "", // Password is secure in Supabase Auth, not in profiles
    role: (p.role as AppRole) || "user",
    createdAt: p.created_at || new Date().toISOString(),
  }));
}

export async function getSupabaseReports(): Promise<Report[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone
      )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      judul: r.title,
      kategori: r.category,
      deskripsi: r.description,
      lokasi: r.location,
      tanggalKejadian: r.incident_date,
      tanggalDibuat: r.created_at,
      status: (r.status as Report["status"]) || "Menunggu",
      userId: profile?.email || r.user_id,
      userUUID: r.user_id,
      userName: profile?.full_name || "Pengguna Supabase",
      buktiUrl: r.bukti_url,
      buktiName: r.bukti_name,
      catatan: r.catatan || [],
    };
  });
}

export async function getSupabaseUserReports(userUUID: string): Promise<Report[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      profiles (
        full_name,
        email,
        phone
      )
    `)
    .eq("user_id", userUUID)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    return {
      id: r.id,
      judul: r.title,
      kategori: r.category,
      deskripsi: r.description,
      lokasi: r.location,
      tanggalKejadian: r.incident_date,
      tanggalDibuat: r.created_at,
      status: (r.status as Report["status"]) || "Menunggu",
      userId: profile?.email || r.user_id,
      userUUID: r.user_id,
      userName: profile?.full_name || "Pengguna Supabase",
      buktiUrl: r.bukti_url,
      buktiName: r.bukti_name,
      catatan: r.catatan || [],
    };
  });
}

export async function addSupabaseReport(report: {
  title: string;
  category: string;
  description: string;
  location: string;
  incident_date: string;
  status: string;
  user_id: string;
  bukti_url?: string;
  bukti_name?: string;
}): Promise<Report> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("reports")
    .insert([report])
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .single();
  if (error) throw error;

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    id: data.id,
    judul: data.title,
    kategori: data.category,
    deskripsi: data.description,
    lokasi: data.location,
    tanggalKejadian: data.incident_date,
    tanggalDibuat: data.created_at,
    status: (data.status as Report["status"]) || "Menunggu",
    userId: profile?.email || data.user_id,
    userUUID: data.user_id,
    userName: profile?.full_name || "Pengguna Supabase",
    buktiUrl: data.bukti_url,
    buktiName: data.bukti_name,
    catatan: data.catatan || [],
  };
}

export async function updateSupabaseReport(
  id: string,
  patch: Partial<Report>,
): Promise<Report | null> {
  if (!supabase) throw new Error("Supabase not configured");

  const dbPatch: any = {};
  if (patch.judul !== undefined) dbPatch.title = patch.judul;
  if (patch.kategori !== undefined) dbPatch.category = patch.kategori;
  if (patch.deskripsi !== undefined) dbPatch.description = patch.deskripsi;
  if (patch.lokasi !== undefined) dbPatch.location = patch.lokasi;
  if (patch.tanggalKejadian !== undefined)
    dbPatch.incident_date = patch.tanggalKejadian;
  if (patch.status !== undefined) dbPatch.status = patch.status;
  if (patch.catatan !== undefined) dbPatch.catatan = patch.catatan;
  if (patch.buktiUrl !== undefined) dbPatch.bukti_url = patch.buktiUrl;
  if (patch.buktiName !== undefined) dbPatch.bukti_name = patch.buktiName;

  const { data, error } = await supabase
    .from("reports")
    .update(dbPatch)
    .eq("id", id)
    .select(`
      *,
      profiles (
        full_name,
        email
      )
    `)
    .single();
  if (error) throw error;
  if (!data) return null;

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
  return {
    id: data.id,
    judul: data.title,
    kategori: data.category,
    deskripsi: data.description,
    lokasi: data.location,
    tanggalKejadian: data.incident_date,
    tanggalDibuat: data.created_at,
    status: (data.status as Report["status"]) || "Menunggu",
    userId: profile?.email || data.user_id,
    userUUID: data.user_id,
    userName: profile?.full_name || "Pengguna Supabase",
    buktiUrl: data.bukti_url,
    buktiName: data.bukti_name,
    catatan: data.catatan || [],
  };
}

export async function uploadSupabaseFile(
  file: File,
): Promise<{ url: string; name: string }> {
  if (!supabase) throw new Error("Supabase not configured");
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from("bukti-laporan")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("bukti-laporan")
    .getPublicUrl(filePath);

  return {
    url: publicUrlData.publicUrl,
    name: file.name,
  };
}

export async function deleteSupabaseReport(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteSupabaseUser(userUUID: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  
  // 1. Delete notifications of user
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userUUID);

  // 2. Delete reports of user
  const { error: reportsError } = await supabase
    .from("reports")
    .delete()
    .eq("user_id", userUUID);
  if (reportsError) throw reportsError;

  // 3. Delete profile
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userUUID);
  if (profileError) throw profileError;
}

export async function getSupabaseNotifications(
  userUUID: string,
): Promise<Notification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userUUID)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map((n: any) => ({
    id: n.id,
    text: n.text,
    time: n.created_at,
    read: n.read,
    type: (n.type as Notification["type"]) || "info",
  }));
}

export async function addSupabaseNotification(
  userUUID: string,
  text: string,
  type: Notification["type"] = "info",
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("notifications")
    .insert([{ user_id: userUUID, text, type, read: false }]);
  if (error) throw error;
}

export async function markAllSupabaseNotificationsRead(
  userUUID: string,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userUUID);
  if (error) throw error;
}

export async function clearSupabaseNotifications(
  userUUID: string,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userUUID);
  if (error) throw error;
}

export async function updateSupabaseProfile(
  userId: string,
  patch: {
    name?: string;
    phone?: string;
    avatarUrl?: string;
    pushNotif?: boolean;
  }
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");

  const dbPatch: any = {};
  if (patch.name !== undefined) dbPatch.full_name = patch.name;
  if (patch.phone !== undefined) dbPatch.phone = patch.phone;
  if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
  if (patch.pushNotif !== undefined) dbPatch.push_notif = patch.pushNotif;

  const { error } = await supabase
    .from("profiles")
    .update(dbPatch)
    .eq("id", userId);

  if (error) throw error;

  // Also update Supabase auth metadata for compatibility
  const authMeta: any = {};
  if (patch.name !== undefined) authMeta.full_name = patch.name;
  if (patch.phone !== undefined) authMeta.phone = patch.phone;
  if (patch.avatarUrl !== undefined) authMeta.avatar_url = patch.avatarUrl;

  if (Object.keys(authMeta).length > 0) {
    try {
      await supabase.auth.updateUser({
        data: authMeta
      });
    } catch (authErr) {
      console.warn("Gagal memperbarui metadata auth Supabase:", authErr);
    }
  }
}

export async function updateSupabasePassword(password: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function uploadSupabaseAvatar(file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
