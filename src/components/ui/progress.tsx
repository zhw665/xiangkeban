export function Progress({ value, label }: { value: number; label?: string }) {
  const normalized = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      {label ? <div className="flex justify-between text-xs text-zinc-500"><span>{label}</span><span>{normalized}%</span></div> : null}
      <div className="h-2 overflow-hidden rounded bg-zinc-100" role="progressbar" aria-valuenow={normalized} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded bg-emerald-600" style={{ width: `${normalized}%` }} />
      </div>
    </div>
  );
}
