import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sessionsApi, tablesApi } from "@/lib/api"

export const queryKeys = {
  tables: ["tables"],
  table: (id) => ["tables", id],
  tableSessions: (id) => ["tables", id, "sessions"],
  session: (id) => ["sessions", id],
}

export function useTables() {
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: tablesApi.list,
  })
}

export function useTable(id) {
  return useQuery({
    queryKey: queryKeys.table(id),
    queryFn: () => tablesApi.get(id),
    enabled: Boolean(id),
  })
}

export function useTableSessions(tableId) {
  return useQuery({
    queryKey: queryKeys.tableSessions(tableId),
    queryFn: () => tablesApi.listSessions(tableId),
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
    mutationFn: (playerNames) => tablesApi.createSession(tableId, playerNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tableSessions(tableId) })
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
    },
  })
}

export function useCompleteSession(sessionId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cashOuts) => sessionsApi.complete(sessionId, cashOuts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.session(sessionId) })
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
