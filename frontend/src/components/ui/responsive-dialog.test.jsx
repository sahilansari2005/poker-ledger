import { describe, it, expect, vi, beforeEach } from "vitest"
import React, { useState } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog"
import { Button } from "@/components/ui/button"

const mediaQueryMock = vi.fn()

vi.mock("@/lib/hooks/useMediaQuery", () => ({
  useIsMobile: () => mediaQueryMock(),
}))

function CreateTableDialog({ open, onOpenChange }) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>New Poker Table</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Set up stakes and add members.</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button type="button">Create Table</Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

describe("ResponsiveDialog", () => {
  beforeEach(() => {
    mediaQueryMock.mockReset()
  })

  it("opens on desktop without throwing", async () => {
    mediaQueryMock.mockReturnValue(false)

    render(<CreateTableDialog open onOpenChange={() => {}} />)

    expect(await screen.findByText("New Poker Table")).toBeInTheDocument()
    expect(screen.getByText("Set up stakes and add members.")).toBeInTheDocument()
  })

  it("opens on mobile without throwing", async () => {
    mediaQueryMock.mockReturnValue(true)

    render(<CreateTableDialog open onOpenChange={() => {}} />)

    expect(await screen.findByText("New Poker Table")).toBeInTheDocument()
    expect(screen.getByText("Set up stakes and add members.")).toBeInTheDocument()
  })

  it("opens from closed state on mobile without portal errors", async () => {
    mediaQueryMock.mockReturnValue(true)
    const user = userEvent.setup()

    function Harness() {
      const [open, setOpen] = useState(false)

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <ResponsiveDialog open={open} onOpenChange={setOpen}>
            <ResponsiveDialogContent>
              <ResponsiveDialogTitle>Drawer Title</ResponsiveDialogTitle>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </>
      )
    }

    render(<Harness />)
    await user.click(screen.getByRole("button", { name: "Open" }))
    expect(await screen.findByText("Drawer Title")).toBeInTheDocument()
  })
})
