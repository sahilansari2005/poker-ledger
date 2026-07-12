import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileUp, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"
import { Label } from "@/components/ui/label"
import { useIngestData } from "@/lib/queries"

function formatIngestSummary(result) {
  const tableCount = result?.tables_created ?? 0
  const sessionCount = result?.sessions_created ?? 0
  const transferCount = result?.transfers_created ?? 0
  const names = (result?.tables || []).map((table) => table.name).join(", ")
  const transferPart = transferCount ? ` and ${transferCount} cash transfer(s)` : ""
  return `Imported ${tableCount} table(s), ${sessionCount} session(s)${transferPart}${names ? `: ${names}` : ""}.`
}

export default function DataImportCard() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const ingest = useIngestData()
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setJsonText(text)
      setError("")
      setSuccess("")
    } catch {
      setError("Could not read that file.")
    } finally {
      event.target.value = ""
    }
  }

  const handleImport = async () => {
    setError("")
    setSuccess("")

    let payload
    try {
      payload = JSON.parse(jsonText)
    } catch {
      setError("Invalid JSON. Check the file format and try again.")
      return
    }

    if (!payload?.tables || !Array.isArray(payload.tables) || payload.tables.length === 0) {
      setError('JSON must include a non-empty "tables" array.')
      return
    }

    try {
      const result = await ingest.mutateAsync(payload)
      setSuccess(formatIngestSummary(result))
      setJsonText("")
      if (result.tables?.length === 1) {
        navigate(`/table/${result.tables[0].id}`)
      } else {
        navigate("/tables")
      }
    } catch (err) {
      setError(err.message || "Import failed.")
    }
  }

  return (
    <SpotlightCard className="ui-card-hover space-y-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Import data</h2>
          <p className="text-sm text-muted-foreground">
            Upload a JSON export to create tables, members, and completed sessions in your account.
          </p>
        </div>
        <SectionPill text="JSON" />
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="import-json">JSON payload</Label>
          <textarea
            id="import-json"
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value)
              setError("")
              setSuccess("")
            }}
            placeholder={'{\n  "tables": [{\n    "name": "...",\n    "transfers": [\n      { "from_player": "Aadi", "to_player": "Daksh", "amount": "50.00" }\n    ],\n    "sessions": []\n  }]\n}'}
            rows={8}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[160px] w-full rounded-md border px-3 py-2 font-mono text-xs focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
            disabled={ingest.isPending}
          >
            <FileUp className="mr-2 size-4" />
            Choose file
          </Button>
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl"
            onClick={handleImport}
            disabled={ingest.isPending || !jsonText.trim()}
          >
            <Upload className="mr-2 size-4" />
            {ingest.isPending ? "Importing…" : "Import to my account"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Sessions with buy-in/cash-out mismatches are imported anyway and marked in the audit log.
          Player names are stored exactly as provided.
          Use <code className="text-foreground">transfers</code> for off-table cash payments between players.
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-primary">{success}</p>}
      </div>
    </SpotlightCard>
  )
}
