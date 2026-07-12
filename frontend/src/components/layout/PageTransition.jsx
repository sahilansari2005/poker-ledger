/** Stable wrapper so tab switches don't remount the page tree for animation. */
export default function PageTransition({ children }) {
  return <div className="page-enter">{children}</div>
}
