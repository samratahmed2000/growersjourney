"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/content/services";
import { SITE } from "@/lib/content/site";
import {
  submitInquiry,
  type InquiryFieldErrors,
} from "@/lib/api/inquiries";
import { cn } from "@/lib/utils";

/**
 * Contact form — the public inquiry form.
 *
 * Validation happens twice on purpose: here for fast, friendly feedback, and
 * again on the Express server, which is the actual trust boundary. This form
 * never decides whether an enquiry is acceptable; it only reports what the
 * server said.
 *
 * State rules:
 * - Input is preserved on every failure. Losing a long project description
 *   because the network blipped would be unacceptable.
 * - The submit button is disabled while a request is in flight, and a ref
 *   guards against a second submit before React re-renders.
 * - Nothing claims success until the API returns 201. No email is sent
 *   automatically, and the form does not pretend otherwise.
 */

type FormValues = {
  fullName: string;
  email: string;
  company: string;
  service: string;
  projectDescription: string;
  budget: string;
  timeline: string;
  referenceUrl: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type Failure = {
  kind:
    | "validation"
    | "rate-limited"
    | "timeout"
    | "network"
    | "server"
    | "config";
  message: string;
};

type Status = "idle" | "submitting" | "success" | "error";

const EMPTY_VALUES: FormValues = {
  fullName: "",
  email: "",
  company: "",
  service: "",
  projectDescription: "",
  budget: "",
  timeline: "",
  referenceUrl: "",
};

/**
 * Mirrors the server limits in `server/constants/inquiry.js`.
 * These are usability checks only. The server rejects anything that slips past.
 */
const LIMITS = {
  name: 100,
  email: 254,
  company: 120,
  description: 5000,
  budget: 100,
  timeline: 100,
  referenceUrl: 2048,
} as const;

const DESCRIPTION_MIN = 20;

/** Deliberately permissive: a stricter pattern rejects valid addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Any leading scheme, so `javascript:` and `ftp:` can be rejected early. */
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

/** Maps the server's field names to this form's field names. */
const SERVER_FIELDS: Record<string, keyof FormValues> = {
  name: "fullName",
  email: "email",
  company: "company",
  service: "service",
  projectDescription: "projectDescription",
  budget: "budget",
  timeline: "timeline",
  referenceUrl: "referenceUrl",
};

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const name = values.fullName.trim();
  const email = values.email.trim();
  const description = values.projectDescription.trim();

  if (name.length < 2) {
    errors.fullName = "Please enter your name.";
  } else if (name.length > LIMITS.name) {
    errors.fullName = `Please use ${LIMITS.name} characters or fewer.`;
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Please enter a valid email address.";
  } else if (email.length > LIMITS.email) {
    errors.email = "Please use a shorter email address.";
  }

  if (!values.service) {
    errors.service = "Please choose a service, or select “Not sure yet”.";
  }

  if (description.length < DESCRIPTION_MIN) {
    errors.projectDescription =
      "Please describe the project in at least a sentence or two.";
  } else if (description.length > LIMITS.description) {
    errors.projectDescription = `Please use ${LIMITS.description} characters or fewer.`;
  }

  if (values.company.trim().length > LIMITS.company) {
    errors.company = `Please use ${LIMITS.company} characters or fewer.`;
  }

  if (values.budget.trim().length > LIMITS.budget) {
    errors.budget = `Please use ${LIMITS.budget} characters or fewer.`;
  }

  if (values.timeline.trim().length > LIMITS.timeline) {
    errors.timeline = `Please use ${LIMITS.timeline} characters or fewer.`;
  }

  const referenceUrl = values.referenceUrl.trim();
  if (referenceUrl.length > LIMITS.referenceUrl) {
    errors.referenceUrl = "Please use a shorter link.";
  } else if (SCHEME_PATTERN.test(referenceUrl) && !/^https?:/i.test(referenceUrl)) {
    errors.referenceUrl = "Only http:// or https:// links are supported.";
  }

  return errors;
}

function mapServerFieldErrors(fieldErrors: InquiryFieldErrors): FormErrors {
  const mapped: FormErrors = {};

  for (const [field, message] of Object.entries(fieldErrors)) {
    const target = SERVER_FIELDS[field];
    if (target && !mapped[target]) {
      mapped[target] = message;
    }
  }

  return mapped;
}

const INPUT_CLASS =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink transition-colors placeholder:text-muted/70 focus:border-accent-600";

function Field({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <>
            <span aria-hidden="true" className="ml-0.5 text-accent-600">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : (
          <span className="ml-1 text-xs font-normal text-muted">(optional)</span>
        )}
      </label>

      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}

      <div className="mt-2">{children}</div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Builds aria-describedby from whichever hint/error elements exist. */
function describedBy(id: string, hint: boolean, error: boolean): string | undefined {
  const ids: string[] = [];
  if (hint) ids.push(`${id}-hint`);
  if (error) ids.push(`${id}-error`);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function ContactForm() {
  const uid = useId();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<Failure | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const submittingRef = useRef(false);
  const noticeRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const fieldId = (name: keyof FormValues) => `${uid}-${name}`;
  const errorCount = Object.keys(errors).length;
  const isSubmitting = status === "submitting";

  function update(name: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  function focusField(name: keyof FormValues) {
    window.requestAnimationFrame(() => {
      document.getElementById(fieldId(name))?.focus();
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Guards the gap between the click and the re-render that disables the
    // button, so a double-click cannot send the same enquiry twice.
    if (submittingRef.current) {
      return;
    }

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setAttempted(true);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("idle");
      setFailure(null);
      focusField(Object.keys(nextErrors)[0] as keyof FormValues);
      return;
    }

    submittingRef.current = true;
    setStatus("submitting");
    setFailure(null);

    const result = await submitInquiry({
      name: values.fullName.trim(),
      email: values.email.trim(),
      company: emptyToUndefined(values.company),
      service: values.service,
      projectDescription: values.projectDescription.trim(),
      budget: emptyToUndefined(values.budget),
      timeline: emptyToUndefined(values.timeline),
      referenceUrl: emptyToUndefined(values.referenceUrl),
      website: honeypot,
    });

    submittingRef.current = false;

    if (result.ok) {
      setStatus("success");
      setValues(EMPTY_VALUES);
      setErrors({});
      setAttempted(false);
      setHoneypot("");
      window.requestAnimationFrame(() => successRef.current?.focus());
      return;
    }

    if (result.kind === "validation") {
      const mapped = mapServerFieldErrors(result.fieldErrors);

      if (Object.keys(mapped).length > 0) {
        setErrors(mapped);
        setAttempted(true);
        setStatus("error");
        setFailure(null);
        focusField(Object.keys(mapped)[0] as keyof FormValues);
        return;
      }
    }

    // Every other outcome keeps the input intact and explains what happened.
    setStatus("error");
    setFailure({ kind: result.kind, message: result.message });
    window.requestAnimationFrame(() => noticeRef.current?.focus());
  }

  if (status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-xl border border-brand-900/15 bg-brand-900/5 p-5 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-accent-600"
          />
          <div>
            <h2 className="text-base font-semibold text-ink">
              Thank you — your enquiry has been received
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              It has been saved, and a reply will be sent to the email address
              you provided.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you need to add anything, email{" "}
              <a
                href={`mailto:${SITE.contact.email}`}
                className="font-medium text-accent-600 underline decoration-accent-500/40 underline-offset-4 transition-colors hover:text-brand-900"
              >
                {SITE.contact.email}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${SITE.contact.phone}`}
                className="font-medium text-accent-600 underline decoration-accent-500/40 underline-offset-4 transition-colors hover:text-brand-900"
              >
                {SITE.contact.phoneDisplay}
              </a>
              .
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => setStatus("idle")}
            >
              Send another enquiry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
      aria-busy={isSubmitting}
      className="relative space-y-6"
    >
      {/*
        Honeypot. Hidden from sighted and assistive-technology users and removed
        from the tab order. A bot that fills it gets a normal-looking 201 and
        nothing is stored. It is a deterrent, not a guarantee.
      */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden"
      >
        <label htmlFor={`${uid}-website`}>Website</label>
        <input
          id={`${uid}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {attempted && errorCount > 0 ? (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Please correct the {errorCount === 1 ? "field" : "fields"} marked
            below.
          </p>
        </div>
      ) : null}

      {failure ? (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">
              {failure.kind === "timeout"
                ? "We could not confirm that your enquiry was sent"
                : "Your enquiry was not sent"}
            </p>
            <p className="mt-1">{failure.message}</p>
            <p className="mt-2">
              You can also email{" "}
              <a
                href={`mailto:${SITE.contact.email}`}
                className="font-medium underline decoration-red-700/40 underline-offset-4"
              >
                {SITE.contact.email}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${SITE.contact.phone}`}
                className="font-medium underline decoration-red-700/40 underline-offset-4"
              >
                {SITE.contact.phoneDisplay}
              </a>
              .
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id={fieldId("fullName")}
          label="Full name"
          required
          error={errors.fullName}
        >
          <input
            id={fieldId("fullName")}
            name="fullName"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            aria-required="true"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={describedBy(fieldId("fullName"), false, Boolean(errors.fullName))}
            className={cn(INPUT_CLASS, errors.fullName && "border-red-400")}
          />
        </Field>

        <Field id={fieldId("email")} label="Business email" required error={errors.email}>
          <input
            id={fieldId("email")}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-required="true"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy(fieldId("email"), false, Boolean(errors.email))}
            className={cn(INPUT_CLASS, errors.email && "border-red-400")}
          />
        </Field>

        <Field
          id={fieldId("company")}
          label="Company or organisation"
          hint="Optional — it just helps us understand the context."
        >
          <input
            id={fieldId("company")}
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={(event) => update("company", event.target.value)}
            aria-describedby={describedBy(fieldId("company"), true, false)}
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id={fieldId("service")}
          label="Service you are interested in"
          required
          error={errors.service}
        >
          <select
            id={fieldId("service")}
            name="service"
            value={values.service}
            onChange={(event) => update("service", event.target.value)}
            aria-required="true"
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={describedBy(fieldId("service"), false, Boolean(errors.service))}
            className={cn(INPUT_CLASS, "pr-8", errors.service && "border-red-400")}
          >
            <option value="">Select a service</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
            <option value="not-sure">Not sure yet</option>
          </select>
        </Field>
      </div>

      <Field
        id={fieldId("projectDescription")}
        label="What are you trying to build or fix?"
        required
        hint="The problem, who it affects, and anything you have already tried. Rough notes are fine."
        error={errors.projectDescription}
      >
        <textarea
          id={fieldId("projectDescription")}
          name="projectDescription"
          rows={6}
          value={values.projectDescription}
          onChange={(event) => update("projectDescription", event.target.value)}
          aria-required="true"
          aria-invalid={errors.projectDescription ? true : undefined}
          aria-describedby={describedBy(
            fieldId("projectDescription"),
            true,
            Boolean(errors.projectDescription),
          )}
          className={cn(
            INPUT_CLASS,
            "min-h-32 resize-y",
            errors.projectDescription && "border-red-400",
          )}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id={fieldId("budget")}
          label="Budget"
          hint="Optional, and only if you already have a range in mind."
        >
          <input
            id={fieldId("budget")}
            name="budget"
            type="text"
            value={values.budget}
            onChange={(event) => update("budget", event.target.value)}
            aria-describedby={describedBy(fieldId("budget"), true, false)}
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          id={fieldId("timeline")}
          label="Timeline"
          hint="Optional. A rough aim is more useful than a precise date."
        >
          <input
            id={fieldId("timeline")}
            name="timeline"
            type="text"
            value={values.timeline}
            onChange={(event) => update("timeline", event.target.value)}
            aria-describedby={describedBy(fieldId("timeline"), true, false)}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <Field
        id={fieldId("referenceUrl")}
        label="Reference or existing site"
        hint="Optional. A link that shows the style or the current setup."
        error={errors.referenceUrl}
      >
        <input
          id={fieldId("referenceUrl")}
          name="referenceUrl"
          type="text"
          inputMode="url"
          placeholder="https://"
          value={values.referenceUrl}
          onChange={(event) => update("referenceUrl", event.target.value)}
          aria-invalid={errors.referenceUrl ? true : undefined}
          aria-describedby={describedBy(
            fieldId("referenceUrl"),
            true,
            Boolean(errors.referenceUrl),
          )}
          className={cn(INPUT_CLASS, errors.referenceUrl && "border-red-400")}
        />
      </Field>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Submit enquiry"}
        </Button>
        <p className="text-xs leading-relaxed text-muted">
          Your details are stored so we can reply. Read the{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-accent-600 underline decoration-accent-500/40 underline-offset-4 transition-colors hover:text-brand-900"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
