import { getCSRFToken } from "./django"

const BASE_URL = import.meta.env.VITE_API_URL || "/api"

function extractErrorMessage(data) {
  if (!data || typeof data !== "object") return String(data)
  const messages = []
  function collect(val) {
    if (typeof val === "string") messages.push(val)
    else if (Array.isArray(val)) val.forEach(collect)
    else if (typeof val === "object" && val !== null) Object.values(val).forEach(collect)
  }
  collect(data)
  return messages.join(" ")
}

async function request(path, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (method !== "GET" && method !== "HEAD") {
    headers["X-CSRFToken"] = getCSRFToken()
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  })

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    const message = data?.detail || extractErrorMessage(data) || "Something went wrong"
    throw new Error(message)
  }

  return data
}

export const meApi = {
  get: () => request("/me/"),

  update: (fields) =>
    request("/me/", {
      method: "PATCH",
      body: JSON.stringify(fields),
    }),

  ingest: (payload) =>
    request("/me/ingest/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
}

export const tablesApi = {
  list: () => request("/tables/"),

  get: (id) => request(`/tables/${id}/`),

  create: (name, memberNames, currency) =>
    request("/tables/", {
      method: "POST",
      body: JSON.stringify({
        name,
        member_names: memberNames,
        currency: currency || undefined,
      }),
    }),

  update: (id, name, memberNames, currency) =>
    request(`/tables/${id}/`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        member_names: memberNames,
        currency,
      }),
    }),

  destroy: (id) => request(`/tables/${id}/`, { method: "DELETE" }),

  listSessions: (tableId, ordering = "-date") => {
    const params = new URLSearchParams({ ordering })
    return request(`/tables/${tableId}/sessions/?${params}`)
  },

  createSession: (tableId, playerNames, date) =>
    request(`/tables/${tableId}/sessions/`, {
      method: "POST",
      body: JSON.stringify({
        player_names: playerNames,
        ...(date ? { date } : {}),
      }),
    }),

  getShareLink: (id) => request(`/tables/${id}/share-link/`),

  rotateShareLink: (id) => request(`/tables/${id}/share-link/`, { method: "POST" }),

  revokeShareLink: (id) => request(`/tables/${id}/share-link/`, { method: "DELETE" }),

  listMemberships: (id) => request(`/tables/${id}/memberships/`),

  removeMembership: (id, membershipId) =>
    request(`/tables/${id}/memberships/${membershipId}/`, { method: "DELETE" }),

  leave: (id) => request(`/tables/${id}/leave/`, { method: "POST" }),

  listRequests: (id) => request(`/tables/${id}/requests/`),

  createRequest: (id, { session, message }) =>
    request(`/tables/${id}/requests/`, {
      method: "POST",
      body: JSON.stringify({ session: session ?? null, message }),
    }),

  resolveRequest: (id, requestId, { status, resolutionNote }) =>
    request(`/tables/${id}/requests/${requestId}/resolve/`, {
      method: "POST",
      body: JSON.stringify({ status, resolution_note: resolutionNote || "" }),
    }),
}

export const sharedApi = {
  get: (token) => request(`/shared/${token}/`),

  join: (token) => request(`/shared/${token}/join/`, { method: "POST" }),
}

export const sessionsApi = {
  get: (id) => request(`/sessions/${id}/`),

  update: (id, fields) =>
    request(`/sessions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(fields),
    }),

  destroy: (id) => request(`/sessions/${id}/`, { method: "DELETE" }),

  addBuyIn: (sessionId, playerId, amount) =>
    request(`/sessions/${sessionId}/buy-in/`, {
      method: "POST",
      body: JSON.stringify({ player_id: playerId, amount }),
    }),

  addPlayer: (sessionId, name) =>
    request(`/sessions/${sessionId}/add-player/`, {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  complete: (sessionId, cashOuts, { allowDiscrepancy = false } = {}) =>
    request(`/sessions/${sessionId}/complete/`, {
      method: "POST",
      body: JSON.stringify({
        cash_outs: cashOuts,
        allow_discrepancy: allowDiscrepancy,
      }),
    }),

  adjust: (sessionId, players, { allowDiscrepancy = false } = {}) =>
    request(`/sessions/${sessionId}/adjust/`, {
      method: "POST",
      body: JSON.stringify({
        players,
        allow_discrepancy: allowDiscrepancy,
      }),
    }),

  auditLog: (sessionId) => request(`/sessions/${sessionId}/audit-log/`),
}
