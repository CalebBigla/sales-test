import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TechAnimation } from "@/components/tech-animation";
import {
  ArrowUpRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — SalesFlow Pro" },
      {
        name: "description",
        content: "Sign in to your SalesFlow Pro workspace.",
      },
      { property: "og:title", content: "Sign in — SalesFlow Pro" },
      {
        property: "og:description",
        content: "Sign in to your SalesFlow Pro workspace.",
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

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
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
    <main className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] overflow-hidden bg-white">
      <div className="flex h-full w-full flex-col lg:flex-row">

        {/* ============================================================
            LEFT — TECH ANIMATION WITH LOGO
        ============================================================ */}
        <section
          className="
            relative
            h-full
            w-full
            overflow-hidden
            lg:flex
            lg:w-[55%]
            xl:w-[55%]
          "
        >
          {/* Tech Animation as background */}
          <div className="absolute inset-0">
            <TechAnimation></TechAnimation>
          </div>

          {/* Logo content over animation */}
          <div className="relative z-10 flex h-full w-full flex-col justify-between px-10 py-10 xl:px-16 xl:py-12">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/20
                  backdrop-blur-sm
                "
              >
                <TrendingUp className="h-6 w-6 text-white" />
              </div>

              <span className="text-[24px] font-bold tracking-[-0.6px] text-white">
                SalesFlow Pro
              </span>
            </div>

            {/* Main Content - Writeup from reference */}
            <div className="max-w-md space-y-6">
              <h1 className="text-5xl font-bold leading-tight text-white">
                Turn data into your best salesperson.
              </h1>
              <p className="text-lg text-white/80">
                Join 12,000+ teams forecasting revenue, managing leads, and closing deals faster with one unified command center.
              </p>

              {/* Trust Badge */}
              <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-sm">
                <div className="flex -space-x-2">
                  <div className="h-10 w-10 rounded-full border-2 border-white bg-blue-300"></div>
                  <div className="h-10 w-10 rounded-full border-2 border-white bg-blue-400"></div>
                  <div className="h-10 w-10 rounded-full border-2 border-white bg-blue-500"></div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-white">Trusted by modern teams</div>
                  <div className="text-white/70">at companies like Stripe, Linear & Vercel</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-sm text-white/60">
              © 2024 SalesFlow Pro. All rights reserved.
            </div>
          </div>
        </section>

        {/* ============================================================
            RIGHT — LOGIN PANEL
        ============================================================ */}
        <section
          className="
            flex
            h-full
            min-h-0
            w-full
            flex-1
            flex-col
            overflow-hidden
            bg-white
            lg:w-[45%]
            lg:flex-none
          "
        >
          {/* Login content */}
          <div
            className="
              flex
              min-h-0
              flex-1
              items-center
              overflow-hidden
              px-6
              pb-8
              sm:px-10
              lg:px-10
              xl:px-16
            "
          >
            <div className="mx-auto w-full max-w-[448px]">

              {/* Mobile Logo */}
              <div className="mb-7 flex items-center gap-3 lg:hidden">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#2864e8]
                  "
                >
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  SalesFlow Pro
                </span>
              </div>

              {/* Header */}
              <div className="mb-8">
                <h2
                  className="
                    text-[32px]
                    font-bold
                    leading-tight
                    tracking-[-1px]
                    text-[#111827]
                  "
                >
                  Welcome Back
                </h2>

                <p className="mt-2 text-[16px] leading-6 text-slate-500">
                  Enter your credentials to access your workspace.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="
                      mb-2
                      block
                      text-[14px]
                      font-medium
                      text-slate-700
                    "
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <Mail
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        h-[17px]
                        w-[17px]
                        -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="marcus.williams@gmail.com"
                      className="
                        h-[43px]
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        pl-11
                        pr-4
                        text-[14px]
                        text-slate-800
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-[#2864e8]
                        focus:ring-2
                        focus:ring-[#2864e8]/10
                      "
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="
                        text-[14px]
                        font-medium
                        text-slate-700
                      "
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="
                        text-[14px]
                        font-medium
                        text-[#1763f6]
                        hover:underline
                      "
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="relative">
                    <LockKeyhole
                      className="
                        pointer-events-none
                        absolute
                        left-4
                        top-1/2
                        h-[17px]
                        w-[17px]
                        -translate-y-1/2
                        text-slate-400
                      "
                    />

                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="
                        h-[43px]
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        pl-11
                        pr-11
                        text-[14px]
                        text-slate-800
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-[#2864e8]
                        focus:ring-2
                        focus:ring-[#2864e8]/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="
                        absolute
                        right-3
                        top-1/2
                        -translate-y-1/2
                        rounded-md
                        p-1
                        text-slate-400
                        transition
                        hover:text-slate-600
                      "
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-[17px] w-[17px]" />
                      ) : (
                        <Eye className="h-[17px] w-[17px]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="
                      h-4
                      w-4
                      cursor-pointer
                      rounded
                      border-slate-300
                      accent-[#1763f6]
                    "
                  />

                  <span className="text-[14px] text-slate-600">
                    Remember this device for 30 days
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-red-200
                      bg-red-50
                      p-3
                    "
                  >
                    <p className="text-[14px] text-red-600">
                      {error}
                    </p>
                  </div>
                )}

                {/* Sign In */}
                <button
                  type="submit"
                  disabled={busy}
                  className="
                    h-[43px]
                    w-full
                    rounded-xl
                    bg-[#2864e8]
                    text-[14px]
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-[#2058d4]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[#2864e8]/30
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {busy ? "Signing in…" : "Sign In"}
                </button>

                {/* Secondary actions moved to bottom */}
                <div className="mt-8 text-center text-[14px] text-slate-500">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1 hover:text-slate-900"
                  >
                    Need help?
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <p className="inline-flex items-center gap-3 ml-2">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-[#1763f6] hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>

              </form>

              {/* Divider */}
              <div className="my-8 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="shrink-0 text-[14px] text-slate-400">
                  Or continue with
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-3 gap-3">

                {/* Google */}
                <button
                  type="button"
                  className="
                    flex
                    h-[50px]
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    transition
                    hover:bg-slate-50
                  "
                  aria-label="Continue with Google"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                  >
                    <path
                      fill="#4285F4"
                      d="M21.35 12.27c0-.72-.06-1.25-.19-1.8H12v3.4h5.36a4.58 4.58 0 0 1-1.99 3.01v2.51h3.23c1.89-1.74 2.75-4.3 2.75-7.12Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 21.75c2.7 0 4.96-.89 6.61-2.36l-3.23-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.06v2.59A9.99 9.99 0 0 0 12 21.75Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M6.4 13.71a6.02 6.02 0 0 1 0-3.84V7.28H3.06a9.99 9.99 0 0 0 0 9.02l3.34-2.59Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.74c1.47 0 2.79.51 3.83 1.51l2.87-2.87C16.95 2.81 14.7 1.9 12 1.9a9.99 9.99 0 0 0-8.94 5.38L6.4 9.87C7.19 7.5 9.4 5.74 12 5.74Z"
                    />
                  </svg>
                </button>

                {/* Apple */}
                <button
                  type="button"
                  className="
                    flex
                    h-[50px]
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-800
                    transition
                    hover:bg-slate-50
                  "
                  aria-label="Continue with Apple"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M17.05 12.54c-.02-2.07 1.69-3.07 1.77-3.12a3.8 3.8 0 0 0-2.99-1.62c-1.26-.13-2.48.75-3.12.75-.65 0-1.65-.73-2.72-.71-1.4.02-2.7.81-3.42 2.06-1.47 2.54-.37 6.28 1.05 8.34.71 1.01 1.53 2.14 2.63 2.1 1.06-.04 1.46-.68 2.74-.68 1.28 0 1.64.68 2.75.66 1.14-.02 1.85-1.02 2.54-2.04a8.3 8.3 0 0 0 1.15-2.36 3.65 3.65 0 0 1-2.38-3.38Zm-2.05-6.07a3.64 3.64 0 0 0 .84-2.62 3.72 3.72 0 0 0-2.41 1.25 3.47 3.47 0 0 0-.87 2.51 3.07 3.07 0 0 0 2.44-1.14Z" />
                  </svg>
                </button>

                {/* Microsoft */}
                <button
                  type="button"
                  className="
                    flex
                    h-[50px]
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    transition
                    hover:bg-slate-50
                  "
                  aria-label="Continue with Microsoft"
                >
                  <div className="grid h-[18px] w-[18px] grid-cols-2 gap-[2px]">
                    <span className="bg-[#f25022]" />
                    <span className="bg-[#7fba00]" />
                    <span className="bg-[#00a4ef]" />
                    <span className="bg-[#ffb900]" />
                  </div>
                </button>

              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}