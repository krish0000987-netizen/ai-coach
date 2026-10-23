"use client";

import { useState, useEffect } from "react";
import { useLifeOS } from "@/store/life-os";
import { Icon } from "../icon";
import { PageHeader, SectionCard } from "../layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { notify } from "@/lib/toast";
import QRCode from "qrcode";
import { useTheme } from "next-themes";
import { requestNotificationPermission, sendNotification } from "../notifications";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function SettingsView() {
  const { setView } = useLifeOS();
  const { theme = "system", setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<any>(null);

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qr2faUrl, setQr2faUrl] = useState("");
  const [manualEntry, setManualEntry] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // QR login from settings
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrLoginUrl, setQrLoginUrl] = useState("");
  const [qrLoginToken, setQrLoginToken] = useState("");
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setEmail(d.email || ""));
    fetch("/api/preferences").then(r => r.json()).then(d => { setPrefs(d); setName(d.name || ""); setLoading(false); });
    fetch("/api/auth/2fa-status").then(r => r.json()).then(d => { setTwoFAEnabled(d.enabled); setName(d.name || ""); });
  }, []);

  async function updatePrefs(patch: any) {
    const res = await fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setPrefs(data);
    notify.success("Settings saved");
  }

  async function toggle2FA(enabled: boolean) {
    if (enabled) {
      setShow2FASetup(true);
      setLoading(true);
      try {
        const res = await fetch("/api/auth/setup-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        const data = await res.json();
        if (!res.ok) { notify.error(data.error); return; }
        const qr = await QRCode.toDataURL(data.otpauthUrl, { width: 200, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
        setQr2faUrl(qr);
        setManualEntry(data.manualEntry);
      } catch { notify.error("Failed to set up 2FA"); }
      finally { setLoading(false); }
    } else {
      const res = await fetch("/api/auth/disable-2fa", { method: "POST" });
      if (res.ok) { setTwoFAEnabled(false); notify.success("2FA disabled"); }
    }
  }

  async function confirm2FA() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-2fa", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", token: verifyCode }) });
      const data = await res.json();
      if (!res.ok) { notify.error(data.error); return; }
      setTwoFAEnabled(true); setShow2FASetup(false); setVerifyCode("");
      notify.success("2FA enabled");
    } catch { notify.error("Failed to verify"); }
    finally { setLoading(false); }
  }

  function applyTheme(t: "light" | "dark" | "system") {
    setTheme(t);
    notify.success(`Theme: ${t}`);
  }

  async function startQrLogin() {
    setQrLoading(true);
    try {
      const res = await fetch("/api/auth/qr-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }), // password not needed — already authenticated
      });
      const data = await res.json();
      if (!res.ok) { notify.error(data.error || "Failed"); return; }
      const qr = await QRCode.toDataURL(data.qrUrl, { width: 280, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
      setQrLoginUrl(qr);
      setQrLoginToken(data.token);
      setQrDialogOpen(true);
      pollQrStatus(data.token);
    } catch { notify.error("Failed to generate QR"); }
    finally { setQrLoading(false); }
  }

  async function pollQrStatus(token: string) {
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/qr-login?token=${token}`);
        const data = await res.json();
        if (data.confirmed) {
          setQrDialogOpen(false);
          notify.success("Login confirmed on another device!");
          return;
        }
        if (data.expired) {
          notify.error("QR expired");
          setQrDialogOpen(false);
          return;
        }
      } catch {}
      setTimeout(poll, 2000);
    };
    setTimeout(poll, 2000);
  }

  async function seedData() {
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    if (res.ok) { notify.success("Seed data created!"); setTimeout(() => window.location.reload(), 1500); }
    else notify.error(data.error || "Seeding failed");
  }

  if (loading) return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading settings">
      <PageHeader title="Settings" subtitle="Manage your account, security, AI, and preferences." icon="Settings" color="#71717a" />

      {/* Profile section skeleton */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-4">
        <div className="h-5 w-20 skeleton rounded bg-muted/40" />
        <div className="space-y-2">
          <div className="h-4 w-12 skeleton rounded bg-muted/30" />
          <div className="h-9 w-full skeleton rounded-md bg-muted/40" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-12 skeleton rounded bg-muted/30" />
          <div className="h-9 w-full skeleton rounded-md bg-muted/40" />
        </div>
        <div className="h-9 w-24 skeleton rounded-md bg-muted/40" />
      </div>

      {/* Security section skeleton */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-4">
        <div className="h-5 w-20 skeleton rounded bg-muted/40" />
        <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 skeleton rounded-lg bg-muted/40" />
            <div className="space-y-1">
              <div className="h-4 w-48 skeleton rounded bg-muted/40" />
              <div className="h-3 w-32 skeleton rounded bg-muted/30" />
            </div>
          </div>
          <div className="h-5 w-9 skeleton rounded-full bg-muted/40" />
        </div>
      </div>

      {/* Appearance section skeleton */}
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card/50 p-4">
        <div className="h-5 w-36 skeleton rounded bg-muted/40" />
        <div className="space-y-2">
          <div className="h-4 w-14 skeleton rounded bg-muted/30" />
          <div className="h-9 w-full skeleton rounded-md bg-muted/40" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account, security, AI, and preferences." icon="Settings" color="#71717a" />

      {/* Profile */}
      <SectionCard title="Profile" icon="User">
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</Label>
            <Input value={email} disabled className="h-9 bg-muted/50" />
          </div>
          <Button size="sm" onClick={async () => {
            const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            if (res.ok) notify.success("Profile updated");
          }} className="gap-1.5"><Icon name="Save" className="h-3.5 w-3.5" /> Save profile</Button>
        </div>
      </SectionCard>

      {/* Security */}
      <SectionCard title="Security" icon="Shield">
        <div className="space-y-4">
          <ToggleRow icon="Smartphone" color="#10b981" title="Two-factor authentication" desc={twoFAEnabled ? "Enabled — requires code on login" : "Off — password only"} checked={twoFAEnabled} onChange={toggle2FA} />
          {show2FASetup && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <h4 className="mb-3 text-sm font-semibold text-violet-600">Set up 2FA</h4>
                {qr2faUrl && <div className="mb-3 flex justify-center"><img src={qr2faUrl} alt="2FA QR" className="rounded-lg border-2 border-border" width={180} height={180} /></div>}
                <p className="mb-2 text-[11px] text-muted-foreground">Scan with Google Authenticator, Authy, etc.:</p>
                <p className="mb-3 break-all rounded bg-muted/50 p-2 font-mono text-[10px]">{manualEntry}</p>
                <div className="flex gap-2">
                  <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="h-9 text-center text-lg font-bold tracking-widest" />
                  <Button size="sm" onClick={confirm2FA} disabled={loading || verifyCode.length !== 6} className="gap-1.5">{loading ? <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShow2FASetup(false); setVerifyCode(""); }}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          )}
          {/* Login on another device */}
          <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500"><Icon name="QrCode" className="h-4 w-4" /></span>
              <div><p className="text-sm font-medium">Login on another device</p><p className="text-[11px] text-muted-foreground">Generate a QR code to sign in on your phone</p></div>
            </div>
            <Button size="sm" variant="outline" onClick={startQrLogin} disabled={qrLoading} className="gap-1.5">
              <Icon name={qrLoading ? "Loader2" : "QrCode"} className={`h-3.5 w-3.5 ${qrLoading ? "animate-spin" : ""}`} /> Generate QR
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* QR Login Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Login on another device</DialogTitle>
            <DialogDescription>Scan this QR code on your phone.</DialogDescription>
          </DialogHeader>
          <div className="p-6 text-center">
            <h3 className="mb-1 text-lg font-semibold">Login on another device</h3>
            <p className="mb-4 text-xs text-muted-foreground">Open your phone's camera and scan this code</p>
            {qrLoginUrl && <img src={qrLoginUrl} alt="Login QR Code" className="mx-auto rounded-xl border-2 border-border" width={240} height={240} />}
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
              <span>Waiting for scan…</span>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Expires in 5 minutes</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Features */}
      <SectionCard title="AI Life Coaches & OpenRouter" icon="Bot">
        <div className="space-y-4">
          <ToggleRow
            icon="Bot"
            color="#a78bfa"
            title="Enable AI Coaching Engine"
            desc="Master toggle for all 6 specialized AI coaches & predictive audits"
            checked={prefs?.aiEnabled ?? true}
            onChange={(v) => updatePrefs({ aiEnabled: v })}
          />

          {prefs?.aiEnabled && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">AI Provider</Label>
                <Select value={prefs?.aiProvider || "openrouter"} onValueChange={(v) => updatePrefs({ aiProvider: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openrouter">OpenRouter (Recommended - Free Model Supported)</SelectItem>
                    <SelectItem value="demo">Free Demo Mode (Verified Local Data Only)</SelectItem>
                    <SelectItem value="openai-compatible">OpenAI-compatible API</SelectItem>
                    <SelectItem value="custom">Custom Endpoint</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {(!prefs?.aiProvider || prefs?.aiProvider === "openrouter") &&
                    "Uses OpenRouter chat completion API with free models (default: openrouter/free). If no key is entered, the app gracefully operates in Demo Mode."}
                  {prefs?.aiProvider === "demo" &&
                    "Generates instant high-quality recommendations grounded in your database records without calling external APIs."}
                  {prefs?.aiProvider === "openai-compatible" &&
                    "Connect to OpenAI, Groq, Together, Ollama, or any compatible provider."}
                </p>
              </div>

              {(prefs?.aiProvider === "openrouter" || prefs?.aiProvider === "openai-compatible" || prefs?.aiProvider === "custom") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block text-[11px] font-semibold text-muted-foreground">
                        API Key {prefs?.hasApiKey ? "(Saved)" : "(Optional for Demo Mode)"}
                      </Label>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-500 hover:underline"
                      >
                        Get Free OpenRouter Key ↗
                      </a>
                    </div>
                    <Input
                      type="password"
                      placeholder={prefs?.hasApiKey ? "•••••••••••• (Saved on Server)" : "sk-or-v1-..."}
                      onChange={(e) => { if (e.target.value) updatePrefs({ aiApiKey: e.target.value }); }}
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Model Identifier</Label>
                    <Input
                      value={prefs?.aiModel || "openrouter/free"}
                      onChange={(e) => updatePrefs({ aiModel: e.target.value })}
                      placeholder="openrouter/free"
                      className="h-9 font-mono text-xs"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Free models include: <code>openrouter/free</code>, <code>meta-llama/llama-3.3-70b-instruct:free</code>, or any model ID.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </SectionCard>

      {/* Database & Storage */}
      <SectionCard title="Database & Storage Architecture" icon="Database">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Icon name="Database" className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Supabase PostgreSQL</p>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Connected
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Project: <code className="font-mono">gnmrydmjcrsxxxroinqi</code> · 11 Domains · Row-Level Protection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Icon name="ShieldCheck" className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Private Document Vault Storage</p>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Active
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Supabase Bucket: <code className="font-mono">vault</code> (Private) · Signed URLs with 1-hr TTL
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={seedData}>
              <Icon name="Sprout" className="h-3.5 w-3.5" /> Seed test data
            </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600">
                <Icon name="Trash2" className="h-3.5 w-3.5" /> Reset database
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete ALL items, projects, domains, reviews, and tags. Your user account will be preserved. This cannot be undone. Consider downloading a backup first.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  const res = await fetch("/api/reset-db", { method: "POST" });
                  const data = await res.json();
                  if (res.ok) { notify.success("Database reset. Reloading…"); setTimeout(() => window.location.reload(), 1500); }
                  else notify.error(data.error || "Reset failed");
                }} className="bg-rose-500 hover:bg-rose-600">Reset everything</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Data & Backup" icon="Archive">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.open("/api/export?type=items", "_blank")}><Icon name="Download" className="h-3.5 w-3.5" /> Export CSV</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => {
            const res = await fetch("/api/backup"); const data = await res.json();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob); const a = document.createElement("a");
            a.href = url; a.download = `lifeos-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
            URL.revokeObjectURL(url); notify.success("Backup downloaded");
          }}><Icon name="Download" className="h-3.5 w-3.5" /> Full backup (JSON)</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
            const input = document.createElement("input"); input.type = "file"; input.accept = ".json";
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return;
              const text = await file.text();
              try {
                const data = JSON.parse(text);
                const res = await fetch("/api/backup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
                if (res.ok) { notify.success("Backup restored"); setTimeout(() => window.location.reload(), 1000); }
                else notify.error("Restore failed");
              } catch { notify.error("Invalid file"); }
            };
            input.click();
          }}><Icon name="Upload" className="h-3.5 w-3.5" /> Restore backup</Button>
        </div>
      </SectionCard>

      {/* Account */}
      <SectionCard title="Account" icon="UserCog">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Sign out of your account</p>
          <Button variant="outline" size="sm" className="gap-1.5 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>
            <Icon name="LogOut" className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}

function ToggleRow({ icon, color, title, desc, checked, onChange }: { icon: string; color: string; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/40 p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${color}1a`, color }}><Icon name={icon} className="h-4 w-4" /></span>
        <div><p className="text-sm font-medium">{title}</p><p className="text-[11px] text-muted-foreground">{desc}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
