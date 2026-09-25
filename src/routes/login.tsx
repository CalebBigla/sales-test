import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff, Chrome, Apple } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Friscontech" },
      {
        name: "description",
        content: "Sign in to your Friscontech workspace.",
      },
      { property: "og:title", content: "Sign in — Friscontech" },
      {
        property: "og:description",
        content: "Sign in to your Friscontech workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    setBusy(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    navigate({ to: "/owner/dashboard", replace: true });
  }

  return (
    <div className="flex h-screen w-full">
      <div 
        className="hidden lg:flex lg:w-1/2 bg-[#0f172a] relative overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "50px 50px"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a]/90 via-[#1e293b]/80 to-[#0f172a]/90" />
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold">Friscontech</span>
          </div>

          <div className="max-w-lg space-y-6">
            <h1 className="text-5xl font-bold leading-tight">
              Operational excellence for sales teams.
            </h1>
            <p className="text-lg text-white/80">
              The all-in-one system for sales, inventory, and performance management.
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-white/60">
            <span>© 2026 Friscontech</span>
            <div className="flex gap-6">
              <Link to="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link to="#" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6 text-white"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-900">Friscontech</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-normal text-slate-900 mb-2"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david.kim@orbitlabs.co"
                className="w-full px-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-normal text-slate-900 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-md border border-gray-200 bg-white text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-normal text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full px-4 py-2.5 rounded-md bg-[#1e293b] text-white text-sm font-medium hover:bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Signing in..." : "Sign In"}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm font-normal text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
              >
                <Chrome className="h-4 w-4" />
              </button>

              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-gray-200 bg-white text-sm font-normal text-slate-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
              >
                <Apple className="h-4 w-4" />
              </button>
            </div>

            <div className="text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-normal text-blue-600 hover:text-blue-700 transition-colors"
              >
                Create one
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
