import Aurora from "@/components/reactbits/Aurora"

/** Masked aurora (or static radial fallback) for marketing/auth surfaces. */
export default function AuroraBackdrop({
  reduce = false,
  colorStops = ["#3A29FF", "#7CA6F5", "#5227FF"],
  amplitude = 1.0,
  blend = 0.55,
  speed = 0.6,
  className = "pointer-events-none absolute inset-x-0 top-0 h-[62%]",
}) {
  return (
    <div
      aria-hidden
      className={className}
      style={{
        maskImage: "linear-gradient(to bottom, black 55%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, black 55%, transparent)",
      }}
    >
      {reduce ? (
        <div className="h-full w-full bg-[radial-gradient(ellipse_75%_70%_at_50%_-10%,oklch(0.48_0.2_252_/_0.35),transparent)]" />
      ) : (
        <Aurora colorStops={colorStops} amplitude={amplitude} blend={blend} speed={speed} />
      )}
    </div>
  )
}
