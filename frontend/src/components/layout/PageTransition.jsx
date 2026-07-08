import { useLocation } from "react-router-dom"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"

export default function PageTransition({ children }) {
  const { pathname } = useLocation()
  const isMobile = useIsMobile()

  if (isMobile) {
    return <div key={pathname}>{children}</div>
  }

  return <div className="page-enter">{children}</div>
}
