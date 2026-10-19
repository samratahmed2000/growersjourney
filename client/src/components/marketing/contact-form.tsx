"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/content/services";
import { SITE } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/**
 * Contact form — UI only, by explicit instruction for this task.
 *
 * It deliberately does NOT fake a submission. There is no endpoint yet, so
 * after a valid submit the page says plainly that nothing was sent and offers
 * the direct email and phone instead. A fake "Thanks, we'll be in touch"
 * message would be a lie to the visitor, so there is no success state here.
 *
 * When the backend route exists, replace `handleSubmit`'s last step with a
 * fetch to the API and keep the same validation rules on the server.
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

/** Deliberately permissive: a stricter pattern rejects valid addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.fullName.trim().length < 2) {
    errors.fullName = "Please enter your name.";
  }

  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (values.projectDescription.trim().length < 20) {
    errors.projectDescription =
      "Please describe the project in at least a sentence or two.";
  }

  return errors;
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
  const [noticeVisible, setNoticeVisible] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  const fieldId = (name: keyof FormValues) => `${uid}-${name}`;
  const errorCount = Object.keys(errors).length;

  function update(name: keyof FormValues, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setAttempted(true);

    if (Object.keys(nextErrors).length > 0) {
      setNoticeVisible(false);
      const firstInvalid = Object.keys(nextErrors)[0] as keyof FormValues;
      document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }

    // Nothing is transmitted: this form has no backend yet, by design.
    setNoticeVisible(true);
    window.requestAnimationFrame(() => noticeRef.current?.focus());
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {attempted && errorCount > 0 ? (
        <div
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

        <Field id={fieldId("email")} label="Email" required error={errors.email}>
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
          hint="Shown on nothing until we reply — it just helps us understand the context."
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

        <Field id={fieldId("service")} label="Service you are interested in">
          <select
            id={fieldId("service")}
            name="service"
            value={values.service}
            onChange={(event) => update("service", event.target.value)}
            className={cn(INPUT_CLASS, "pr-8")}
          >
            <option value="">Not sure yet</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.title}
              </option>
            ))}
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
      >
        <input
          id={fieldId("referenceUrl")}
          name="referenceUrl"
          type="text"
          inputMode="url"
          placeholder="https://"
          value={values.referenceUrl}
          onChange={(event) => update("referenceUrl", event.target.value)}
          aria-describedby={describedBy(fieldId("referenceUrl"), true, false)}
          className={INPUT_CLASS}
        />
      </Field>

      <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:gap-4">
        <Button type="submit" size="lg">
          Submit enquiry
        </Button>
        <p className="text-xs leading-relaxed text-muted">
          Not connected yet. Submitting does not send anything — it will show
          the direct contact details instead.
        </p>
      </div>

      {noticeVisible ? (
        <div
          ref={noticeRef}
          tabIndex={-1}
          role="status"
          className="rounded-xl border border-brand-900/15 bg-brand-900/5 p-5"
        >
          <h2 className="text-base font-semibold text-ink">
            Nothing was sent — this form is not connected yet
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your entries stayed in the browser and were not submitted or stored
            anywhere. The form will be connected to the backend later. For now,
            please use one of these:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${SITE.contact.email}`}
                className="inline-flex items-center gap-2 font-medium text-accent-600 transition-colors hover:text-brand-900"
              >
                <Mail aria-hidden="true" className="size-4" />
                <span className="break-all">{SITE.contact.email}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${SITE.contact.phone}`}
                className="inline-flex items-center gap-2 font-medium text-accent-600 transition-colors hover:text-brand-900"
              >
                <Phone aria-hidden="true" className="size-4" />
                {SITE.contact.phoneDisplay}
              </a>
            </li>
          </ul>
        </div>
      ) : null}
    </form>
  );
}
