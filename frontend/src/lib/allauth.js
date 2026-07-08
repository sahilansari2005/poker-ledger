import { getCSRFToken } from "./django"

const BASE_URL = "/_allauth/browser/v1"
const ACCEPT_JSON = { accept: "application/json" }

async function request(method, path, data) {
  const headers = { ...ACCEPT_JSON }
  if (method !== "GET") {
    headers["X-CSRFToken"] = getCSRFToken()
    headers["Content-Type"] = "application/json"
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })

  const payload = await response.json()
  return { status: response.status, ok: response.ok, data: payload }
}

export async function getConfig() {
  return request("GET", "/config")
}

export async function getSession() {
  return request("GET", "/auth/session")
}

export async function login(email, password) {
  return request("POST", "/auth/login", { email, password })
}

export async function signup(email, password) {
  return request("POST", "/auth/signup", { email, password })
}

export async function logout() {
  return request("DELETE", "/auth/session")
}

export function isAuthenticatedSession(response) {
  return response?.data?.meta?.is_authenticated === true
}

export function parseAllauthErrors(response) {
  const errors = response?.data?.errors
  if (Array.isArray(errors) && errors.length > 0) {
    return errors.map((entry) => entry.message || entry.code).join(" ")
  }
  return "Something went wrong. Please try again."
}
