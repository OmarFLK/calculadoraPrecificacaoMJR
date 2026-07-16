import unittest

from services.historical_pricing_service import calculate_historical_suggestion


class HistoricalPricingServiceTest(unittest.TestCase):
    def test_calculates_median_for_even_sample(self) -> None:
        suggestion = calculate_historical_suggestion(
            "Tecnologia",
            [10000, 24000, 18000, 50000],
        )

        self.assertEqual(21000, suggestion["median_price"])
        self.assertEqual(4, suggestion["sample_count"])
        self.assertEqual(10000, suggestion["minimum_price"])
        self.assertEqual(50000, suggestion["maximum_price"])

    def test_returns_empty_suggestion_without_history(self) -> None:
        suggestion = calculate_historical_suggestion("Design", [])

        self.assertIsNone(suggestion["median_price"])
        self.assertEqual(0, suggestion["sample_count"])


if __name__ == "__main__":
    unittest.main()
