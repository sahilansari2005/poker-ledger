const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"

function getToken() {
  return localStorage.getItem("access_token")
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) throw new Error("No refresh token")

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })

  if (!res.ok) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    window.location.href = "/login"
    throw new Error("Session expired")
  }

  const data = await res.json()
  localStorage.setItem("access_token", data.access)
  return data.access
}

async function request(path, options = {}, retry = true) {
  const token = getToken()
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Token expired — refresh and retry once
  if (res.status === 401 && retry) {
    try {
      await refreshAccessToken()
      return request(path, options, false)
    } catch {
      throw new Error("Session expired. Please log in again.")
    }
  }

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

// Auth
export const authApi = {
  register: (username, email, password) =>
    request("/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: async (username, password) => {
    const data = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem("access_token", data.access)
    localStorage.setItem("refresh_token", data.refresh)
    return data
  },

  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },

  me: () => request("/auth/me/"),
}

// Tables
export const tablesApi = {
  list: () => request("/tables/"),

  create: (name, defaultBuyIn, memberNames) =>
    request("/tables/", {
      method: "POST",
      body: JSON.stringify({
        name,
        default_buy_in: defaultBuyIn,
        member_names: memberNames,
      }),
    }),

  update: (id, name, defaultBuyIn, memberNames) =>
    request(`/tables/${id}/`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        default_buy_in: defaultBuyIn,
        member_names: memberNames,
      }),
    }),

  destroy: (id) =>
    request(`/tables/${id}/`, { method: "DELETE" }),

  invite: (tableId, username) =>
    request(`/tables/${tableId}/invite/`, {
      method: "POST",
      body: JSON.stringify({ username }),
    }),

  removeCollaborator: (tableId, userId) =>
    request(`/tables/${tableId}/collaborators/${userId}/`, { method: "DELETE" }),

  listSessions: (tableId) =>
    request(`/tables/${tableId}/sessions/`),

  createSession: (tableId, playerNames) =>
    request(`/tables/${tableId}/sessions/`, {
      method: "POST",
      body: JSON.stringify({ player_names: playerNames }),
    }),
}

// Sessions
export const sessionsApi = {
  get: (id) => request(`/sessions/${id}/`),

  destroy: (id) =>
    request(`/sessions/${id}/`, { method: "DELETE" }),

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
