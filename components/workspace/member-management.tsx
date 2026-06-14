"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Trash2,
  Shield,
  ChevronDown,
  Loader2,
  Mail,
  Users,
  Search,
  LogOut,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import InviteDialog from "./invite-dialog";
import InvitationList from "./invitation-list";

interface MemberUser {
  id: string;
  name: string | null;
  email: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: MemberUser;
}

const ROLES = ["admin", "editor", "viewer"] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Kontrol penuh — dapat mengelola billing, menghapus workspace, mentransfer kepemilikan",
  admin: "Dapat mengelola anggota, pengaturan, dan dokumen",
  editor: "Dapat membuat, mengedit, dan menghapus dokumen",
  viewer: "Dapat melihat dokumen dan chat",
};

function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-900/50 dark:text-purple-300",
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    editor: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    viewer: "bg-muted text-muted-foreground",
  };
  return classes[role] ?? "bg-muted text-muted-foreground";
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

export default function MemberManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [invitationRefreshKey, setInvitationRefreshKey] = useState(0);

  // Search
  const [search, setSearch] = useState("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  // Role change
  const [changingRole, setChangingRole] = useState<string | null>(null);

  // Confirm dialogs
  const [confirmRemove, setConfirmRemove] = useState<{ open: boolean; memberId: string; memberName: string }>({ open: false, memberId: "", memberName: "" });
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // aria-live
  const [liveMessage, setLiveMessage] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.currentUserId ?? "");
        setCurrentUserRole(data.currentUserRole ?? "");
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchMembers(), fetchCurrentUser()]);
      setLoading(false);
    }
    init();
  }, [fetchMembers, fetchCurrentUser]);

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Masukkan email");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengundang");
      toast.success("Anggota ditambahkan ke workspace");
      setLiveMessage(`Anggota ${inviteEmail} ditambahkan`);
      setInviteEmail("");
      setInviteRole("viewer");
      await fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengundang");
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    setChangingRole(memberId);
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role");
      toast.success("Role berhasil diubah");
      setLiveMessage(`Role diubah ke ${newRole}`);
      await fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah role");
    } finally {
      setChangingRole(null);
    }
  }

  async function handleRemove() {
    const { memberId } = confirmRemove;
    setRemoving(true);
    try {
      const res = await fetch(`/api/workspace/members/${memberId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus anggota");
      toast.success("Anggota berhasil dihapus");
      setLiveMessage(`Anggota ${confirmRemove.memberName} dihapus dari workspace`);
      setConfirmRemove({ open: false, memberId: "", memberName: "" });
      await fetchMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus anggota");
    } finally {
      setRemoving(false);
    }
  }

  async function handleLeave() {
    setLeaving(true);
    try {
      const res = await fetch("/api/workspace/leave", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal keluar dari workspace");
      toast.success("Berhasil keluar dari workspace");
      setLiveMessage("Anda telah keluar dari workspace");
      setConfirmLeave(false);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal keluar dari workspace");
    } finally {
      setLeaving(false);
    }
  }

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.user.name?.toLowerCase().includes(q) ||
      m.user.email.toLowerCase().includes(q) ||
      m.role.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Skip to content */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Lewati ke konten
      </a>

      {/* aria-live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{liveMessage}</div>

      <div id="main-content" className="space-y-6" tabIndex={-1}>
        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("members")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "members"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="size-4" />
            Anggota
            <span className="text-xs text-muted-foreground">({members.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invitations")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === "invitations"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="size-4" />
            Undangan
          </button>
        </div>

        {activeTab === "members" ? (
          <>
            {/* Quick Add */}
            {canManage && (
              <div className="bg-card rounded-xl border border-border/20 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserPlus className="size-5" />
                  Tambah Anggota
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {inviting ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                    Tambah
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Untuk pengguna yang sudah memiliki akun MimoNotes
                </p>
              </div>
            )}

            {/* Member Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari anggota berdasarkan nama, email, atau role..."
                className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>

            {/* Members Table */}
            <div className="bg-card rounded-xl border border-border/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-border/20">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Shield className="size-5" />
                  Anggota Workspace
                  <span className="text-sm font-normal text-muted-foreground">
                    ({filteredMembers.length}{search ? ` dari ${members.length}` : ""})
                  </span>
                </h3>
              </div>

              {filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Users className="size-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {search ? "Tidak ada anggota yang cocok" : "Belum ada anggota"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {search ? "Coba kata kunci lain" : "Undang anggota pertama ke workspace ini"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/20">
                  {filteredMembers.map((member) => {
                    const memberIsOwner = member.role === "owner";
                    const isSelf = member.userId === currentUserId || member.user.email === currentUserId;
                    const canEdit = canManage && !memberIsOwner;

                    return (
                      <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                          {getInitials(member.user.name, member.user.email)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.user.name || "Unnamed"}
                            {isSelf && <span className="text-xs text-muted-foreground ml-1">(Anda)</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                        </div>

                        {/* Role with tooltip */}
                        {canEdit && !memberIsOwner ? (
                          <div className="relative group">
                            <select
                              value={member.role}
                              onChange={(e) => handleChangeRole(member.id, e.target.value)}
                              disabled={changingRole === member.id}
                              className={`appearance-none pl-3 pr-8 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-primary ${getRoleBadgeClass(member.role)}`}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none opacity-50" />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                              {ROLE_DESCRIPTIONS[member.role]}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative group">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                              {ROLE_DESCRIPTIONS[member.role]}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        {canEdit && !memberIsOwner ? (
                          <button
                            type="button"
                            onClick={() => setConfirmRemove({ open: true, memberId: member.id, memberName: member.user.name || member.user.email })}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Hapus anggota"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : (
                          <div className="w-8" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leave Workspace (non-owners only) */}
            {!isOwner && (
              <div className="bg-card rounded-xl border border-border/20 p-4">
                <button
                  type="button"
                  onClick={() => setConfirmLeave(true)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="size-4" />
                  Keluar dari workspace ini
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {canManage && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setInviteDialogOpen(true)}
                  className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Mail className="size-4" />
                  Undang via Token
                </button>
              </div>
            )}
            <InvitationList refreshKey={invitationRefreshKey} />
          </>
        )}

        {/* Invite Dialog */}
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          onInvited={() => setInvitationRefreshKey((k) => k + 1)}
        />

        {/* Confirm Remove Dialog */}
        <Dialog open={confirmRemove.open} onOpenChange={(open) => !open && setConfirmRemove({ open: false, memberId: "", memberName: "" })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hapus Anggota</DialogTitle>
              <DialogDescription>
                Hapus <strong>{confirmRemove.memberName}</strong> dari workspace? Anggota ini akan kehilangan akses ke semua dokumen dan chat di workspace ini.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => setConfirmRemove({ open: false, memberId: "", memberName: "" })}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {removing && <Loader2 className="size-4 animate-spin" />}
                Hapus
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Leave Dialog */}
        <Dialog open={confirmLeave} onOpenChange={(open) => !open && setConfirmLeave(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Keluar dari Workspace</DialogTitle>
              <DialogDescription>
                Anda akan kehilangan akses ke semua dokumen dan chat di workspace ini. Untuk bergabung kembali, Anda perlu diundang ulang.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end mt-4">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleLeave}
                disabled={leaving}
                className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {leaving && <Loader2 className="size-4 animate-spin" />}
                Keluar
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
