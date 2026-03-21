"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "aurora-starter-core";
import { FloatingLabelInput } from "aurora-starter-core";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setSession } = useAuth();
  const isRegister = searchParams.get("register") === "1";
  const returnTo = searchParams.get("returnTo") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/signup" : "/api/auth/signin";
      const body: { email: string; password: string; options?: { emailRedirectTo?: string } } = {
        email,
        password,
      };
      // Single redirect URL in Supabase: API /v1/auth/confirm redirects to this store (no per-store allow list).
      if (isRegister && typeof window !== "undefined") {
        const apiBase = process.env.NEXT_PUBLIC_AURORA_API_URL ?? "";
        const storeConfirm = `${window.location.origin}/auth/confirm`;
        if (apiBase) {
          body.options = {
            emailRedirectTo: `${apiBase.replace(/\/$/, "")}/v1/auth/confirm?store=${encodeURIComponent(storeConfirm)}`,
          };
        } else {
          body.options = { emailRedirectTo: storeConfirm };
        }
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "Request failed");
      }
      if (data.access_token && data.user) {
        setSession(data.access_token, data.user);
        router.push(returnTo);
      } else if (data.user && (data as { message?: string }).message) {
        setError((data as { message: string }).message);
      } else {
        setError("Unexpected response");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Hippo Grocery";
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL ?? "";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: branding with hero-style background */}
      <div className="relative hidden md:flex md:w-5/12 lg:w-1/2 flex-col items-center justify-center p-12 overflow-hidden">
        <div
          className="absolute inset-0 scale-105"
          style={{
            backgroundImage: "url(/assets/login_register.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-white/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-40 sm:h-48 md:h-56 w-auto mb-8 object-contain drop-shadow-sm" />
          ) : (
            <h1 className="text-3xl font-bold text-aurora-text mb-2">{siteName}</h1>
          )}
          <p className="text-xl font-medium text-aurora-text text-center max-w-sm drop-shadow-sm">
            Fresh groceries from local stores delivered to your door.
          </p>
        </div>
      </div>
      {/* Right: form */}
      <div className="flex-1 flex flex-col justify-center py-8 md:py-12 px-12 md:px-16 max-w-md mx-auto w-full md:max-w-none">
      <div className="flex gap-2 mb-6">
        <Link
          href={isRegister ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}` : "/auth/required"}
          className={`inline-flex items-center justify-center h-12 px-5 rounded-xl text-sm font-semibold transition-colors ${
            !isRegister
              ? "bg-aurora-primary text-white hover:bg-aurora-primary-dark"
              : "border border-aurora-border text-aurora-muted hover:bg-aurora-surface-hover hover:text-aurora-text"
          }`}
        >
          Login
        </Link>
        <Link
          href={isRegister ? "/auth/required" : `/auth/login?register=1&returnTo=${encodeURIComponent(returnTo)}`}
          className={`inline-flex items-center justify-center h-12 px-5 rounded-xl text-sm font-semibold transition-colors ${
            isRegister
              ? "bg-aurora-primary text-white hover:bg-aurora-primary-dark"
              : "border border-aurora-border text-aurora-muted hover:bg-aurora-surface-hover hover:text-aurora-text"
          }`}
        >
          Register
        </Link>
      </div>
      <div className="p-6 rounded-component bg-aurora-surface border border-aurora-border">
        <h2 className="text-lg font-semibold mb-2">
          {isRegister ? "Create your account" : "Login to your account"}
        </h2>
        <p className="text-aurora-muted text-sm mb-6">
          {isRegister
            ? "Enter your details to create an account"
            : "Enter your email and password to access your account"}
        </p>
        {error && (
          <p className="mb-4 p-3 rounded-component bg-red-500/20 text-red-300 text-sm">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <FloatingLabelInput
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {!isRegister && (
              <Link href="/auth/forgot" className="text-aurora-accent text-sm mt-1 inline-block">
                Forgot password?
              </Link>
            )}
          </div>
          {!isRegister && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="rounded" />
              Remember me
            </label>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-aurora-primary text-white font-semibold hover:bg-aurora-primary-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "Please wait…" : isRegister ? "Create Account" : "Login"}
          </button>
        </form>
        <div className="mt-6 pt-6 border-t border-aurora-border">
          <p className="text-aurora-muted text-sm text-center mb-4">OR CONTINUE WITH</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 h-12 rounded-xl border border-aurora-border bg-aurora-surface text-aurora-text font-medium hover:bg-aurora-surface-hover transition-colors"
            >
              Google
            </button>
            <button
              type="button"
              className="flex-1 h-12 rounded-xl border border-aurora-border bg-aurora-surface text-aurora-text font-medium hover:bg-aurora-surface-hover transition-colors"
            >
              Apple
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 px-6 text-center text-aurora-muted">Loading…</div>}>
      <LoginContent />
    </Suspense>
  );
}
