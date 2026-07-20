export default function BulletList({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

  return (
    <ul className={`space-y-1 ${className}`}>
      {lines.map((line, i) => (
        <li key={i} className="flex gap-1.5">
          <span className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500">•</span>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
