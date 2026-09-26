import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, EyeOff, LoaderCircle, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { resolveSession } from "@/lib/auth.functions";
import { homeForRoles } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SalesFlow Pro" },
      { name: "description", content: "Sign in to your SalesFlow Pro workspace." },
      { property: "og:title", content: "Sign in — SalesFlow Pro" },
      { property: "og:description", content: "Sign in to your SalesFlow Pro workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

type FieldErrors = { email?: string; password?: string };

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#2463eb] text-white shadow-sm">
        <Zap aria-hidden="true" className="h-4 w-4 fill-current" strokeWidth={2.5} />
      </span>
      <span
        className={`text-lg font-bold tracking-[-0.04em] ${inverse ? "text-white" : "text-[#101828]"}`}
      >
        SalesFlow Pro
      </span>
    </div>
  );
}

function AuthBrandPanel() {
  return (
    <aside
      className="relative hidden min-h-[100dvh] overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:w-1/2"
      style={{
        backgroundImage:
          "linear-gradient(115deg, rgba(8, 25, 58, 0.91), rgba(12, 36, 75, 0.78)), url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="flex w-full flex-col px-5 py-5 xl:px-8 xl:py-6">
        <Brand inverse />
        <div className="my-auto max-w-[460px] py-5">
          <h1 className="font-display text-[clamp(2.25rem,3.25vw,2.75rem)] font-bold leading-[1.04] tracking-[-0.055em] text-white">
            Operational
            <br />
            excellence for
            <br />
            sales teams.
          </h1>
          <p className="mt-3 max-w-[440px] text-base leading-6 text-white/78">
            The all-in-one system for sales, inventory, and performance management.
          </p>
        </div>
        <footer className="flex items-center justify-between gap-3 text-xs text-white/60">
          <span>© 2026 SalesFlow Pro</span>
          <nav className="flex gap-3" aria-label="Legal">
            <a className="transition-colors hover:text-white" href="/privacy">
              Privacy
            </a>
            <a className="transition-colors hover:text-white" href="/terms">
              Terms of Service
            </a>
          </nav>
        </footer>
      </div>
    </aside>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const fetchSession = useServerFn(resolveSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  function validate() {
    const errors: FieldErrors = {};
    if (!email.trim()) errors.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Enter your password.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate() || busy) return;
    setBusy(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setBusy(false);
      setError("Unable to sign in. Please check your credentials and try again.");
      return;
    }

    try {
      const profile = await fetchSession();
      navigate({ to: homeForRoles(profile.roles), replace: true });
    } catch {
      await supabase.auth.signOut();
      setError("Unable to open your workspace. Please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] w-full bg-white lg:h-[100dvh] lg:overflow-hidden">
      <AuthBrandPanel />
      <section className="flex min-h-[100dvh] w-full items-center justify-center bg-white px-3 py-2 sm:px-4 sm:py-3 lg:h-full lg:min-h-0 lg:w-1/2 lg:px-5 lg:py-4">
        <div className="w-full max-w-[400px]">
          <div className="mb-5 lg:hidden">
            <Brand />
          </div>
          <header className="mb-3">
            <h2 className="font-display text-[28px] font-bold leading-tight tracking-[-0.04em] text-[#101828]">
              Welcome back
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Enter your credentials to access your workspace.
            </p>
          </header>

          <form noValidate onSubmit={onSubmit} className="space-y-2.5">
            {error ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-700"
              >
                {error}
              </div>
            ) : null}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldErrors((current) => ({ ...current, email: undefined }));
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                placeholder="Enter your email"
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2463eb] focus:ring-4 focus:ring-[#2463eb]/10 ${fieldErrors.email ? "border-red-400" : "border-slate-200"}`}
              />
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setFieldErrors((current) => ({ ...current, password: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  placeholder="Enter your password"
                  className={`w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2463eb] focus:ring-4 focus:ring-[#2463eb]/10 ${fieldErrors.password ? "border-red-400" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#2463eb]"
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="h-5 w-5" />
                  ) : (
                    <Eye aria-hidden="true" className="h-5 w-5" />
                  )}
                </button>
              </div>
              {fieldErrors.password ? (
                <p id="password-error" className="mt-1.5 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#2463eb] focus:ring-2 focus:ring-[#2463eb]"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="font-medium text-[#2463eb] transition-colors hover:text-[#164bbf] focus:outline-none focus:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#102a56] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0a2045] focus:outline-none focus:ring-4 focus:ring-[#2463eb]/25 active:bg-[#081a38] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <span aria-hidden="true">→</span>
                </>
              )}
            </button>
            <p className="pt-1 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-[#2463eb] transition-colors hover:text-[#164bbf] focus:outline-none focus:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
