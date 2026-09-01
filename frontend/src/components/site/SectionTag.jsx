export const SectionTag = ({ num, label }) => (
  <div className="mb-10 flex items-center gap-4" data-testid={`section-tag-${num}`}>
    <span className="font-mono text-xs text-brass">{num}</span>
    <span className="h-px w-12 bg-brass/40" />
    <span className="text-xs uppercase tracking-[0.25em] text-ash">{label}</span>
  </div>
);
