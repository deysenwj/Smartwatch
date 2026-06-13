// ============================================
// SMARTWATCH - SHARED FUNCTIONS
// ============================================

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem("currentUser");
  return user ? JSON.parse(user) : null;
}

// Init user info in sidebar
function initUser() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Redirect admin to admin page if trying to access user page
  if (
    user.role === "admin" &&
    !window.location.pathname.includes("admin.html")
  ) {
    // Allow admin to view all pages, but could redirect
  }

  // Redirect user trying to access admin page
  if (
    user.role !== "admin" &&
    window.location.pathname.includes("admin.html")
  ) {
    window.location.href = "login.html";
    return;
  }

  // Set user info in sidebar
  const initials = user.name ? user.name.substring(0, 2).toUpperCase() : "U";
  document.querySelectorAll("#userAvatar, #userAvatar2").forEach((el) => {
    if (el) el.textContent = initials;
  });
  document.querySelectorAll("#userName, #userName2").forEach((el) => {
    if (el) el.textContent = user.name || "User";
  });
  document.querySelectorAll("#userEmail, #userEmail2").forEach((el) => {
    if (el) el.textContent = user.email;
  });

  // Welcome name
  const welcomeEl = document.getElementById("welcomeName");
  if (welcomeEl)
    welcomeEl.textContent = user.name ? user.name.split(" ")[0] : "User";
}

// Sidebar toggle (mobile)
document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");

  if (openBtn)
    openBtn.addEventListener("click", () => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    });
  if (closeBtn)
    closeBtn.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });
  if (overlay)
    overlay.addEventListener("click", () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    });
});

// ============================================
// NOTIFICATIONS
// ============================================

function getNotifications() {
  const user = getCurrentUser();
  if (!user) return [];
  return JSON.parse(
    localStorage.getItem("notifications_" + user.email) || "[]",
  );
}

function saveNotifications(notifs) {
  const user = getCurrentUser();
  if (!user) return;
  localStorage.setItem("notifications_" + user.email, JSON.stringify(notifs));
}

function addNotification(message) {
  const user = getCurrentUser();
  if (!user) return;
  const notifs = JSON.parse(
    localStorage.getItem("notifications_" + user.email) || "[]",
  );
  notifs.unshift({
    id: Date.now(),
    message: message,
    time: new Date().toISOString(),
    read: false,
  });
  // Keep max 50
  if (notifs.length > 50) notifs.pop();
  localStorage.setItem("notifications_" + user.email, JSON.stringify(notifs));
}

function addNotificationForUser(userEmail, message) {
  const notifs = JSON.parse(
    localStorage.getItem("notifications_" + userEmail) || "[]",
  );
  notifs.unshift({
    id: Date.now(),
    message: message,
    time: new Date().toISOString(),
    read: false,
  });
  if (notifs.length > 50) notifs.pop();
  localStorage.setItem("notifications_" + userEmail, JSON.stringify(notifs));
}

function loadNotifications() {
  const notifs = getNotifications();
  const badge = document.getElementById("notifBadge");
  const list = document.getElementById("notifList");

  const unread = notifs.filter((n) => !n.read).length;
  if (badge) {
    if (unread > 0) {
      badge.classList.remove("hidden");
      badge.textContent = unread > 9 ? "9+" : unread;
    } else {
      badge.classList.add("hidden");
    }
  }

  if (list) {
    if (notifs.length === 0) {
      list.innerHTML =
        '<div class="p-8 text-center text-slate-500"><span class="material-symbols-outlined text-3xl">notifications_off</span><p class="text-sm mt-2">Tidak ada notifikasi</p></div>';
    } else {
      list.innerHTML = notifs
        .map((n) => {
          const timeAgo = getTimeAgo(n.time);
          return (
            '<div class="p-4 border-b border-slate-100 hover:bg-slate-50 ' +
            (n.read ? "opacity-60" : "") +
            '"><div class="flex gap-3"><div class="w-2 h-2 rounded-full ' +
            (n.read ? "bg-slate-300" : "bg-blue-500") +
            ' mt-2 shrink-0"></div><div class="flex-1 min-w-0"><p class="text-sm text-slate-900">' +
            n.message +
            '</p><p class="text-xs text-slate-500 mt-1">' +
            timeAgo +
            "</p></div></div></div>"
          );
        })
        .join("");
    }
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notifDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
    loadNotifications();
  }
}

function clearNotifications() {
  const notifs = getNotifications();
  notifs.forEach((n) => (n.read = true));
  saveNotifications(notifs);
  loadNotifications();
}

// Close dropdown when clicking outside
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("notifDropdown");
  const badge = document.getElementById("notifBadge");
  if (
    dropdown &&
    !dropdown.contains(e.target) &&
    !e.target.closest('[onclick*="toggleNotifications"]')
  ) {
    dropdown.classList.add("hidden");
  }
});

// ============================================
// DASHBOARD
// ============================================

function loadDashboard() {
  const user = getCurrentUser();
  if (!user) return;

  const reports = JSON.parse(localStorage.getItem("reports") || "[]").filter(
    (r) => r.userId === user.email,
  );

  document.getElementById("statTotal").textContent = reports.length;
  document.getElementById("statProses").textContent = reports.filter(
    (r) => r.status === "Diproses",
  ).length;
  document.getElementById("statSelesai").textContent = reports.filter(
    (r) => r.status === "Selesai",
  ).length;
  document.getElementById("statTolak").textContent = reports.filter(
    (r) => r.status === "Ditolak",
  ).length;

  const recent = reports.slice(0, 3);
  const container = document.getElementById("recentReports");
  const empty = document.getElementById("emptyRecent");

  if (recent.length === 0) {
    container.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  container.innerHTML = recent
    .map((r) => {
      const statusClass =
        r.status === "Selesai"
          ? "bg-green-100 text-green-700"
          : r.status === "Ditolak"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";
      return (
        '<a href="riwayat.html#' +
        r.id +
        '" class="block p-4 md:p-5 hover:bg-slate-50 transition"><div class="flex justify-between items-start gap-3 mb-2"><div class="flex-1 min-w-0"><p class="font-semibold text-slate-900 text-sm md:text-base truncate">' +
        r.id +
        " · " +
        r.judul +
        '</p><p class="text-xs text-slate-500 mt-1">' +
        formatDate(r.tanggalDibuat) +
        '</p></div><span class="px-2 py-1 md:px-3 ' +
        statusClass +
        ' text-[10px] md:text-xs font-bold rounded-full whitespace-nowrap">' +
        r.status +
        '</span></div><p class="text-xs md:text-sm text-slate-600 line-clamp-1">' +
        r.deskripsi +
        "</p></a>"
      );
    })
    .join("");
}

// ============================================
// HELPERS
// ============================================

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return (
    d.getDate() +
    " " +
    months[d.getMonth()] +
    " " +
    d.getFullYear() +
    ", " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

function getTimeAgo(iso) {
  const diff = (new Date() - new Date(iso)) / 1000;
  if (diff < 60) return "Baru saja";
  if (diff < 3600) return Math.floor(diff / 60) + " menit lalu";
  if (diff < 86400) return Math.floor(diff / 3600) + " jam lalu";
  if (diff < 604800) return Math.floor(diff / 86400) + " hari lalu";
  return formatDate(iso);
}
