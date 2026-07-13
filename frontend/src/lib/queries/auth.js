import { useQuery } from "@tanstack/react-query"
import { getSession } from "@/lib/allauth"
import { queryKeys } from "@/lib/queries/keys"

export function useAuthSession() {
  return useQuery({
    queryKey: queryKeys.authSession,
    queryFn: getSession,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
  })
}
