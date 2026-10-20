"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signInWithPassword } from "@/lib/api/auth";
import { safeNextPath } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

/**
 * Sign-in form.
 *
 * It posts to this site's own `/api/auth/sign-in/email`, which Next rewrites to
 * the Express-hosted Better Auth handler. The password is sent in the request
 * body only; it is never logged, stored, or placed in a URL.
 *
 * After success the role returned by the server decides the destination, and
 * `safeNextPath` makes sure a crafted `?next=` cannot become an open redirect or
 * send a client to the admin area.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INPUT_CLASS =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-accent-600";

type Status = "idle" | "submitting" | "success" | "error";

export function LoginForm({
  next = null,
  signedOut = false,
}: {
  next?: string | null;
  signedOut?: boolean;
}) {
  const uid = useId();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<string | null>(null);

  const submittingRef = useRef(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const isSubmitting = status === "submitting";
  const isSuccess = status === "success";

  function validate(): boolean {
    const trimmedEmail = email.trim();
    const emailInvalid = !EMAIL_PATTERN.test(trimmedEmail);
    const passwordInvalid = password.length === 0;

    setEmailError(emailInvalid ? "Please enter a valid email address." : null);
    setPasswordError(
      passwordInvalid ? "Please enter your password." : null,
    );

    if (emailInvalid || passwordInvalid) {
      window.requestAnimationFrame(() => {
        (emailInvalid ? emailRef : passwordRef).current?.focus();
      });
      return false;
    }

    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current || isSuccess) {
      return;
    }

    if (!validate()) {
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");
    setFailure(null);

    const result = await signInWithPassword({
      email: email.trim(),
      password,
    });

    submittingRef.current = false;

    if (result.ok) {
      setStatus("success");
      const destination = safeNextPath(result.user.role, next);
      router.replace(destination);
      router.refresh();
      return;
    }

    setStatus("error");
    setFailure(result.message);
    window.requestAnimationFrame(() => alertRef.current?.focus());
  }

  if (isSuccess) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-xl border border-brand-900/15 bg-brand-900/5 p-6 text-center"
      >
        <CheckCircle2
          aria-hidden="true"
          className="mx-auto size-6 text-accent-600"
        />
        <h2 className="mt-3 text-lg font-semibold text-ink">
          Signed in
        </h2>
        <p className="mt-1 text-sm text-muted">
          Redirecting to your workspace…
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      aria-busy={isSubmitting}
      className="space-y-5"
    >
      {signedOut ? (
        <div
          role="status"
          className="rounded-lg border border-line bg-canvas p-3 text-sm text-muted"
        >
          You have been signed out.
        </div>
      ) : null}

      {failure ? (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{failure}</p>
        </div>
      ) : null}

      <div>
        <label htmlFor={emailId} className="block text-sm font-medium text-ink">
          Email address
        </label>
        <input
          ref={emailRef}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError(null);
          }}
          aria-required="true"
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${emailId}-error` : undefined}
          className={cn(INPUT_CLASS, "mt-2", emailError && "border-red-400")}
        />
        {emailError ? (
          <p id={`${emailId}-error`} className="mt-1.5 text-sm text-red-700">
            {emailError}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={passwordId}
          className="block text-sm font-medium text-ink"
        >
          Password
        </label>
        <div className="relative mt-2">
          <input
            ref={passwordRef}
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError(null);
            }}
            aria-required="true"
            aria-invalid={passwordError ? true : undefined}
            aria-describedby={passwordError ? `${passwordId}-error` : undefined}
            className={cn(
              INPUT_CLASS,
              "pr-12",
              passwordError && "border-red-400",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted transition-colors hover:text-ink"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {passwordError ? (
          <p id={`${passwordId}-error`} className="mt-1.5 text-sm text-red-700">
            {passwordError}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs leading-relaxed text-muted">
        Accounts are created by Growers Journy staff. There is no public
        sign-up. If you need access,{" "}
        <Link
          href="/contact"
          className="font-medium text-accent-600 underline decoration-accent-500/40 underline-offset-4 transition-colors hover:text-brand-900"
        >
          contact us
        </Link>
        .
      </p>
    </form>
  );
}
