import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TechAnimation } from "@/components/tech-animation";
import { Mail, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Join Friscontech — SalesFlow Pro" },
      {
        name: "description",
        content: "Create your account to join the Friscontech sales team.",
      },
      { property: "og:title", content: "Join Friscontech — SalesFlow Pro" },
      { property: "og:description", content: "Create your account to join the Friscontech sales team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // emailRedirectTo: `${window.location.origin}/home`, // Disabled for development
        data: {
          business_name: "Friscontech Ltd",
          full_name: fullName,
          location: location
        },
      },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    // Skip email confirmation for development
    if (data.session || data.user) {
      // Auto-login after registration
      await supabase.auth.signInWithPassword({ email, password });
      navigate({ to: "/home", replace: true });
      return;
    }
    // Only show this if email confirmation is enabled
    // setNotice("Check your inbox to confirm the email address, then sign in.");
    setNotice("Registration successful! Redirecting...");
    setTimeout(() => navigate({ to: "/login", replace: true }), 1000);
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
          <div className="relative z-10 flex h-full w-full flex-col px-10 py-10 xl:px-16 xl:py-12">
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
                Friscon Tech
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================
            RIGHT — REGISTRATION PANEL
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
          {/* Registration content */}
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
                  Friscon Tech
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
                  Join Friscontech
                </h2>

                <p className="mt-2 text-[16px] leading-6 text-slate-500">
                  First user becomes the owner and can invite team members afterwards.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="
                      mb-2
                      block
                      text-[14px]
                      font-medium
                      text-slate-700
                    "
                  >
                    Your full name
                  </label>

                  <input
                    id="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="
                      h-[43px]
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      pl-4
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
                    Email
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
                      className="
                        h-[43px]
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        pl-4
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

                <div>
                  <label
                    htmlFor="location"
                    className="
                      mb-2
                      block
                      text-[14px]
                      font-medium
                      text-slate-700
                    "
                  >
                    Location (optional)
                  </label>

                  <select
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="
                      h-[43px]
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      pl-4
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
                  >
                    <option value="">Select location</option>
                    <option value="Lagos">Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Port Harcourt">Port Harcourt</option>
                    <option value="Kano">Kano</option>
                    <option value="Ibadan">Ibadan</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="
                      mb-2
                      block
                      text-[14px]
                      font-medium
                      text-slate-700
                    "
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="
                        h-[43px]
                        w-full
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        pl-4
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

                {/* Notice */}
                {notice && (
                  <div
                    className="
                      rounded-xl
                      border
                      border-green-200
                      bg-green-50
                      p-3
                    "
                  >
                    <p className="text-[14px] text-green-600">
                      {notice}
                    </p>
                  </div>
                )}

                {/* Sign Up */}
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
                  {busy ? "Creating account…" : "Create account"}
                </button>

                {/* Secondary actions moved to bottom */}
                <div className="mt-8 text-center text-[14px] text-slate-500">
                  <p className="text-[14px] text-slate-500">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-semibold text-[#1763f6] hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
