const STORAGE_KEY = "poker-ledger-session-sort"

export function loadSessionSortOrder() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === "asc" ? "asc" : "desc"
  } catch {
    return "desc"
  }
}

export function saveSessionSortOrder(order) {
  localStorage.setItem(STORAGE_KEY, order === "asc" ? "asc" : "desc")
}

export function toApiOrdering(sortOrder) {
  return sortOrder === "asc" ? "date" : "-date"
}
