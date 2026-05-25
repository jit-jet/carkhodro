interface SectionTitleProps {
  title: string;
  subtitle?: string;
  linkHref?: string;
  linkLabel?: string;
}

export default function SectionTitle({ title, subtitle, linkHref, linkLabel }: SectionTitleProps) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-1 h-7 bg-accent rounded-full" />
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 me-4">{subtitle}</p>
        )}
      </div>
      {linkHref && linkLabel && (
        <a
          href={linkHref}
          className="text-sm font-medium text-accent-dark hover:text-accent border border-accent-dark hover:border-accent rounded-lg px-4 py-2 transition-colors whitespace-nowrap"
        >
          {linkLabel}
          <span className="me-1"> ←</span>
        </a>
      )}
    </div>
  );
}
