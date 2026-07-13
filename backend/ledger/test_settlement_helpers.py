from decimal import Decimal

from django.test import SimpleTestCase

from ledger.settlement import (
    MONEY_TOLERANCE,
    discrepancy_between,
    has_discrepancy,
    quantize_money,
)


class SettlementHelpersTests(SimpleTestCase):
    def test_discrepancy_helpers(self):
        self.assertEqual(discrepancy_between("100.00", "99.50"), Decimal("0.50"))
        self.assertFalse(has_discrepancy(Decimal("0.005")))
        self.assertTrue(has_discrepancy(Decimal("0.02")))
        self.assertEqual(quantize_money("1.239"), Decimal("1.24"))
        self.assertEqual(MONEY_TOLERANCE, Decimal("0.01"))
