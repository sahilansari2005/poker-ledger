import { useReducedMotion } from "framer-motion"
import ShinyText from "@/components/reactbits/ShinyText"

/** Small shiny eyebrow pill for section labels across the app. */
export default function SectionPill({ text, className = "" }) {
  const reduce = useReducedMotion()

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 backdrop-blur-sm ${className}`}
    >
      <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      <ShinyText
        disabled={reduce}
        text={text}
        speed={3.5}
        className="text-[0.65rem] font-medium uppercase tracking-[0.16em]"
        color="#8fa3c8"
        shineColor="#eef3ff"
      />
    </span>
  )
}
