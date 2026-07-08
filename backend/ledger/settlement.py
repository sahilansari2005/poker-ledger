from decimal import Decimal


def compute_settlements(players):
    """
    Minimize who-pays-whom transfers from session player net results.
    Each player dict needs name, total_buy_in, and cash_out.
    Returns list of {from_player, to_player, amount}.
    """
    nets = []
    for player in players:
        buy_in = Decimal(str(player.total_buy_in))
        cash_out = Decimal(str(player.cash_out or 0))
        net = cash_out - buy_in
        if abs(net) < Decimal("0.01"):
            continue
        nets.append((player.name, net))

    debtors = sorted(((name, -net) for name, net in nets if net < 0), key=lambda item: item[1], reverse=True)
    creditors = sorted(((name, net) for name, net in nets if net > 0), key=lambda item: item[1], reverse=True)

    settlements = []
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        debtor_name, debt = debtors[i]
        creditor_name, credit = creditors[j]
        amount = min(debt, credit)
        settlements.append(
            {
                "from_player": debtor_name,
                "to_player": creditor_name,
                "amount": amount.quantize(Decimal("0.01")),
            }
        )
        debt -= amount
        credit -= amount
        if debt < Decimal("0.01"):
            i += 1
        else:
            debtors[i] = (debtor_name, debt)
        if credit < Decimal("0.01"):
            j += 1
        else:
            creditors[j] = (creditor_name, credit)

    return settlements
