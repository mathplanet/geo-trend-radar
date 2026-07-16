export default function InfoTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tooltip relative inline-flex cursor-help items-center gap-1">
      {label}
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
        i
      </span>
      <span
        className="pointer-events-none absolute top-full left-0 z-10 mt-2 w-64 rounded-lg bg-neutral-900 px-3 py-2 text-xs leading-relaxed font-normal text-neutral-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 dark:bg-neutral-100 dark:text-neutral-900"
      >
        {children}
      </span>
    </span>
  );
}
