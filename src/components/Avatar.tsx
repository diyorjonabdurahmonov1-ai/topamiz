export default function Avatar({
  name,
  color,
  avatarUrl,
  size = 40,
  className = "",
}: {
  name: string;
  color: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external Google profile photo, not an optimizable local asset
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className}`}
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
