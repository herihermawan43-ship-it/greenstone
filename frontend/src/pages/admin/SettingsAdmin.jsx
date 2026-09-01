import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const EMPTY = {
  openai_api_key: "", anthropic_api_key: "", gemini_api_key: "",
  autoblog_openai_model: "", autoblog_anthropic_model: "", autoblog_gemini_model: "",
  smtp_host: "", smtp_port: 587, smtp_user: "", smtp_password: "",
  smtp_use_tls: true, email_from_address: "", email_from_name: "",
  email_reply_to: "", owner_email: "",
};

function SecretField({ testId, label, value, onChange, settings, field, placeholder }) {
  const [show, setShow] = useState(false);
  const isSet = !!settings?.[`${field}_set`];
  const hint = settings?.[`${field}_hint`] || "";
  const source = settings?.[`${field}_source`];

  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          data-testid={testId}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={isSet ? `${placeholder || "Leave blank to keep current"} (${hint})` : (placeholder || "Not set")}
          className="border-border bg-ink pr-10 font-mono text-xs text-bone"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brass"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {isSet ? (
          <>Currently set{source === "env" ? " via .env" : ""} ({hint}). Type a new value to replace it.</>
        ) : (
          "Not configured yet."
        )}
      </p>
    </div>
  );
}

export default function SettingsAdmin() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => (await api.get("/admin/settings")).data,
  });

  useEffect(() => {
    if (!settings) return;
    setForm({
      openai_api_key: "", anthropic_api_key: "", gemini_api_key: "", smtp_password: "",
      autoblog_openai_model: settings.autoblog_openai_model || "",
      autoblog_anthropic_model: settings.autoblog_anthropic_model || "",
      autoblog_gemini_model: settings.autoblog_gemini_model || "",
      smtp_host: settings.smtp_host || "",
      smtp_port: settings.smtp_port || 587,
      smtp_user: settings.smtp_user || "",
      smtp_use_tls: settings.smtp_use_tls ?? true,
      email_from_address: settings.email_from_address || "",
      email_from_name: settings.email_from_name || "",
      email_reply_to: settings.email_reply_to || "",
      owner_email: settings.owner_email || "",
    });
  }, [settings]);

  const set = (k) => (e) => setForm({ ...form, [k]: e?.target ? e.target.value : e });

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", { ...form, smtp_port: Number(form.smtp_port) || 587 });
      toast.success("Settings saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground" data-testid="settings-loading">Loading…</div>;
  }

  return (
    <div className="max-w-3xl" data-testid="admin-settings">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl font-medium">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            API keys and email delivery, used by AI auto-blogging and inquiry notifications. Values left
            blank fall back to your server's .env file.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          data-testid="settings-save-btn"
          className="flex items-center gap-2 bg-moss px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <section className="mt-8 border border-border bg-card p-6">
        <h2 className="mb-6 flex items-center gap-2 border-b border-border pb-3 font-serif text-xl text-brass">
          <KeyRound className="h-4 w-4" /> AI Providers (Auto-Blog)
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <SecretField
            testId="settings-openai-key" label="OpenAI API Key" field="openai_api_key"
            value={form.openai_api_key} onChange={set("openai_api_key")} settings={settings}
          />
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">OpenAI Model</Label>
            <Input data-testid="settings-openai-model" value={form.autoblog_openai_model} onChange={set("autoblog_openai_model")} placeholder="gpt-4o" className="border-border bg-ink font-mono text-xs text-bone" />
          </div>

          <SecretField
            testId="settings-anthropic-key" label="Anthropic API Key" field="anthropic_api_key"
            value={form.anthropic_api_key} onChange={set("anthropic_api_key")} settings={settings}
          />
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Anthropic Model</Label>
            <Input data-testid="settings-anthropic-model" value={form.autoblog_anthropic_model} onChange={set("autoblog_anthropic_model")} placeholder="claude-sonnet-5" className="border-border bg-ink font-mono text-xs text-bone" />
          </div>

          <SecretField
            testId="settings-gemini-key" label="Gemini API Key" field="gemini_api_key"
            value={form.gemini_api_key} onChange={set("gemini_api_key")} settings={settings}
          />
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Gemini Model</Label>
            <Input data-testid="settings-gemini-model" value={form.autoblog_gemini_model} onChange={set("autoblog_gemini_model")} placeholder="gemini-2.0-flash" className="border-border bg-ink font-mono text-xs text-bone" />
          </div>
        </div>
        <p className="mt-4 text-[10px] text-muted-foreground">
          At least one provider key is required for AI Auto-Posting (Admin &rsaquo; Blog) to work.
        </p>
      </section>

      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="mb-6 flex items-center gap-2 border-b border-border pb-3 font-serif text-xl text-brass">
          <Mail className="h-4 w-4" /> SMTP (Email Notifications)
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SMTP Host</Label>
            <Input data-testid="settings-smtp-host" value={form.smtp_host} onChange={set("smtp_host")} placeholder="smtp.yourprovider.com" className="border-border bg-ink font-mono text-xs text-bone" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SMTP Port</Label>
            <Input data-testid="settings-smtp-port" type="number" value={form.smtp_port} onChange={set("smtp_port")} className="border-border bg-ink font-mono text-xs text-bone" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SMTP Username</Label>
            <Input data-testid="settings-smtp-user" value={form.smtp_user} onChange={set("smtp_user")} className="border-border bg-ink font-mono text-xs text-bone" />
          </div>
          <SecretField
            testId="settings-smtp-password" label="SMTP Password" field="smtp_password"
            value={form.smtp_password} onChange={set("smtp_password")} settings={settings}
          />
          <div className="flex items-end gap-3 pb-1">
            <Switch id="smtp-tls" data-testid="settings-smtp-tls" checked={form.smtp_use_tls} onCheckedChange={(v) => set("smtp_use_tls")(v)} />
            <Label htmlFor="smtp-tls" className="text-xs text-muted-foreground">Use STARTTLS</Label>
          </div>
          <div />
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">From Address</Label>
            <Input data-testid="settings-from-address" value={form.email_from_address} onChange={set("email_from_address")} placeholder="noreply@yourdomain.com" className="border-border bg-ink text-bone" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">From Name</Label>
            <Input data-testid="settings-from-name" value={form.email_from_name} onChange={set("email_from_name")} placeholder="PT. Murfy Alam Indonesia" className="border-border bg-ink text-bone" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reply-To (optional)</Label>
            <Input data-testid="settings-reply-to" value={form.email_reply_to} onChange={set("email_reply_to")} className="border-border bg-ink text-bone" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Owner Email (receives inquiries)</Label>
            <Input data-testid="settings-owner-email" value={form.owner_email} onChange={set("owner_email")} className="border-border bg-ink text-bone" />
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        data-testid="settings-save-btn-bottom"
        className="mt-6 w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors hover:bg-mosslight disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
