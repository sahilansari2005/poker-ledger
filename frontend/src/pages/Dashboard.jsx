import { useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Users, Coins, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { useLocalStorage } from "@/hooks/useLocalStorage"

export default function Dashboard() {
  const [tables, setTables] = useLocalStorage("poker_tables", [])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [buyIn, setBuyIn] = useState("10")
  const [membersStr, setMembersStr] = useState("")

  const handleCreateTable = () => {
    if (!name || !buyIn) return
    const members = membersStr.split(",").map(s => s.trim()).filter(Boolean)
    const newTable = {
      id: `table-${Date.now()}`,
      name,
      defaultBuyIn: parseFloat(buyIn) || 10,
      members
    }
    setTables([...tables, newTable])
    setIsDialogOpen(false)
    setName("")
    setMembersStr("")
    setBuyIn("10")
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center pt-12 sm:pt-20 px-4">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full point-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-ring/20 blur-[120px] rounded-full point-events-none" />

      <div className="w-full max-w-5xl space-y-8 z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-both">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-border/40">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Your Tables
            </h1>
            <p className="text-muted-foreground text-lg">Manage your ongoing poker sessions and groups.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 group">
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" />
                Create Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">New Poker Table</DialogTitle>
                <DialogDescription>
                  Set up the stakes and add members to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Table Name</Label>
                  <Input 
                    id="name"
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. March High Rollers"
                    className="h-12 bg-background/50 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyin" className="text-sm font-semibold">Default Buy-in (£)</Label>
                  <Input 
                    id="buyin"
                    type="number"
                    value={buyIn} 
                    onChange={e => setBuyIn(e.target.value)} 
                    className="h-12 bg-background/50 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="members" className="text-sm font-semibold">Members</Label>
                  <Input 
                    id="members"
                    value={membersStr} 
                    onChange={e => setMembersStr(e.target.value)} 
                    placeholder="Ali, Fayyad, John (comma separated)"
                    className="h-12 bg-background/50 focus-visible:ring-primary/50"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateTable} className="rounded-xl shadow-md">Create Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table, i) => (
            <Card 
              key={table.id} 
              className={`group relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:bg-card/60 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both`}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="pb-3 border-b border-border/10">
                <CardTitle className="text-xl font-bold flex items-center justify-between">
                  <span className="truncate">{table.name}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-xs font-medium uppercase tracking-wider mt-2">
                  <span className="flex items-center gap-1.5 opacity-80">
                    <Users className="w-3.5 h-3.5" /> {table.members?.length || 0}
                  </span>
                  <span className="flex items-center gap-1.5 opacity-80 text-primary">
                    <Coins className="w-3.5 h-3.5" /> £{table.defaultBuyIn || 10}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {(table.members || []).slice(0, 4).map(m => (
                    <span key={m} className="px-2 py-1 bg-secondary/80 rounded-md text-[10px] font-semibold tracking-wide border border-border/40">
                      {m}
                    </span>
                  ))}
                  {(table.members || []).length > 4 && (
                    <span className="px-2 py-1 bg-secondary/40 rounded-md text-[10px] font-semibold text-muted-foreground border border-border/20">
                      +{(table.members || []).length - 4} more
                    </span>
                  )}
                  {(table.members || []).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No members added yet</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Link to={`/table/${table.id}`} className="w-full">
                  <Button variant="secondary" className="w-full group/btn relative overflow-hidden bg-secondary/50 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                    <span className="relative z-10 flex items-center justify-center font-semibold">
                      Open Table
                      <ChevronRight className="w-4 h-4 ml-1.5 opacity-0 -translate-x-2 transition-all duration-300 group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                    </span>
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          
          {tables.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-500 delay-200 fill-mode-both border-2 border-dashed border-border/40 rounded-3xl bg-card/10">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold">No Tables Yet</h3>
              <p className="text-muted-foreground max-w-sm">Create your first poker table to start tracking buy-ins, cashes, and analyzing your friend group's stats.</p>
              <Button variant="outline" className="mt-4 rounded-full border-border/50 bg-background/50 backdrop-blur-md" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Quick Create
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
