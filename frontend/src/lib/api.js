const BASE_URL = import.meta.env.VITE_API_URL || "/api"

let authTokenGetter = async () => null

export function setAuthTokenGetter(getter) {
  authTokenGetter = getter
}

async function request(path, options = {}) {
  const token = await authTokenGetter()
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 204) return null

  const data = await res.json()

  if (!res.ok) {
    const message =
      data?.detail ||
      Object.values(data).flat().join(" ") ||
      "Something went wrong"
    throw new Error(message)
  }

  return data
}

export const tablesApi = {
  list: () => request("/tables/"),

  get: (id) => request(`/tables/${id}/`),

  create: (name, defaultBuyIn, memberNames, currency) =>
    request("/tables/", {
      method: "POST",
      body: JSON.stringify({
        name,
        default_buy_in: defaultBuyIn,
        member_names: memberNames,
        currency: currency || undefined,
      }),
    }),

  update: (id, name, defaultBuyIn, memberNames, currency) =>
    request(`/tables/${id}/`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        default_buy_in: defaultBuyIn,
        member_names: memberNames,
        currency,
      }),
    }),

  destroy: (id) => request(`/tables/${id}/`, { method: "DELETE" }),

  listSessions: (tableId) => request(`/tables/${tableId}/sessions/`),

  createSession: (tableId, playerNames) =>
    request(`/tables/${tableId}/sessions/`, {
      method: "POST",
      body: JSON.stringify({ player_names: playerNames }),
    }),
}

export const sessionsApi = {
  get: (id) => request(`/sessions/${id}/`),

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

  complete: (sessionId, cashOuts) =>
    request(`/sessions/${sessionId}/complete/`, {
      method: "POST",
      body: JSON.stringify({ cash_outs: cashOuts }),
    }),
}
