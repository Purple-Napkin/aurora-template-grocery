"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "aurora-starter-core";

/**
 * Email confirmation callback. User lands here from the link in the confirmation email:
 * API /v1/auth/confirm redirects to this page with the token in the hash.
 * We read the token, validate via session, set session, then redirect home.
 */
function AuthConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSession } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash?.slice(1) || "";
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      setStatus("error");
      setTimeout(() => router.replace("/auth/login"), 2000);
      return;
    }

    fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Invalid token"))))
      .then((data: { user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> } }) => {
        setSession(accessToken, data.user);
        setStatus("ok");
        const returnTo = searchParams.get("returnTo") ?? "/";
        router.replace(returnTo);
      })
      .catch(() => {
        setStatus("error");
        setTimeout(() => router.replace("/auth/login"), 2000);
      });
  }, [router, searchParams, setSession]);

  if (status === "ok") {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center text-aurora-muted">
        Redirecting…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center">
        <p className="text-red-300 mb-4">Invalid or expired link. Redirecting to login.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-6 text-center text-aurora-muted">
      Confirming your account…
    </div>
  );
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-16 px-6 text-center text-aurora-muted">Loading…</div>}>
      <AuthConfirmContent />
    </Suspense>
  );
}
