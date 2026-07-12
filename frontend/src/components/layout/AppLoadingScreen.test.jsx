import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import AppLoadingScreen from "./AppLoadingScreen"

vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
}))

vi.mock("@/components/reactbits/AuroraBackdrop", () => ({
  default: () => <div data-testid="aurora" />,
}))

vi.mock("@/components/reactbits/SpotlightCard", () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock("@/components/reactbits/SectionPill", () => ({
  default: ({ text }) => <span>{text}</span>,
}))

describe("AppLoadingScreen", () => {
  it("renders brand and custom loading label", () => {
    render(<AppLoadingScreen label="Opening table" />)

    expect(screen.getByLabelText("Opening table")).toBeInTheDocument()
    expect(screen.getByText("Poker Ledger")).toBeInTheDocument()
    expect(screen.getByText("Opening table")).toBeInTheDocument()
  })
})
