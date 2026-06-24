"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle2,
  Mail,
  Calendar,
  Building2,
  Loader2,
  AlertTriangle,
  X,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  suspended: boolean;
  suspendedAt: string | null;
  suspendedReason: string | null;
  createdAt: string;
  updatedAt: string;
  workspaces: Array<{
    role: string;
    workspace: { id: string; name: string; slug: string };
  }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [currentUser, setCurrentUser] = useState<string>("");

  useEffect(() => {
    fetchUsers();
    // Get current user ID
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user?.id || ""));
  }, []);

  async function fetchUsers() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else if (res.status === 403) {
        toast.error("Akses ditolak. Hanya super admin yang dapat mengakses halaman ini.");
      }
    } catch {
      toast.error("Gagal memuat data users");
    } finally {
      setLoading(false);
    }
  }

  async function handleSuspend(targetUserId: string) {
    setActionLoading(targetUserId);
    try {
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          action: "suspend",
          reason: suspendReason || undefined,
        }),
      });

      if (res.ok) {
        toast.success("User berhasil di-suspend");
        setShowSuspendModal(null);
        setSuspendReason("");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal suspend user");
      }
    } catch {
      toast.error("Gagal suspend user");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnsuspend(targetUserId: string) {
    setActionLoading(targetUserId);
    try {
      const res = await fetch("/api/admin/users/suspend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId,
          action: "unsuspend",
        }),
      });

      if (res.ok) {
        toast.success("User berhasil di-unsuspend");
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal unsuspend user");
      }
    } catch {
      toast.error("Gagal unsuspend user");
    } finally {
      setActionLoading(null);
    }
  }

  const filteredUsers = users;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kelola Users</h1>
              <p className="text-sm text-muted-foreground">
                Super admin panel — manage all users across workspaces
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari by email atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              className="w-full pl-9 pr-4 h-10 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setTimeout(fetchUsers, 0);
            }}
            className="h-10 px-3 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Semua Status</option>
            <option value="superadmin">Super Admin</option>
            <option value="suspended">Suspended</option>
          </select>
          <button
            onClick={fetchUsers}
            className="h-10 px-4 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">{users.length}</div>
            <div className="text-xs text-muted-foreground">Total Users</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-primary">
              {users.filter((u) => u.isSuperAdmin).length}
            </div>
            <div className="text-xs text-muted-foreground">Super Admin</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-destructive">
              {users.filter((u) => u.suspended).length}
            </div>
            <div className="text-xs text-muted-foreground">Suspended</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-success">
              {users.filter((u) => !u.suspended).length}
            </div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada user ditemukan</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Workspace</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors ${
                        user.suspended ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {user.name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">
                              {user.name || "No name"}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                            <Shield className="h-3 w-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.workspaces.length > 0 ? (
                          <div className="space-y-0.5">
                            {user.workspaces.map((ws, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                <span className="text-foreground">{ws.workspace.name}</span>
                                <span className="text-muted-foreground">({ws.role})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No workspace</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.suspended ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                              <Ban className="h-3 w-3" />
                              Suspended
                            </span>
                            {user.suspendedReason && (
                              <div className="text-[10px] text-muted-foreground mt-1 max-w-[200px] truncate">
                                {user.suspendedReason}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user.id !== currentUser && !user.isSuperAdmin && (
                          <div className="flex items-center justify-end gap-1">
                            {user.suspended ? (
                              <button
                                onClick={() => handleUnsuspend(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 rounded-md transition-colors disabled:opacity-50"
                              >
                                {actionLoading === user.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowSuspendModal(user.id)}
                                disabled={actionLoading === user.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors disabled:opacity-50"
                              >
                                <Ban className="h-3 w-3" />
                                Suspend
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Suspend User</h3>
                <p className="text-xs text-muted-foreground">
                  User tidak akan bisa login setelah di-suspend
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Alasan (opsional)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Alasan suspend user..."
                className="w-full px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none h-20"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSuspendModal(null);
                  setSuspendReason("");
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleSuspend(showSuspendModal)}
                disabled={actionLoading === showSuspendModal}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === showSuspendModal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Suspend User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
