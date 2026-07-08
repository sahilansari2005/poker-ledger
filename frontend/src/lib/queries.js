import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { meApi, sessionsApi, tablesApi } from "@/lib/api"
import { toApiOrdering } from "@/lib/sessionSort"

export const queryKeys = {
  me: ["me"],
  tables: ["tables"],
  table: (id) => ["tables", id],
  tableSessions: (id, sortOrder = "desc") => ["tables", id, "sessions", sortOrder],
  session: (id) => ["sessions", id],
  sessionAuditLog: (id) => ["sessions", id, "audit-log"],
}

export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: tablesApi.list,
  })
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: meApi.get,
    staleTime: 60_000,
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fields) => meApi.update(fields),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated)
    },
  })
}

export function useIngestData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => meApi.ingest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables })
    },
  })
}

export function useTable(id) {
  return useQuery({
    queryKey: queryKeys.table(id),
    queryFn: () => tablesApi.get(id),
    enabled: Boolean(id),
  })
}

export function useTableSessions(tableId, sortOrder = "desc") {
  return useQuery({
    queryKey: queryKeys.tableSessions(tableId, sortOrder),
    queryFn: () => tablesApi.listSessions(tableId, toApiOrdering(sortOrder)),
    enabled: Boolean(tableId),
  })
}

export function useSession(id) {
  return useQuery({
    queryKey: queryKeys.session(id),
    queryFn: () => sessionsApi.get(id),
    enabled: Boolean(id),
  })
}

export function useSessionAuditLog(sessionId) {
  return useQuery({
    queryKey: queryKeys.sessionAuditLog(sessionId),
    queryFn: () => sessionsApi.auditLog(sessionId),
    enabled: Boolean(sessionId),
  })
}

export function useCreateTable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, buyIn, memberNames, currency }) =>
      tablesApi.create(name, buyIn, memberNames, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables })
    },
  })
}

export function useUpdateTable(tableId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, buyIn, memberNames, currency }) =>
      tablesApi.update(tableId, name, buyIn, memberNames, currency),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.table(tableId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.tables })
    },
  })
}

export function useCreateSession(tableId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playerNames, date }) => tablesApi.createSession(tableId, playerNames, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables", tableId, "sessions"] })
    },
  })
}

export function useUpdateSession(sessionId, tableId) {
  const queryClient = useQueryClient()

  const patchCaches = (date, fullSession = null, { resort = false } = {}) => {
    const sessionKey = queryKeys.session(sessionId)
    const currentSession = queryClient.getQueryData(sessionKey)
    if (currentSession) {
      queryClient.setQueryData(sessionKey, fullSession ?? { ...currentSession, date })
    }

    if (!tableId) return

    const queries = queryClient.getQueriesData({ queryKey: ["tables", tableId, "sessions"] })
    for (const [key, data] of queries) {
      if (!Array.isArray(data)) continue
      let next = data.map((s) =>
        String(s.id) === String(sessionId) ? (fullSession ?? { ...s, date }) : s
      )
      if (resort) {
        const sortOrder = key[3] || "desc"
        next = [...next].sort((a, b) => {
          const cmp = a.date.localeCompare(b.date)
          if (cmp !== 0) return sortOrder === "asc" ? cmp : -cmp
          return String(b.created_at || "").localeCompare(String(a.created_at || ""))
        })
      }
      queryClient.setQueryData(key, next)
    }
  }

  return useMutation({
    mutationFn: (date) => sessionsApi.update(sessionId, { date }),
    onMutate: async (date) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session(sessionId) })

      const previousSession = queryClient.getQueryData(queryKeys.session(sessionId))
      const previousLists = queryClient
        .getQueriesData({ queryKey: ["tables", tableId, "sessions"] })
        .map(([key, data]) => [key, data])

      patchCaches(date, null, { resort: false })
      return { previousSession, previousLists }
    },
    onError: (_err, _date, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(queryKeys.session(sessionId), context.previousSession)
      }
      for (const [key, data] of context?.previousLists ?? []) {
        queryClient.setQueryData(key, data)
      }
    },
    onSuccess: (updated) => {
      patchCaches(updated.date, updated, { resort: true })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionAuditLog(sessionId) })
    },
  })
}

export function useAddBuyIn(sessionId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ playerId, amount }) => sessionsApi.addBuyIn(sessionId, playerId, amount),
    onMutate: async ({ playerId, amount }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session(sessionId) })

      const previous = queryClient.getQueryData(queryKeys.session(sessionId))

      queryClient.setQueryData(queryKeys.session(sessionId), (old) => {
        if (!old) return old
        return {
          ...old,
          players: old.players.map((p) =>
            p.id === playerId
              ? { ...p, total_buy_in: String(parseFloat(p.total_buy_in) + amount) }
              : p
          ),
        }
      })

      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.session(sessionId), context.previous)
      }
    },
    onSuccess: (updatedPlayer) => {
      queryClient.setQueryData(queryKeys.session(sessionId), (old) => {
        if (!old) return old
        return {
          ...old,
          players: old.players.map((p) => (p.id === updatedPlayer.id ? updatedPlayer : p)),
        }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionAuditLog(sessionId) })
    },
  })
}

export function useAddPlayer(sessionId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name) => sessionsApi.addPlayer(sessionId, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.session(sessionId) })

      const previous = queryClient.getQueryData(queryKeys.session(sessionId))
      const tempId = `temp-${Date.now()}`

      queryClient.setQueryData(queryKeys.session(sessionId), (old) => {
        if (!old) return old
        return {
          ...old,
          players: [
            ...old.players,
            { id: tempId, name, total_buy_in: "0", cash_out: null, _optimistic: true },
          ],
        }
      })

      return { previous, tempId }
    },
    onError: (_err, _name, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.session(sessionId), context.previous)
      }
    },
    onSuccess: (newPlayer, _name, context) => {
      queryClient.setQueryData(queryKeys.session(sessionId), (old) => {
        if (!old) return old
        return {
          ...old,
          players: old.players.map((p) => (p.id === context?.tempId ? newPlayer : p)),
        }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionAuditLog(sessionId) })
    },
  })
}

export function useCompleteSession(sessionId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ cashOuts, allowDiscrepancy = false }) =>
      sessionsApi.complete(sessionId, cashOuts, { allowDiscrepancy }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessionAuditLog(sessionId) })
    },
  })
}

export function useDeleteSession(sessionId, tableId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => sessionsApi.destroy(sessionId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.session(sessionId) })
      if (tableId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tableSessions(tableId) })
      }
    },
  })
}

export function useDeleteTable(tableId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => tablesApi.destroy(tableId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.table(tableId) })
      queryClient.removeQueries({ queryKey: queryKeys.tableSessions(tableId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.tables })
    },
  })
}
