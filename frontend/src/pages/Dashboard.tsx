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
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Your Tables</h1>
        <Button className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)}>Create Table</Button>
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
          <div className="text-muted-foreground p-4">No tables yet. Create one!</div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Table</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Table Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. March High Rollers"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Default Buy-in (£)</label>
              <Input 
                type="number"
                value={buyIn} 
                onChange={e => setBuyIn(e.target.value)} 
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Members (comma separated)</label>
              <Input 
                value={membersStr} 
                onChange={e => setMembersStr(e.target.value)} 
                placeholder="Ali, Fayyad, John"
                className="mt-1"
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
