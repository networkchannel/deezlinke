export function Equalizer({ count = 5, color = "#6366F1", height = 24 }) {
  return (
    <div
      className="flex items-end gap-[2px]"
      style={{ height }}
      aria-hidden="true"
      data-testid="equalizer"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="eq-bar"
          style={{
            background: color,
            animationDelay: `${i * 0.12}s`,
            width: 3,
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}
