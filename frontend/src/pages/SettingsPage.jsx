import { useState, useEffect } from "react"
import { Plus, Trash2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageHeader from "@/components/layout/PageHeader"
import CurrencySelect from "@/components/CurrencySelect"
import AccountCard from "@/components/auth/AccountCard"
import DataImportCard from "@/components/settings/DataImportCard"
import { FACTORY_CHIP_VALUES } from "@/lib/chipDefaults"
import { getCurrencySymbol } from "@/lib/currency"
import { useUserPreferences } from "@/contexts/UserPreferencesContext"

export default function SettingsPage() {
  const {
    defaultCurrency,
    chipDefaultValues,
    savePreferences,
    isSaving,
    isReady,
  } = useUserPreferences()

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
    <div className="space-y-5 ui-stagger">
      <PageHeader
        title="Settings"
        subtitle="Account, imports, currency, and chip defaults."
      />

      <AccountCard />

      <DataImportCard />

      <Card className="ui-card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Default currency</CardTitle>
          <CardDescription>
            Used for the chip calculator and as the default when you create a new table.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="default-currency">Currency</Label>
            <CurrencySelect
              id="default-currency"
              value={currency}
              onChange={setCurrency}
            />
          </div>
          {currencySaved && <p className="text-sm text-primary">Currency saved.</p>}
          <Button className="h-12 w-full rounded-xl" onClick={handleSaveCurrency} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save currency"}
          </Button>
        </CardContent>
      </Card>

      <Card className="ui-card-hover">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Default chip values</CardTitle>
          <CardDescription>
            These denominations load when you open the chip calculator or tap Reset.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {values.map((value, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Chip {index + 1} ({currencySymbol})</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">{currencySymbol}</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={value}
                    onChange={e => updateValue(index, e.target.value)}
                    className="pl-8"
                  />
                </div>
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

          <Button variant="outline" className="h-11 w-full" onClick={addRow}>
            <Plus className="mr-2 size-4" /> Add denomination
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {saved && <p className="text-sm text-primary">Saved.</p>}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button className="h-12 flex-1 rounded-xl" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save defaults"}
            </Button>
            <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={handleResetFactory} disabled={isSaving}>
              <RotateCcw className="mr-2 size-4" />
              Reset to factory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
