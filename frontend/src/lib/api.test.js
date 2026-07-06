import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { setAuthTokenGetter, tablesApi } from "./api.js"

describe("api request helper", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
    setAuthTokenGetter(async () => null)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("lists tables from /api/tables/", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, name: "Friday Night" }],
    })

    const data = await tablesApi.list()

    expect(fetch).toHaveBeenCalledWith("/api/tables/", {
      headers: { "Content-Type": "application/json" },
    })
    expect(data).toEqual([{ id: 1, name: "Friday Night" }])
  })

  it("sends Authorization header when a token getter is set", async () => {
    setAuthTokenGetter(async () => "test-token")

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    })

    await tablesApi.list()

    expect(fetch).toHaveBeenCalledWith("/api/tables/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-token",
      },
    })
  })

  it("creates a table with POST /api/tables/", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 2, name: "Sunday Game" }),
    })

    const data = await tablesApi.create("Sunday Game", 20, ["Alice"])

    expect(fetch).toHaveBeenCalledWith("/api/tables/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sunday Game",
        default_buy_in: 20,
        member_names: ["Alice"],
      }),
    })
    expect(data.name).toBe("Sunday Game")
  })

  it("surfaces API errors", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ name: ["This field is required."] }),
    })

    await expect(tablesApi.create("", 10, [])).rejects.toThrow("This field is required.")
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

describe("local env", () => {
  it("does not point VITE_API_URL at a hardcoded dead port", () => {
    const envLocalPath = resolve(process.cwd(), ".env.local")
    let envLocal = ""
    try {
      envLocal = readFileSync(envLocalPath, "utf8")
    } catch {
      return
    }

    expect(envLocal).not.toMatch(/VITE_API_URL=.*8888/)
    expect(envLocal).not.toMatch(/VITE_API_URL=http:\/\/127\.0\.0\.1:8000\/api/)
  })
})
