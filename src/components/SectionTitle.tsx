import type { ReactNode } from "react";

type SectionTitleProps = {
  description?: string;
  icon?: ReactNode;
  title: string;
};

export function SectionTitle({ description, icon, title }: SectionTitleProps) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
        {icon}
        {title}
      </h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
    </div>
  );
}
