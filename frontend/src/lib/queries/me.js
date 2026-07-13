import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { meApi } from "@/lib/api"
import { queryKeys } from "@/lib/queries/keys"

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
