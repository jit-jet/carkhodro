/**
 * Small shared UI atoms for the admin panel — plain Tailwind, no external
 * component library (matches the rest of the codebase). Kept directive-free
 * so both server and client admin components can import them.
 */

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TdHTMLAttributes,
  TextareaHTMLAttributes,
  ThHTMLAttributes,
} from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-100 ${className}`}
    >
      <div className="min-w-0">
        <h2 className="text-base font-bold text-charcoal">{title}</h2>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
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
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-5 border-b border-gray-200/70">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`text-base font-bold text-charcoal mb-4 ${className}`}>{children}</h2>;
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
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent hover:bg-accent-dark text-charcoal shadow-sm shadow-accent/20",
  secondary: "bg-charcoal hover:bg-charcoal/90 text-white",
  danger: "bg-red-50 hover:bg-red-100 text-red-600 border border-red-100",
  ghost: "bg-white hover:bg-silver-light text-charcoal border border-gray-200",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "rounded-lg px-2.5 py-1.5 text-xs font-bold",
  md: "rounded-xl px-4 py-2.5 text-sm font-bold",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_SIZES[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
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

export function Toolbar({
  children,
  className = "",
  tone = "default",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "default" | "accent";
}) {
  const tones = {
    default: "bg-white border-gray-200/80",
    accent: "bg-amber-50/80 border-amber-100",
  };
  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${tones[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      <div className="w-10 h-10 rounded-xl bg-silver-light flex items-center justify-center text-gray-400">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      </div>
      <p className="text-sm text-gray-500">{message}</p>
      {action}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5" role="alert">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-3.5 py-2.5"
      role="status"
    >
      {message}
    </p>
  );
}

/** Shared table surface: card + horizontal scroll */
export function TableShell({
  children,
  className = "",
  minWidth,
}: {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${minWidth ?? ""}`}>{children}</table>
      </div>
    </Card>
  );
}

export function Th({
  children,
  className = "",
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...rest}
      className={`text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-gray-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...rest} className={`px-4 py-3 text-charcoal align-middle ${className}`}>
      {children}
    </td>
  );
}

export const tableHeadClass = "bg-gray-50/90 border-b border-gray-100 text-gray-500";
export const tableBodyClass = "divide-y divide-gray-100";
export const tableRowClass = "hover:bg-amber-50/40 transition-colors";

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
        size="sm"
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
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="!px-3"
      >
        بعدی
      </Button>
    </div>
  );
}
