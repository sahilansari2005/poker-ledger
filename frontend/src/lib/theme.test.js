import { afterEach, describe, expect, it, vi } from "vitest"
import {
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  isThemeOption,
  readStoredTheme,
  resolveTheme,
} from "./theme"

describe("theme", () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove("dark")
    document.documentElement.style.colorScheme = ""
    vi.restoreAllMocks()
  })

  it("validates theme options", () => {
    expect(isThemeOption("system")).toBe(true)
    expect(isThemeOption("light")).toBe(true)
    expect(isThemeOption("dark")).toBe(true)
    expect(isThemeOption("auto")).toBe(false)
  })

  it("reads stored theme and falls back to system", () => {
    expect(readStoredTheme()).toBe("system")
    localStorage.setItem(THEME_STORAGE_KEY, "light")
    expect(readStoredTheme()).toBe("light")
    localStorage.setItem(THEME_STORAGE_KEY, "nope")
    expect(readStoredTheme()).toBe("system")
  })

  it("resolves preference against system preference", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("dark"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    expect(resolveTheme("light")).toBe("light")
    expect(resolveTheme("dark")).toBe("dark")
    expect(resolveTheme("system")).toBe("dark")
  })

  it("applies dark class and theme-color meta", () => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      document.head.appendChild(meta)
    }

    applyResolvedTheme("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe("light")
    expect(meta.getAttribute("content")).toBe("#e4eaf5")

    applyResolvedTheme("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe("dark")
    expect(meta.getAttribute("content")).toBe("#1a1d2b")
  })
})
