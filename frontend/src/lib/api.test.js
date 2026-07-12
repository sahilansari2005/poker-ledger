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

  it("updates table settings used by the settings page", async () => {
    vi.stubGlobal("document", { cookie: "csrftoken=test-csrf" })
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: 7, name: "Saturday Night", currency: "USD" }),
    })

    await tablesApi.update(7, "Saturday Night", ["Alice", "Bob"], "USD")

    expect(fetch).toHaveBeenCalledWith("/api/tables/7/", {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": "test-csrf",
      },
      body: JSON.stringify({
        name: "Saturday Night",
        member_names: ["Alice", "Bob"],
        currency: "USD",
      }),
    })
  })

  it("manages share links and memberships for table settings", async () => {
    vi.stubGlobal("document", { cookie: "csrftoken=test-csrf" })

    fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ share_token: "tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ share_token: "new-tok" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: 3, user_email: "v@test.com", role: "viewer" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      })

    await expect(tablesApi.getShareLink(7)).resolves.toEqual({ share_token: "tok" })
    await expect(tablesApi.rotateShareLink(7)).resolves.toEqual({ share_token: "new-tok" })
    await tablesApi.revokeShareLink(7)
    await expect(tablesApi.listMemberships(7)).resolves.toEqual([
      { id: 3, user_email: "v@test.com", role: "viewer" },
    ])
    await tablesApi.removeMembership(7, 3)

    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      "/api/tables/7/share-link/",
      "/api/tables/7/share-link/",
      "/api/tables/7/share-link/",
      "/api/tables/7/memberships/",
      "/api/tables/7/memberships/3/",
    ])
  })
})

describe("built service worker", () => {
  it("denylists /api and /_allauth so SPA fallback never caches API traffic", () => {
    const swPath = resolve(
      process.cwd(),
      "../backend/static/frontend/sw.js"
    )
    const swSource = readFileSync(swPath, "utf8")

    expect(swSource).toMatch(/denylist:\[[^\]]*\/api/)
    expect(swSource).toMatch(/denylist:\[[^\]]*\/_allauth/)
    expect(swSource).not.toMatch(/poker-ledger-api/)
    expect(swSource).not.toMatch(/runtimeCaching/)
  })
})
