import type { Metadata } from "next";
import Link from "next/link";
import { loginAction } from "./actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Please enter both email and password.",
  invalid_credentials: "Email or password is incorrect.",
  not_admin: "That account doesn't have admin access.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;
  const next = params.next ?? "/admin";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link href="/" className="auth-back" aria-label="Back to home">
          ← Back
        </Link>
        <header className="auth-header">
          <p className="auth-eyebrow">Admin Access</p>
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-subtitle">
            Manage photography collections and content.
          </p>
        </header>

        {errorMessage && (
          <div className="auth-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form action={loginAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </label>
          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="auth-submit">
            Continue
          </button>
        </form>

        <p className="auth-footnote">
          Accounts are created by invite only. Contact the site owner for access.
        </p>
      </div>
    </main>
  );
}
