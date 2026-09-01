import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate("/admin");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6" data-testid="admin-login-page">
      <div className="w-full max-w-md border border-border bg-card p-10">
        <div className="mb-8 flex flex-col leading-none">
          <span className="font-serif text-3xl font-semibold text-bone">Murfy Alam</span>
          <span className="mt-2 text-[10px] uppercase tracking-[0.3em] text-brass">Admin Console</span>
        </div>
        <form onSubmit={submit} className="space-y-5" data-testid="admin-login-form">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</Label>
            <Input
              id="admin-email"
              data-testid="admin-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@murfyalam.com"
              className="border-border bg-ink text-bone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</Label>
            <Input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-border bg-ink text-bone"
            />
          </div>
          {error && (
            <p data-testid="admin-login-error" className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            data-testid="admin-login-submit"
            className="w-full bg-moss py-3 text-xs uppercase tracking-[0.25em] text-white transition-colors duration-300 hover:bg-mosslight disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
