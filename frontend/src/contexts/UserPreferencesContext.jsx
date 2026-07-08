import { createContext, useCallback, useContext, useMemo } from "react"
import { FACTORY_CHIP_VALUES } from "@/lib/chipDefaults"
import { DEFAULT_CURRENCY } from "@/lib/currency"
import { useMe, useUpdateMe } from "@/lib/queries"

const UserPreferencesContext = createContext(null)

export function UserPreferencesProvider({ children }) {
  const { data: me, isLoading, isError } = useMe()
  const updateMe = useUpdateMe()

  const defaultCurrency = me?.default_currency || DEFAULT_CURRENCY
  const chipDefaultValues = me?.chip_default_values?.length
    ? me.chip_default_values.map(String)
    : [...FACTORY_CHIP_VALUES]
  const sessionSortOrder = me?.session_sort_order === "asc" ? "asc" : "desc"

  const savePreferences = useCallback(
    (fields) =>
      new Promise((resolve, reject) => {
        updateMe.mutate(fields, {
          onSuccess: resolve,
          onError: reject,
        })
      }),
    [updateMe]
  )

  const value = useMemo(
    () => ({
      isLoading,
      isError,
      isReady: Boolean(me),
      defaultCurrency,
      chipDefaultValues,
      sessionSortOrder,
      savePreferences,
      isSaving: updateMe.isPending,
    }),
    [
      isLoading,
      isError,
      me,
      defaultCurrency,
      chipDefaultValues,
      sessionSortOrder,
      savePreferences,
      updateMe.isPending,
    ]
  )

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider")
  }
  return context
}
