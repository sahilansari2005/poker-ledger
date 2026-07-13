export function toApiOrdering(sortOrder) {
  return sortOrder === "asc" ? "date" : "-date"
}
