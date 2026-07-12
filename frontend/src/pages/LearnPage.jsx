import { Badge } from "@/components/ui/badge"
import PageHeader from "@/components/layout/PageHeader"
import SpotlightCard from "@/components/reactbits/SpotlightCard"
import SectionPill from "@/components/reactbits/SectionPill"

const POKER_HANDS = [
  {
    rank: 1,
    name: "Royal Flush",
    description: "A, K, Q, J, 10, all of the same suit.",
    example: ["A♠", "K♠", "Q♠", "J♠", "10♠"],
    tint: "bg-primary/12",
  },
  {
    rank: 2,
    name: "Straight Flush",
    description: "Five cards in sequence, all in the same suit.",
    example: ["8♥", "7♥", "6♥", "5♥", "4♥"],
    tint: "bg-primary/8",
  },
  {
    rank: 3,
    name: "Four of a Kind",
    description: "All four cards of the same rank.",
    example: ["K♣", "K♦", "K♥", "K♠", "2♣"],
    tint: "bg-primary/10",
  },
  {
    rank: 4,
    name: "Full House",
    description: "Three of a kind combined with a pair.",
    example: ["K♠", "K♥", "K♦", "8♣", "8♠"],
    tint: "bg-primary/6",
  },
  {
    rank: 5,
    name: "Flush",
    description: "Any five cards of the same suit, not in sequence.",
    example: ["Q♦", "10♦", "7♦", "6♦", "4♦"],
    tint: "bg-primary/12",
  },
  {
    rank: 6,
    name: "Straight",
    description: "Five cards in sequence, not all the same suit.",
    example: ["9♥", "8♣", "7♠", "6♦", "5♥"],
    tint: "bg-primary/8",
  },
  {
    rank: 7,
    name: "Three of a Kind",
    description: "Three cards of the same rank.",
    example: ["7♣", "7♠", "7♦", "K♥", "3♠"],
    tint: "bg-primary/10",
  },
  {
    rank: 8,
    name: "Two Pair",
    description: "Two different pairs.",
    example: ["J♥", "J♣", "4♣", "4♠", "9♥"],
    tint: "bg-primary/6",
  },
  {
    rank: 9,
    name: "One Pair",
    description: "Two cards of the same rank.",
    example: ["10♦", "10♠", "8♥", "6♣", "2♦"],
    tint: "bg-primary/8",
  },
  {
    rank: 10,
    name: "High Card",
    description: "No made hand. The highest card plays.",
    example: ["A♣", "J♦", "8♠", "5♥", "2♣"],
    tint: "bg-primary/5",
  },
]

function renderCard(cardStr, idx) {
  const suit = cardStr.slice(-1)
  const rank = cardStr.slice(0, -1)
  const isRed = suit === "♥" || suit === "♦"

  return (
    <div
      key={idx}
      className="flex h-16 w-12 flex-col justify-between rounded-xl border border-border/60 bg-card p-1.5 shadow-sm sm:h-20 sm:w-14"
    >
      <span className={`text-sm font-semibold leading-none ${isRed ? "text-destructive" : "text-foreground"}`}>{rank}</span>
      <span className={`self-end text-base leading-none sm:text-lg ${isRed ? "text-destructive" : "text-foreground"}`}>{suit}</span>
    </div>
  )
}

export default function LearnPage() {
  return (
    <div className="page-stack">
      <PageHeader
        backTo="/tables"
        title="Poker rankings"
        subtitle="From royal flush down to high card."
      />

      <div className="mb-2 flex justify-start">
        <SectionPill text="Hand rankings" />
      </div>

      <div className="space-y-5">
        {POKER_HANDS.map((hand) => (
          <SpotlightCard key={hand.rank} className={`space-y-5 p-5 ${hand.tint}`}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">#{hand.rank}</Badge>
                <h2 className="text-section">{hand.name}</h2>
              </div>
              <p className="text-caption">{hand.description}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 rounded-xl bg-primary/5 p-4">
              {hand.example.map((card, idx) => renderCard(card, idx))}
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  )
}
