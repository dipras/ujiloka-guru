type MetricProps = {
  detail?: string;
  label: string;
  value: string;
};

export function Metric({ detail, label, value }: MetricProps) {
  return (
    <div className="rounded-lg border border-line bg-white px-4 py-3 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 truncate text-base font-bold text-ink">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}
