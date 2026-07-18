/**
 * Small shared UI atoms for the admin panel — plain Tailwind, no external
 * component library (matches the rest of the codebase). Kept directive-free
 * so both server and client admin components can import them.
 */

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-charcoal mb-1.5">{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-charcoal placeholder:text-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors resize-y ${className}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-charcoal focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-colors bg-white ${className}`}
    >
      {children}
    </select>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent hover:bg-accent-dark text-charcoal",
  secondary: "bg-charcoal hover:bg-charcoal/90 text-white",
  danger: "bg-red-50 hover:bg-red-100 text-red-600",
  ghost: "bg-transparent hover:bg-silver-light text-charcoal border border-gray-200",
};

export function Button({
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${className}`}
    />
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    default: "bg-silver-light text-charcoal",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-accent-dark",
    danger: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-bold ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="text-sm text-gray-400 text-center py-10">{message}</p>;
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5" role="alert">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-green-700 bg-green-50 rounded-xl px-3.5 py-2.5" role="status">
      {message}
    </p>
  );
}

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="ghost"
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="!px-3"
      >
        قبلی
      </Button>
      <span className="text-sm text-gray-500 px-2">
        صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}
      </span>
      <Button
        variant="ghost"
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="!px-3"
      >
        بعدی
      </Button>
    </div>
  );
}
