"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { Icon } from "../icon";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function FamilyView() {
  const [workspaceData, setWorkspaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);

  async function loadFamily() {
    setLoading(true);
    try {
      const res = await fetch("/api/family");
      if (res.ok) {
        const json = await res.json();
        setWorkspaceData(json);
      }
    } catch {
      toast.error("Failed to load family workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFamily();
  }, []);

  async function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          workspaceId: workspaceData.workspace.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");

      toast.success(`Invitation created for ${inviteEmail}!`);
      setInviteEmail("");
      setInviteOpen(false);
      loadFamily();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleRevokeMember(memberId: string, memberEmail: string) {
    if (!confirm(`Revoke family access for ${memberEmail}?`)) return;

    try {
      const res = await fetch(`/api/family?memberId=${memberId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Member access revoked");
        loadFamily();
      } else {
        toast.error("Failed to revoke member");
      }
    } catch {
      toast.error("Error revoking access");
    }
  }

  const workspace = workspaceData?.workspace;
  const members = workspace?.members || [];
  const resources = workspace?.resources || [];
  const isOwner = workspaceData?.isOwner;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-sm">
              <Icon name="Users" className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{workspace?.name || "Family Circle & Vault"}</h1>
              <p className="text-sm text-muted-foreground">
                Permission-based family sharing. Your personal vault remains private unless explicitly shared.
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-95"
          >
            <Icon name="UserPlus" className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-500">
            <Icon name="ShieldCheck" className="h-4 w-4" />
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">Strict Privacy & Authorization Guarantee</div>
            <p>
              Family members never gain blanket access to your personal documents, medical records, or finances. 
              Only documents, emergency plans, or family calendar events explicitly added to the Shared Resources list are visible.
            </p>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold tracking-tight text-foreground">Family Circle Members ({members.length})</h2>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/40 bg-muted/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member: any) => {
              const roleColor =
                member.role === "owner"
                  ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                  : member.role === "admin"
                  ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                  : member.role === "contributor"
                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "bg-muted text-muted-foreground";

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500/10 font-bold text-pink-600">
                        {member.user?.name?.[0] || member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {member.user?.name || member.email.split("@")[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>

                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold capitalize", roleColor)}>
                      {member.role}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                    <span className="text-muted-foreground">
                      Status:{" "}
                      <span className={cn("font-medium", member.status === "active" ? "text-emerald-600" : "text-amber-600")}>
                        {member.status === "active" ? "Active" : "Invitation Pending"}
                      </span>
                    </span>

                    {isOwner && member.role !== "owner" && (
                      <button
                        onClick={() => handleRevokeMember(member.id, member.email)}
                        className="text-muted-foreground hover:text-rose-600 hover:underline"
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Shared Resources section */}
      <div className="space-y-3 pt-2">
        <h2 className="text-base font-bold tracking-tight text-foreground">
          Shared Family Resources ({resources.length})
        </h2>

        {resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center text-xs text-muted-foreground">
            No items currently shared. You can share emergency contacts, travel itineraries, or home deeds from their respective cards.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {resources.map((res: any) => (
              <div key={res.id} className="rounded-2xl border border-border/60 bg-card p-3 text-xs">
                <span className="font-semibold text-foreground">{res.resourceType}</span>
                <span className="ml-2 text-muted-foreground">{res.resourceId}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="UserPlus" className="h-5 w-5 text-pink-600" />
              Invite Family Member
            </DialogTitle>
            <DialogDescription>
              Grant scoped access to shared family documents and milestones.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Family Member Email</label>
              <input
                type="email"
                required
                placeholder="spouse@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Access Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/80 bg-background px-3 py-2 text-sm outline-none focus:border-pink-500"
              >
                <option value="viewer">Read-only Viewer (Can view shared docs & events)</option>
                <option value="contributor">Contributor (Can add notes & upload family docs)</option>
                <option value="admin">Administrator (Can manage invites & shared items)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-xl border border-border/80 px-4 py-2 text-sm font-semibold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={inviting || !inviteEmail}
                className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {inviting ? "Sending Invite…" : "Send Invitation"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
