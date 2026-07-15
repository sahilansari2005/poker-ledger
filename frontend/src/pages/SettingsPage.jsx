import { useState, useEffect } from "react"
import { Monitor, Moon, Plus, Sun, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import MoneyInput from "@/components/ui/MoneyInput"
import PageHeader from "@/components/layout/PageHeader"
import CurrencySelect from "@/components/CurrencySelect"
import AccountCard from "@/components/auth/AccountCard"
import DataImportCard from "@/components/settings/DataImportCard"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import { FACTORY_CHIP_VALUES } from "@/lib/chipDefaults"
import { getCurrencySymbol } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { useTheme } from "@/contexts/ThemeContext"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

const APPEARANCE_OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
]

export default function SettingsPage() {
  const {
    defaultCurrency,
    chipDefaultValues,
    savePreferences,
    isSaving,
    isReady,
  } = useUserPreferences()
  const { theme, setTheme } = useTheme()

  const [values, setValues] = useState(chipDefaultValues)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [saved, setSaved] = useState(false)
  const [currencySaved, setCurrencySaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isReady) return
    setValues(chipDefaultValues)
    setCurrency(defaultCurrency)
  }, [isReady, chipDefaultValues, defaultCurrency])

  const currencySymbol = getCurrencySymbol(currency)

  const updateValue = (index, val) => {
    setValues(prev => prev.map((v, i) => (i === index ? val : v)))
    setSaved(false)
  }

  const addRow = () => {
    setValues(prev => [...prev, "1"])
    setSaved(false)
  }

  const removeRow = (index) => {
    if (values.length <= 1) return
    setValues(prev => prev.filter((_, i) => i !== index))
    setSaved(false)
  }

  const handleSave = async () => {
    const cleaned = values.map(v => v.trim()).filter(v => v !== "")
    if (cleaned.length === 0) {
      setError("Add at least one chip value.")
      return
    }
    const invalid = cleaned.find(v => isNaN(parseFloat(v)) || parseFloat(v) < 0)
    if (invalid !== undefined) {
      setError("Each value must be a valid positive number.")
      return
    }

    try {
      await savePreferences({ chip_default_values: cleaned })
      setValues(cleaned)
      setError("")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message || "Could not save chip values.")
    }
  }

  const handleResetFactory = async () => {
    try {
      await savePreferences({ chip_default_values: [...FACTORY_CHIP_VALUES] })
      setValues([...FACTORY_CHIP_VALUES])
      setError("")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message || "Could not reset chip values.")
    }
  }

  const handleSaveCurrency = async () => {
    try {
      await savePreferences({ default_currency: currency })
      setCurrencySaved(true)
      setTimeout(() => setCurrencySaved(false), 2000)
    } catch (err) {
      setError(err.message || "Could not save currency.")
    }
  }

  return (
    <div className="page-stack ui-stagger">
      <PageHeader
        title="Settings"
        subtitle="Theme, currency, chips, account, and imports."
      />

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">
              Match your device, or pin the app to light or dark.
            </p>
          </div>
          <SectionPill text="Theme" />
        </div>
        <div
          className="grid grid-cols-3 gap-2"
          role="radiogroup"
          aria-label="Color theme"
        >
          {APPEARANCE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = theme === value
            return (
              <Button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                variant={selected ? "default" : "outline"}
                className={cn("h-11 gap-2")}
                onClick={() => setTheme(value)}
              >
                <Icon className="size-4" />
                {label}
              </Button>
            )
          })}
        </div>
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Default currency</h2>
            <p className="text-sm text-muted-foreground">
              Used for the chip calculator and as the default when you create a table.
            </p>
          </div>
          <SectionPill text="Currency" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-currency">Currency</Label>
            <CurrencySelect
              id="default-currency"
              value={currency}
              onChange={setCurrency}
            />
          </div>
          {currencySaved && <p className="text-sm text-primary">Currency saved.</p>}
          <Button className="w-full" size="lg" onClick={handleSaveCurrency} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save currency"}
          </Button>
        </div>
      </SpotlightCard>

      <SpotlightCard className="ui-card-hover space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Default chip values</h2>
            <p className="text-sm text-muted-foreground">
              These denominations load when you open the chip calculator or tap Reset.
            </p>
          </div>
          <SectionPill text="Chips" />
        </div>
        <div className="space-y-4">
          {values.map((value, index) => (
            <div key={index} className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label className="text-caption">Chip {index + 1} ({currencySymbol})</Label>
                <MoneyInput
                  currencySymbol={currencySymbol}
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={e => updateValue(index, e.target.value)}
                  aria-label={`Chip ${index + 1} value`}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive hover:text-destructive"
                onClick={() => removeRow(index)}
                disabled={values.length <= 1}
                aria-label="Remove chip value"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}

          <Button variant="outline" className="w-full" onClick={addRow}>
            <Plus className="size-4" /> Add denomination
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-primary">Saved.</p>}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button className="flex-1" size="lg" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save defaults"}
            </Button>
            <Button variant="outline" className="flex-1" size="lg" onClick={handleResetFactory} disabled={isSaving}>
              <RotateCcw className="size-4" />
              Reset to factory
            </Button>
          </div>
        </div>
      </SpotlightCard>

      <AccountCard />

      <DataImportCard />
    </div>
  )
}
