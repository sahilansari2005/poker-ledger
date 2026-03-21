import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card"
import { Input } from "../components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { useLocalStorage } from "../hooks/useLocalStorage"

export type Table = {
  id: string
  name: string
  defaultBuyIn: number
  members: string[]
}

export default function Dashboard() {
  const [tables, setTables] = useLocalStorage<Table[]>("poker_tables", [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [buyIn, setBuyIn] = useState("10")
  const [membersStr, setMembersStr] = useState("")

  const handleCreateTable = () => {
    if (!name || !buyIn) return
    const members = membersStr.split(",").map(s => s.trim()).filter(Boolean)
    const newTable: Table = {
      id: `table-${Date.now()}`,
      name,
      defaultBuyIn: parseFloat(buyIn) || 10,
      members
    }
    setTables([...tables, newTable])
    setIsDialogOpen(false)
    setName("")
    setMembersStr("")
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Tables</h1>
        <Button className="w-full sm:w-auto shadow-sm" onClick={() => setIsDialogOpen(true)}>Create Table</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tables.map(table => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle>{table.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {table.members?.length || 0} players • Buy-in: £{table.defaultBuyIn || 10}
              </p>
              <Link to={`/table/${table.id}`} className="block w-full">
                <Button className="w-full">Open</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {tables.length === 0 && (
          <div className="md:col-span-2 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20">
            <h3 className="text-lg font-semibold text-foreground mb-1">No tables yet</h3>
            <p className="text-muted-foreground text-sm mb-4">You haven't created any poker tables.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="secondary">Create your first table</Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Table Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. March High Rollers"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Buy-in (£)</label>
              <Input 
                type="number"
                value={buyIn} 
                onChange={e => setBuyIn(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Members (comma separated)</label>
              <Input 
                value={membersStr} 
                onChange={e => setMembersStr(e.target.value)} 
                placeholder="Ali, Fayyad, John"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTable}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
