export const THEME_STORAGE_KEY = "poker-ledger-theme"
export const THEME_OPTIONS = ["system", "light", "dark"]
export const THEME_COLORS = {
  light: "#e4eaf5",
  dark: "#1a1d2b",
}

export function isThemeOption(value) {
  return THEME_OPTIONS.includes(value)
}

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeOption(stored) ? stored : "system"
  } catch {
    return "system"
  }
}

export function getSystemPrefersDark() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

/** @param {"system"|"light"|"dark"} preference */
export function resolveTheme(preference) {
  if (preference === "light") return "light"
  if (preference === "dark") return "dark"
  return getSystemPrefersDark() ? "dark" : "light"
}

/** Apply resolved light/dark to <html> and theme-color meta. */
export function applyResolvedTheme(resolved) {
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.style.colorScheme = resolved

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[resolved] || THEME_COLORS.dark)
  }
}
