export default function Avatar({
  name,
  color,
  size = 40,
  className = "",
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
}) {
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
