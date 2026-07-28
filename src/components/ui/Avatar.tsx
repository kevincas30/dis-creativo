function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

export default function Avatar({
  name,
  avatarUrl,
  className = "h-8 w-8 text-xs",
}: {
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  if (avatarUrl) {
    // Data URL en base64: next/image no lo optimiza, un <img> plano es lo correcto aquí.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={name} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }

  return (
    <span
      className={`bg-accent-soft text-foreground flex shrink-0 items-center justify-center rounded-full font-semibold ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
