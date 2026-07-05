
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/layout/PageHeader"

const POKER_HANDS = [
  {
    rank: 1,
    name: "Royal Flush",
    description: "The absolute best possible hand. A, K, Q, J, 10, all of the same suit.",
    example: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
    color: "from-amber-400 to-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: null
  },
  {
    rank: 2,
    name: "Straight Flush",
    description: "Five cards in sequential order, all in the same suit.",
    example: ["8♥", "7♥", "6♥", "5♥", "4♥"],
    color: "from-slate-300 to-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: null
  },
  {
    rank: 3,
    name: "Four of a Kind",
    description: "All four cards of the same rank.",
    example: ["K♣", "K♦", "K♥", "K♠", "2♣"],
    color: "from-amber-600 to-amber-700",
    bg: "bg-amber-700/10",
    border: "border-amber-700/20",
    icon: null
  },
  {
    rank: 4,
    name: "Full House",
    description: "Three of a kind combined with a pair.",
    example: ["K♠", "K♥", "K♦", "8♣", "8♠"],
    color: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: null
  },
  {
    rank: 5,
    name: "Flush",
    description: "Any five cards of the same suit, but not in a sequence.",
    example: ["Q♦", "10♦", "7♦", "6♦", "4♦"],
    color: "from-blue-400 to-blue-600",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: null
  },
  {
    rank: 6,
    name: "Straight",
    description: "Five cards in a sequence, but not of the same suit.",
    example: ["9♥", "8♣", "7♠", "6♦", "5♥"],
    color: "from-indigo-400 to-indigo-600",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    icon: null
  },
  {
    rank: 7,
    name: "Three of a Kind",
    description: "Three cards of the same rank.",
    example: ["7♣", "7♠", "7♦", "K♥", "3♠"],
    color: "from-purple-400 to-purple-600",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: null
  },
  {
    rank: 8,
    name: "Two Pair",
    description: "Two different pairs.",
    example: ["J♥", "J♣", "4♣", "4♠", "9♥"],
    color: "from-pink-400 to-pink-600",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    icon: null
  },
  {
    rank: 9,
    name: "One Pair",
    description: "Two cards of the same rank.",
    example: ["10♦", "10♠", "8♥", "6♣", "2♦"],
    color: "from-rose-400 to-rose-600",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: null
  },
  {
    rank: 10,
    name: "High Card",
    description: "When you haven't made any of the hands above, the highest card plays.",
    example: ["A♣", "J♦", "8♠", "5♥", "2♣"],
    color: "from-muted-foreground to-muted-foreground/50",
    bg: "bg-secondary/30",
    border: "border-border/50",
    icon: null
  }
]

const renderCard = (cardStr, idx) => {
  const suit = cardStr.slice(-1)
  const rank = cardStr.slice(0, -1)
  const isRed = suit === "♥" || suit === "♦"
  
  return (
    <div key={idx} className={`w-12 h-16 sm:w-14 sm:h-20 bg-white dark:bg-zinc-100 rounded-md shadow-sm border border-black/10 flex flex-col justify-between p-1.5 ring-1 ring-inset ring-black/5 animate-in fade-in zoom-in-95 duration-500 hover:-translate-y-1 transition-transform`} style={{ animationDelay: `${idx * 100}ms` }}>
      <span className={`text-sm sm:text-base font-bold leading-none ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>{rank}</span>
      <span className={`text-xl sm:text-2xl leading-none self-end ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>{suit}</span>
    </div>
  )
}

export default function LearnPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        backTo="/"
        title="Poker Rankings"
        subtitle="From royal flush down to high card."
      />

      <div className="space-y-4">
        {POKER_HANDS.map((hand) => (
          <Card key={hand.rank} className={`${hand.bg} border-l-4 ${hand.border}`}>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">#{hand.rank}</Badge>
                  <h2 className={`text-lg font-bold bg-gradient-to-r ${hand.color} bg-clip-text text-transparent`}>
                    {hand.name}
                  </h2>
                </div>
                <p className="text-sm text-foreground/80">{hand.description}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 rounded-xl bg-black/5 p-3 dark:bg-black/20">
                {hand.example.map((card, idx) => renderCard(card, idx))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
