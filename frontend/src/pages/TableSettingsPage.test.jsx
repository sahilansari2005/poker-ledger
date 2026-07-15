import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import TableSettingsPage from "./TableSettingsPage"

const navigateMock = vi.fn()
const updateMutate = vi.fn()
const deleteMutate = vi.fn()
const rotateMutate = vi.fn()
const revokeMutate = vi.fn()
const removeMembershipMutate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ id: "7" }),
  }
})

vi.mock("@/lib/queries", () => ({
  useTable: vi.fn(),
  useTableSessions: vi.fn(() => ({ data: [], isLoading: false })),
  useUpdateTable: vi.fn(() => ({ mutate: updateMutate, isPending: false })),
  useDeleteTable: vi.fn(() => ({ mutate: deleteMutate, isPending: false })),
  useShareLink: vi.fn(() => ({ data: { share_token: null } })),
  useRotateShareLink: vi.fn(() => ({ mutate: rotateMutate, isPending: false })),
  useRevokeShareLink: vi.fn(() => ({ mutate: revokeMutate, isPending: false })),
  useTableMemberships: vi.fn(() => ({ data: [] })),
  useRemoveMembership: vi.fn(() => ({ mutate: removeMembershipMutate, isPending: false })),
}))

vi.mock("@/lib/tableExport", () => ({
  exportTableToJson: vi.fn(),
}))

vi.mock("@/components/layout/PageHeader", () => ({
  default: ({ title, subtitle }) => (
    <header>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </header>
  ),
}))

vi.mock("@/components/ui/ConfirmDialog", () => ({
  default: () => null,
}))

vi.mock("@/components/reactbits/SpotlightCard", () => ({
  default: ({ children, ...props }) => <div {...props}>{children}</div>,
}))

vi.mock("@/components/reactbits/SectionPill", () => ({
  default: ({ text }) => <span>{text}</span>,
}))

vi.mock("@/components/CurrencySelect", () => ({
  default: ({ id, value, onChange }) => (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Currency">
      <option value="GBP">GBP</option>
      <option value="USD">USD</option>
    </select>
  ),
}))

import { useTable, useShareLink, useTableMemberships } from "@/lib/queries"
import { exportTableToJson } from "@/lib/tableExport"

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={["/table/7/settings"]}>
      <Routes>
        <Route path="/table/:id/settings" element={<TableSettingsPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe("TableSettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTable.mockReturnValue({
      data: {
        id: 7,
        name: "Friday Night",
        currency: "GBP",
        default_buy_in: "20.00",
        default_buy_in_b: "40.00",
        role: "owner",
        members: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
      },
      isLoading: false,
    })
    useShareLink.mockReturnValue({ data: { share_token: null } })
    useTableMemberships.mockReturnValue({ data: [] })
  })

  it("blocks viewers from editing settings", () => {
    useTable.mockReturnValue({
      data: {
        id: 7,
        name: "Friday Night",
        currency: "GBP",
        role: "viewer",
        members: [],
      },
      isLoading: false,
    })

    renderSettings()

    expect(screen.getByText("Only the table owner can change these.")).toBeInTheDocument()
    expect(screen.queryByLabelText("Table name")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /save changes/i })).not.toBeInTheDocument()
  })

  it("lets owners edit general settings and generate a share link", async () => {
    const user = userEvent.setup()
    renderSettings()

    expect(screen.getByLabelText("Table name")).toHaveValue("Friday Night")
    expect(screen.getByLabelText("Members")).toHaveValue("Alice, Bob")

    await user.clear(screen.getByLabelText("Table name"))
    await user.type(screen.getByLabelText("Table name"), "Saturday Night")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(updateMutate).toHaveBeenCalledWith(
      {
        name: "Saturday Night",
        memberNames: ["Alice", "Bob"],
        currency: "GBP",
        defaultBuyIn: "20.00",
        defaultBuyInB: "40.00",
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    )

    await user.click(screen.getByRole("button", { name: /generate share link/i }))
    expect(rotateMutate).toHaveBeenCalled()
  })

  it("exports JSON and shows members with access when sharing is enabled", async () => {
    const user = userEvent.setup()
    useShareLink.mockReturnValue({ data: { share_token: "abc123token" } })
    useTableMemberships.mockReturnValue({
      data: [{ id: 9, user_email: "viewer@test.com", role: "viewer" }],
    })

    renderSettings()

    expect(screen.getByDisplayValue(/\/shared\/abc123token$/)).toBeInTheDocument()
    expect(screen.getByText("viewer@test.com")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /export json/i }))
    expect(exportTableToJson).toHaveBeenCalledWith(
      expect.objectContaining({ id: 7, name: "Friday Night" }),
      []
    )

    await user.click(screen.getByRole("button", { name: /remove/i }))
    expect(removeMembershipMutate).toHaveBeenCalledWith(9)
  })

  it("shows not found when the table is missing", async () => {
    const user = userEvent.setup()
    useTable.mockReturnValue({ data: undefined, isLoading: false })

    renderSettings()

    expect(screen.getByText("Table not found")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /go back home/i }))
    expect(navigateMock).toHaveBeenCalledWith("/tables")
  })
})
