import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sharedApi } from "@/lib/api"
import { queryKeys } from "@/lib/queries/keys"

export function useSharedTable(token) {
  return useQuery({
    queryKey: queryKeys.shared(token),
    queryFn: () => sharedApi.get(token),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useJoinTable(token) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => sharedApi.join(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables })
      queryClient.invalidateQueries({ queryKey: queryKeys.shared(token) })
    },
  })
}
