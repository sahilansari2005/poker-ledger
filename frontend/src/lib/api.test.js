import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { tablesApi } from "./api.js"

describe("api request helper", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("lists tables from /api/tables/ with credentials", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, name: "Friday Night" }],
    })

    const data = await tablesApi.list()

    expect(fetch).toHaveBeenCalledWith("/api/tables/", {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
    expect(data).toEqual([{ id: 1, name: "Friday Night" }])
  })

  it("sends CSRF header on mutating requests", async () => {
    vi.stubGlobal("document", { cookie: "csrftoken=test-csrf" })

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, name: "Sunday Game" }),
    })

    await tablesApi.create("Sunday Game", ["Alice"])

    expect(fetch).toHaveBeenCalledWith("/api/tables/", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": "test-csrf",
      },
      body: JSON.stringify({
        name: "Sunday Game",
        member_names: ["Alice"],
      }),
    })
  })

  it("surfaces API errors", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ name: ["This field is required."] }),
    })

    await expect(tablesApi.create("", [])).rejects.toThrow("This field is required.")
  })
})

describe("built service worker", () => {
  it("does not cache /api routes (stale workbox causes ERR_FAILED offline)", () => {
    const swPath = resolve(
      process.cwd(),
      "../backend/static/frontend/sw.js"
    )
    const swSource = readFileSync(swPath, "utf8")

    expect(swSource).not.toMatch(/\/api\//)
    expect(swSource).not.toMatch(/poker-ledger-api/)
  })
})
