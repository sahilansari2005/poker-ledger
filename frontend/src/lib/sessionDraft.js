const draftKey = (sessionId) => `poker-ledger:session-draft:${sessionId}`

export function getSessionDraft(sessionId) {
  if (!sessionId) return null
  try {
    const raw = sessionStorage.getItem(draftKey(sessionId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setSessionDraft(sessionId, draft) {
  if (!sessionId) return
  sessionStorage.setItem(draftKey(sessionId), JSON.stringify(draft))
}

export function clearSessionDraft(sessionId) {
  if (!sessionId) return
  sessionStorage.removeItem(draftKey(sessionId))
}

export function mergeCashOutDraft(existing, players) {
  const next = { ...existing }
  for (const player of players) {
    if (!(player.id in next)) {
      next[player.id] = player.cash_out !== null ? String(player.cash_out) : ""
    }
  }
  return next
}
