const BLUR_CLASS = {
  2: "backdrop-blur-[2px]",
  6: "backdrop-blur-[6px]",
  12: "backdrop-blur-[12px]",
  20: "backdrop-blur-[20px]",
};

export default function BlurEdge({ direction = "top", height = "h-24", className = "" }) {
  const toEdge = direction === "top" ? "to top" : "to bottom";

  const layers = [
    { blur: 2, stop: 60 },
    { blur: 6, stop: 40 },
    { blur: 12, stop: 25 },
    { blur: 20, stop: 0 },
  ];

  const positionClass = direction === "top" ? "bottom-20" : "bottom-20";

  return (
    <div className={`pointer-events-none absolute left-0 right-0 ${positionClass} ${height} z-10 ${className}`}>
      {layers.map(({ blur, stop }) => {
        const gradient = `linear-gradient(${toEdge}, black 0%, transparent ${stop}%)`;
        return (
          <div
            key={blur}
            className={`absolute inset-0 ${BLUR_CLASS[blur]}`}
            style={{
              WebkitMaskImage: gradient,
              maskImage: gradient,
            }}
          />
        );
      })}
    </div>
  );
}